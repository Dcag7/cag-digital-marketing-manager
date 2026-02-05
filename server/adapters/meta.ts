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
    const data = await fetchMetaAPI(workspaceId, `act_${cleanAccountId}/campaigns`, {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time',
      limit: '500',
      // Only get campaigns that aren't deleted
      filtering: JSON.stringify([{ field: 'effective_status', operator: 'NOT_IN', value: ['DELETED'] }]),
    }) as { data?: Array<{ id: string; name: string; status: string; objective?: string }> };

    if (!data.data || data.data.length === 0) {
      console.log(`No campaigns found for account ${cleanAccountId}`);
      return;
    }

    for (const campaign of data.data) {
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
          accountId: accountId, // Keep original format for consistency
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

  const accounts = await prisma.metaAdAccount.findMany({
    where: { workspaceId },
  });

  if (accounts.length === 0) {
    // Try to sync ad accounts first
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

    const campaigns = await prisma.metaCampaign.findMany({
      where: { workspaceId, accountId: account.accountId },
    });

    if (campaigns.length === 0) {
      console.log(`No campaigns to sync insights for in account ${cleanAccountId}`);
      continue;
    }

    // Fetch insights at account level with campaign breakdown (more efficient)
    try {
      const insights = await fetchMetaAPI(workspaceId, `act_${cleanAccountId}/insights`, {
        level: 'campaign',
        time_range: JSON.stringify({
          since: startDate.toISOString().split('T')[0],
          until: endDate.toISOString().split('T')[0],
        }),
        // Use only well-supported fields
        fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values',
        time_increment: '1',
        limit: '1000',
      }) as { data?: Array<Record<string, unknown>> };

      if (!insights.data || insights.data.length === 0) {
        console.log(`No insights data for account ${cleanAccountId} in the last ${days} days`);
        continue;
      }

      for (const insight of insights.data) {
        // Skip if no campaign_id (shouldn't happen but just in case)
        if (!insight.campaign_id) continue;
        
        const date = new Date(insight.date_start as string);
        
        // Extract purchase data from actions array (handles various action types)
        const actions = (insight.actions as Array<{ action_type: string; value: string }>) || [];
        const actionValues = (insight.action_values as Array<{ action_type: string; value: string }>) || [];
        
        // Look for various purchase action types
        const purchaseActionTypes = ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'];
        const purchaseAction = actions.find(a => purchaseActionTypes.includes(a.action_type));
        const purchaseValueAction = actionValues.find(a => purchaseActionTypes.includes(a.action_type));
        
        const purchases = purchaseAction ? parseInt(purchaseAction.value) || 0 : 0;
        const purchaseValue = purchaseValueAction ? parseFloat(purchaseValueAction.value) || 0 : 0;
        const spend = parseFloat(insight.spend as string) || 0;
        const purchaseRoas = spend > 0 && purchaseValue > 0 ? purchaseValue / spend : null;
        
        await prisma.metaInsightDaily.upsert({
          where: {
            workspaceId_date_level_entityId: {
              workspaceId,
              date,
              level: 'CAMPAIGN',
              entityId: insight.campaign_id as string,
            },
          },
          create: {
            workspaceId,
            date,
            level: 'CAMPAIGN',
            entityId: insight.campaign_id as string,
            spend,
            impressions: parseInt(insight.impressions as string) || 0,
            clicks: parseInt(insight.clicks as string) || 0,
            ctr: parseFloat(insight.ctr as string) || 0,
            cpc: parseFloat(insight.cpc as string) || 0,
            cpm: parseFloat(insight.cpm as string) || 0,
            frequency: insight.frequency ? parseFloat(insight.frequency as string) : null,
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
            frequency: insight.frequency ? parseFloat(insight.frequency as string) : null,
            purchases,
            purchaseValue,
            purchaseRoas,
          },
        });
      }
      
      console.log(`Synced ${insights.data.length} insight records for account ${cleanAccountId}`);
    } catch (error) {
      console.error(`Failed to sync insights for account ${cleanAccountId}:`, error);
      // Continue with other accounts even if one fails
    }
  }
}

// Utility function to test the connection
export async function testMetaConnection(workspaceId: string): Promise<{ success: boolean; message: string; accountName?: string }> {
  try {
    const token = await getMetaAccessToken(workspaceId);
    
    // Test with a simple API call
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
