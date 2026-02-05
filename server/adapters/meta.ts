import 'server-only';
import { decryptJson } from '@/lib/encryption';
import { prisma } from '@/lib/db';

// Use latest stable API version
const META_API_VERSION = 'v21.0';

interface MetaTokenData {
  accessToken: string;
  adAccountId: string;
}

interface MetaAPIError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export async function getMetaAccessToken(workspaceId: string): Promise<string> {
  const secret = await prisma.encryptedSecret.findUnique({
    where: {
      workspaceId_integrationType: {
        workspaceId,
        integrationType: 'META',
      },
    },
  });

  if (!secret) {
    throw new Error('Meta integration not connected. Please reconnect in Settings.');
  }

  const tokenData = decryptJson<MetaTokenData>(secret.encryptedJson);
  
  if (!tokenData.accessToken) {
    throw new Error('Invalid Meta credentials. Please reconnect in Settings.');
  }
  
  return tokenData.accessToken;
}

export async function fetchMetaAPI(
  workspaceId: string,
  endpoint: string,
  params?: Record<string, string>
): Promise<unknown> {
  const token = await getMetaAccessToken(workspaceId);

  const url = new URL(`https://graph.facebook.com/${META_API_VERSION}/${endpoint}`);
  url.searchParams.set('access_token', token);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  console.log(`Fetching Meta API: ${endpoint}`);
  const response = await fetch(url.toString());
  const data = await response.json();
  
  if (!response.ok || data.error) {
    const errorData = data as MetaAPIError;
    const errorMessage = errorData.error?.message || 'Unknown Meta API error';
    const errorCode = errorData.error?.code || response.status;
    
    // Handle specific error codes
    if (errorCode === 190) {
      throw new Error('Meta access token is invalid or expired. Please reconnect in Settings.');
    }
    if (errorCode === 17 || errorCode === 4) {
      throw new Error('Meta API rate limit reached. Please try again in a few minutes.');
    }
    if (errorCode === 100) {
      throw new Error(`Meta API field error: ${errorMessage}`);
    }
    
    throw new Error(`Meta API error (${errorCode}): ${errorMessage}`);
  }

  return data;
}

// Helper to normalize account ID (remove act_ prefix if present)
function normalizeAccountId(accountId: string): string {
  return accountId.replace(/^act_/, '');
}

export async function syncMetaAdAccounts(workspaceId: string) {
  try {
    const data = await fetchMetaAPI(workspaceId, 'me/adaccounts', {
      fields: 'id,name,account_id,currency,timezone_name',
      limit: '100',
    }) as { data?: Array<{ id: string; name: string; account_id: string; currency: string; timezone_name: string }> };

    if (!data.data || data.data.length === 0) {
      console.log(`No ad accounts found for workspace ${workspaceId}`);
      return;
    }

    for (const account of data.data) {
      await prisma.metaAdAccount.upsert({
        where: {
          workspaceId_accountId: {
            workspaceId,
            accountId: account.account_id,
          },
        },
        create: {
          id: `${workspaceId}_${account.account_id}`,
          workspaceId,
          accountId: account.account_id,
          name: account.name || `Account ${account.account_id}`,
          currency: account.currency || 'USD',
          timezone: account.timezone_name || 'UTC',
        },
        update: {
          name: account.name || `Account ${account.account_id}`,
          currency: account.currency || 'USD',
          timezone: account.timezone_name || 'UTC',
        },
      });
    }
    
    console.log(`Synced ${data.data.length} ad accounts for workspace ${workspaceId}`);
  } catch (error) {
    console.error(`Failed to sync ad accounts for workspace ${workspaceId}:`, error);
    throw error;
  }
}

export async function syncMetaCampaigns(workspaceId: string, accountId: string) {
  const cleanAccountId = normalizeAccountId(accountId);
  
  try {
    // Get ALL campaigns - don't filter by status so we capture paused/inactive ones too
    const data = await fetchMetaAPI(workspaceId, `act_${cleanAccountId}/campaigns`, {
      fields: 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,updated_time',
      limit: '500',
    }) as { data?: Array<{ id: string; name: string; status: string; effective_status?: string; objective?: string }> };

    if (!data.data || data.data.length === 0) {
      console.log(`No campaigns found for account ${cleanAccountId}`);
      return;
    }

    console.log(`Found ${data.data.length} campaigns for account ${cleanAccountId}:`);
    for (const campaign of data.data) {
      console.log(`  - ${campaign.name} (${campaign.id}): status=${campaign.status}, effective=${campaign.effective_status}`);
      await prisma.metaCampaign.upsert({
        where: {
          workspaceId_campaignId: {
            workspaceId,
            campaignId: campaign.id,
          },
        },
        create: {
          id: `${workspaceId}_${campaign.id}`,
          workspaceId,
          accountId: accountId,
          campaignId: campaign.id,
          name: campaign.name || `Campaign ${campaign.id}`,
          status: campaign.status || 'UNKNOWN',
          objective: campaign.objective || null,
        },
        update: {
          name: campaign.name || `Campaign ${campaign.id}`,
          status: campaign.status || 'UNKNOWN',
          objective: campaign.objective || null,
        },
      });
    }
    
    console.log(`Synced ${data.data.length} campaigns for account ${cleanAccountId}`);
  } catch (error) {
    console.error(`Failed to sync campaigns for account ${cleanAccountId}:`, error);
    throw error;
  }
}

export async function syncMetaInsights(
  workspaceId: string,
  days: number = 7
): Promise<void> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Format dates as YYYY-MM-DD
  const since = startDate.toISOString().split('T')[0];
  const until = endDate.toISOString().split('T')[0];

  console.log(`Syncing insights from ${since} to ${until} (${days} days)`);

  const accounts = await prisma.metaAdAccount.findMany({
    where: { workspaceId },
  });

  if (accounts.length === 0) {
    await syncMetaAdAccounts(workspaceId);
    const newAccounts = await prisma.metaAdAccount.findMany({
      where: { workspaceId },
    });
    
    if (newAccounts.length === 0) {
      throw new Error('No ad accounts found. Make sure your token has access to at least one ad account.');
    }
    
    accounts.push(...newAccounts);
  }

  for (const account of accounts) {
    const cleanAccountId = normalizeAccountId(account.accountId);
    
    // Sync campaigns first
    await syncMetaCampaigns(workspaceId, account.accountId);

    // Fetch insights at account level with campaign breakdown - this is more reliable
    try {
      console.log(`Fetching insights for account ${cleanAccountId}...`);
      
      const insights = await fetchMetaAPI(workspaceId, `act_${cleanAccountId}/insights`, {
        level: 'campaign',
        time_range: JSON.stringify({ since, until }),
        // Core metrics that are always available
        fields: 'campaign_id,campaign_name,date_start,date_stop,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,action_values',
        time_increment: '1', // Daily breakdown
        limit: '5000',
      }) as { data?: Array<Record<string, unknown>> };

      if (!insights.data || insights.data.length === 0) {
        console.log(`No insights data for account ${cleanAccountId} in the last ${days} days`);
        continue;
      }

      console.log(`Processing ${insights.data.length} insight records for account ${cleanAccountId}`);

      let processedCount = 0;
      for (const insight of insights.data) {
        if (!insight.campaign_id || !insight.date_start) {
          continue;
        }
        
        const date = new Date(insight.date_start as string);
        const campaignId = insight.campaign_id as string;
        
        // Extract purchase data from actions array
        const actions = (insight.actions as Array<{ action_type: string; value: string }>) || [];
        const actionValues = (insight.action_values as Array<{ action_type: string; value: string }>) || [];
        
        // Look for purchase action - use only ONE type to avoid double counting
        // Priority: offsite_conversion.fb_pixel_purchase > purchase > omni_purchase
        let purchases = 0;
        let purchaseValue = 0;
        
        // Find the best purchase action (most specific first)
        const purchaseAction = 
          actions.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase') ||
          actions.find(a => a.action_type === 'purchase') ||
          actions.find(a => a.action_type === 'omni_purchase');
        
        const valueAction = 
          actionValues.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase') ||
          actionValues.find(a => a.action_type === 'purchase') ||
          actionValues.find(a => a.action_type === 'omni_purchase');
        
        if (purchaseAction) {
          purchases = parseInt(purchaseAction.value) || 0;
        }
        if (valueAction) {
          purchaseValue = parseFloat(valueAction.value) || 0;
        }
        
        const spend = parseFloat(insight.spend as string) || 0;
        
        // Debug logging
        console.log(`Campaign ${campaignId} (${insight.date_start}): spend=${spend}, purchases=${purchases}, revenue=${purchaseValue}`);
        const purchaseRoas = spend > 0 && purchaseValue > 0 ? purchaseValue / spend : null;
        
        // Make sure campaign exists in our database
        const existingCampaign = await prisma.metaCampaign.findUnique({
          where: {
            workspaceId_campaignId: { workspaceId, campaignId },
          },
        });

        if (!existingCampaign) {
          // Create the campaign if it doesn't exist
          await prisma.metaCampaign.create({
            data: {
              id: `${workspaceId}_${campaignId}`,
              workspaceId,
              accountId: account.accountId,
              campaignId,
              name: (insight.campaign_name as string) || `Campaign ${campaignId}`,
              status: 'ACTIVE',
              objective: null,
            },
          });
        }
        
        await prisma.metaInsightDaily.upsert({
          where: {
            workspaceId_date_level_entityId: {
              workspaceId,
              date,
              level: 'CAMPAIGN',
              entityId: campaignId,
            },
          },
          create: {
            workspaceId,
            date,
            level: 'CAMPAIGN',
            entityId: campaignId,
            spend,
            impressions: parseInt(insight.impressions as string) || 0,
            clicks: parseInt(insight.clicks as string) || 0,
            ctr: parseFloat(insight.ctr as string) || 0,
            cpc: parseFloat(insight.cpc as string) || 0,
            cpm: parseFloat(insight.cpm as string) || 0,
            frequency: null,
            purchases,
            purchaseValue,
            purchaseRoas,
          },
          update: {
            spend,
            impressions: parseInt(insight.impressions as string) || 0,
            clicks: parseInt(insight.clicks as string) || 0,
            ctr: parseFloat(insight.ctr as string) || 0,
            cpc: parseFloat(insight.cpc as string) || 0,
            cpm: parseFloat(insight.cpm as string) || 0,
            frequency: null,
            purchases,
            purchaseValue,
            purchaseRoas,
          },
        });
        
        processedCount++;
      }
      
      console.log(`Saved ${processedCount} insight records for account ${cleanAccountId}`);
    } catch (error) {
      console.error(`Failed to sync insights for account ${cleanAccountId}:`, error);
      throw error; // Re-throw so user sees the error
    }
  }
}

// Utility function to test the connection
export async function testMetaConnection(workspaceId: string): Promise<{ success: boolean; message: string; accountName?: string }> {
  try {
    const token = await getMetaAccessToken(workspaceId);
    
    const data = await fetchMetaAPI(workspaceId, 'me', {
      fields: 'id,name',
    }) as { id: string; name: string };
    
    return {
      success: true,
      message: 'Connection successful',
      accountName: data.name,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}
