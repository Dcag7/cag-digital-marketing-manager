import 'server-only';
import { decryptJson } from '@/lib/encryption';
import { prisma } from '@/lib/db';

interface MetaTokenData {
  accessToken: string;
  adAccountId: string;
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
    throw new Error('Meta integration not connected');
  }

  const tokenData = decryptJson<MetaTokenData>(secret.encryptedJson);
  return tokenData.accessToken;
}

export async function fetchMetaAPI(
  workspaceId: string,
  endpoint: string,
  params?: Record<string, string>
): Promise<unknown> {
  const token = await getMetaAccessToken(workspaceId);
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Meta app credentials not configured');
  }

  const url = new URL(`https://graph.facebook.com/v21.0/${endpoint}`);
  url.searchParams.set('access_token', token);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Meta API error: ${response.status} ${error}`);
  }

  return response.json();
}

export async function syncMetaAdAccounts(workspaceId: string) {
  const data = await fetchMetaAPI(workspaceId, 'me/adaccounts', {
    fields: 'id,name,account_id,currency,timezone',
  }) as { data: Array<{ id: string; name: string; account_id: string; currency: string; timezone: string }> };

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
        name: account.name,
        currency: account.currency,
        timezone: account.timezone,
      },
      update: {
        name: account.name,
        currency: account.currency,
        timezone: account.timezone,
      },
    });
  }
}

export async function syncMetaCampaigns(workspaceId: string, accountId: string) {
  // Ensure we don't double-prefix with act_
  const cleanAccountId = accountId.replace(/^act_/, '');
  const data = await fetchMetaAPI(workspaceId, `act_${cleanAccountId}/campaigns`, {
    fields: 'id,name,status,objective',
  }) as { data: Array<{ id: string; name: string; status: string; objective?: string }> };

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
        accountId,
        campaignId: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective || null,
      },
      update: {
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective || null,
      },
    });
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

  for (const account of accounts) {
    // Ensure we don't double-prefix with act_
    const cleanAccountId = account.accountId.replace(/^act_/, '');
    
    // Sync campaigns first
    await syncMetaCampaigns(workspaceId, account.accountId);

    const campaigns = await prisma.metaCampaign.findMany({
      where: { workspaceId, accountId: account.accountId },
    });

    for (const campaign of campaigns) {
      // Fetch insights for campaign
      const insights = await fetchMetaAPI(workspaceId, `act_${cleanAccountId}/insights`, {
        level: 'campaign',
        time_range: JSON.stringify({
          since: startDate.toISOString().split('T')[0],
          until: endDate.toISOString().split('T')[0],
        }),
        fields: 'spend,impressions,clicks,ctr,cpc,cpm,frequency,actions,action_values,cost_per_action_type',
        time_increment: '1',
        filtering: JSON.stringify([{ field: 'campaign.id', operator: 'EQUAL', value: campaign.campaignId }]),
      }) as { data: Array<Record<string, unknown>> };

      for (const insight of insights.data) {
        const date = new Date(insight.date_start as string);
        
        // Extract purchase data from actions array
        const actions = (insight.actions as Array<{ action_type: string; value: string }>) || [];
        const actionValues = (insight.action_values as Array<{ action_type: string; value: string }>) || [];
        
        const purchaseAction = actions.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
        const purchaseValueAction = actionValues.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
        
        const purchases = purchaseAction ? parseInt(purchaseAction.value) || 0 : 0;
        const purchaseValue = purchaseValueAction ? parseFloat(purchaseValueAction.value) || 0 : 0;
        const spend = parseFloat(insight.spend as string) || 0;
        const purchaseRoas = spend > 0 ? purchaseValue / spend : null;
        
        await prisma.metaInsightDaily.upsert({
          where: {
            workspaceId_date_level_entityId: {
              workspaceId,
              date,
              level: 'CAMPAIGN',
              entityId: campaign.campaignId,
            },
          },
          create: {
            workspaceId,
            date,
            level: 'CAMPAIGN',
            entityId: campaign.campaignId,
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
    }
  }
}
