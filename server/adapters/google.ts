import 'server-only';
import { decryptJson, encryptJson } from '@/lib/encryption';
import { prisma } from '@/lib/db';

interface GoogleTokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  obtained_at: number;
}

export async function getGoogleAccessToken(workspaceId: string): Promise<string> {
  const secret = await prisma.encryptedSecret.findUnique({
    where: {
      workspaceId_integrationType: {
        workspaceId,
        integrationType: 'GOOGLE_ADS',
      },
    },
  });

  if (!secret) {
    throw new Error('Google Ads integration not connected');
  }

  const tokenData = decryptJson<GoogleTokenData>(secret.encryptedJson);

  // Check if token is expired (with 5 minute buffer)
  const expiresAt = tokenData.obtained_at + (tokenData.expires_in * 1000) - (5 * 60 * 1000);
  
  if (Date.now() > expiresAt) {
    // Refresh the token
    const refreshedToken = await refreshGoogleToken(workspaceId, tokenData.refresh_token);
    return refreshedToken;
  }

  return tokenData.access_token;
}

async function refreshGoogleToken(workspaceId: string, refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google credentials not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Google token: ${error}`);
  }

  const tokenData = await response.json();

  // Update stored token
  const encrypted = encryptJson({
    access_token: tokenData.access_token,
    refresh_token: refreshToken, // Keep existing refresh token
    token_type: tokenData.token_type,
    expires_in: tokenData.expires_in,
    scope: tokenData.scope,
    obtained_at: Date.now(),
  });

  await prisma.encryptedSecret.update({
    where: {
      workspaceId_integrationType: {
        workspaceId,
        integrationType: 'GOOGLE_ADS',
      },
    },
    data: {
      encryptedJson: encrypted,
    },
  });

  return tokenData.access_token;
}

interface GoogleAdsQueryResponse {
  results?: Array<{
    customer?: { id: string; descriptiveName: string };
    campaign?: { id: string; name: string; status: string; campaignBudget?: string };
    adGroup?: { id: string; name: string; status: string };
    adGroupAd?: { ad: { id: string; type: string }; status: string };
    metrics?: {
      costMicros?: string;
      impressions?: string;
      clicks?: string;
      ctr?: string;
      averageCpc?: string;
      conversions?: string;
      conversionsValue?: string;
    };
    segments?: {
      date?: string;
    };
  }>;
}

export async function fetchGoogleAdsAPI(
  workspaceId: string,
  customerId: string,
  query: string
): Promise<GoogleAdsQueryResponse> {
  const accessToken = await getGoogleAccessToken(workspaceId);
  const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN;

  if (!developerToken) {
    throw new Error('Google Ads developer token not configured');
  }

  const response = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Ads API error: ${response.status} ${error}`);
  }

  return response.json();
}

export async function syncGoogleCampaigns(workspaceId: string, customerId: string): Promise<void> {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `;

  const data = await fetchGoogleAdsAPI(workspaceId, customerId, query);

  for (const result of data.results || []) {
    if (!result.campaign) continue;

    const campaignId = result.campaign.id;

    await prisma.googleCampaign.upsert({
      where: {
        workspaceId_campaignId: {
          workspaceId,
          campaignId,
        },
      },
      create: {
        id: `${workspaceId}_${campaignId}`,
        workspaceId,
        customerId,
        campaignId,
        name: result.campaign.name,
        status: result.campaign.status,
        budgetAmountMicros: result.campaign.campaignBudget
          ? BigInt(result.campaign.campaignBudget)
          : null,
      },
      update: {
        name: result.campaign.name,
        status: result.campaign.status,
        budgetAmountMicros: result.campaign.campaignBudget
          ? BigInt(result.campaign.campaignBudget)
          : null,
      },
    });
  }
}

export async function syncGoogleAdGroups(workspaceId: string, customerId: string): Promise<void> {
  const query = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status,
      campaign.id
    FROM ad_group
    WHERE ad_group.status != 'REMOVED'
  `;

  const data = await fetchGoogleAdsAPI(workspaceId, customerId, query);

  for (const result of data.results || []) {
    if (!result.adGroup || !result.campaign) continue;

    const adGroupId = result.adGroup.id;
    const campaignId = result.campaign.id;

    // First ensure campaign exists
    const campaign = await prisma.googleCampaign.findUnique({
      where: {
        workspaceId_campaignId: {
          workspaceId,
          campaignId,
        },
      },
    });

    if (!campaign) continue;

    await prisma.googleAdGroup.upsert({
      where: {
        workspaceId_adGroupId: {
          workspaceId,
          adGroupId,
        },
      },
      create: {
        id: `${workspaceId}_${adGroupId}`,
        workspaceId,
        campaignId,
        adGroupId,
        name: result.adGroup.name,
        status: result.adGroup.status,
      },
      update: {
        name: result.adGroup.name,
        status: result.adGroup.status,
      },
    });
  }
}

export async function syncGoogleAds(workspaceId: string, customerId: string): Promise<void> {
  const query = `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.type,
      ad_group_ad.status,
      ad_group.id
    FROM ad_group_ad
    WHERE ad_group_ad.status != 'REMOVED'
  `;

  const data = await fetchGoogleAdsAPI(workspaceId, customerId, query);

  for (const result of data.results || []) {
    if (!result.adGroupAd || !result.adGroup) continue;

    const adId = result.adGroupAd.ad.id;
    const adGroupId = result.adGroup.id;

    // First ensure ad group exists
    const adGroup = await prisma.googleAdGroup.findUnique({
      where: {
        workspaceId_adGroupId: {
          workspaceId,
          adGroupId,
        },
      },
    });

    if (!adGroup) continue;

    await prisma.googleAd.upsert({
      where: {
        workspaceId_adId: {
          workspaceId,
          adId,
        },
      },
      create: {
        id: `${workspaceId}_${adId}`,
        workspaceId,
        adGroupId,
        adId,
        type: result.adGroupAd.ad.type,
        status: result.adGroupAd.status,
      },
      update: {
        type: result.adGroupAd.ad.type,
        status: result.adGroupAd.status,
      },
    });
  }
}

export async function syncGoogleInsights(workspaceId: string, days: number = 7): Promise<void> {
  // Get all Google Ads accounts for this workspace
  const accounts = await prisma.googleAdsAccount.findMany({
    where: { workspaceId },
  });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

  for (const account of accounts) {
    // First sync campaigns, ad groups, and ads
    await syncGoogleCampaigns(workspaceId, account.customerId);
    await syncGoogleAdGroups(workspaceId, account.customerId);
    await syncGoogleAds(workspaceId, account.customerId);

    // Sync campaign-level insights
    const campaignQuery = `
      SELECT
        campaign.id,
        segments.date,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${startDateStr}' AND '${endDateStr}'
    `;

    const campaignData = await fetchGoogleAdsAPI(workspaceId, account.customerId, campaignQuery);

    for (const result of campaignData.results || []) {
      if (!result.campaign || !result.segments?.date || !result.metrics) continue;

      const date = new Date(
        result.segments.date.substring(0, 4) + '-' +
        result.segments.date.substring(4, 6) + '-' +
        result.segments.date.substring(6, 8)
      );

      await prisma.googleInsightDaily.upsert({
        where: {
          workspaceId_date_level_entityId: {
            workspaceId,
            date,
            level: 'CAMPAIGN',
            entityId: result.campaign.id,
          },
        },
        create: {
          workspaceId,
          date,
          level: 'CAMPAIGN',
          entityId: result.campaign.id,
          costMicros: BigInt(result.metrics.costMicros || '0'),
          impressions: parseInt(result.metrics.impressions || '0'),
          clicks: parseInt(result.metrics.clicks || '0'),
          ctr: parseFloat(result.metrics.ctr || '0'),
          averageCpc: parseFloat(result.metrics.averageCpc || '0'),
          conversions: parseFloat(result.metrics.conversions || '0'),
          conversionValue: parseFloat(result.metrics.conversionsValue || '0'),
        },
        update: {
          costMicros: BigInt(result.metrics.costMicros || '0'),
          impressions: parseInt(result.metrics.impressions || '0'),
          clicks: parseInt(result.metrics.clicks || '0'),
          ctr: parseFloat(result.metrics.ctr || '0'),
          averageCpc: parseFloat(result.metrics.averageCpc || '0'),
          conversions: parseFloat(result.metrics.conversions || '0'),
          conversionValue: parseFloat(result.metrics.conversionsValue || '0'),
        },
      });
    }
  }
}

// Mutation functions for execution
export async function updateGoogleCampaignBudget(
  workspaceId: string,
  customerId: string,
  campaignId: string,
  newBudgetMicros: bigint
): Promise<void> {
  const accessToken = await getGoogleAccessToken(workspaceId);
  const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN;

  if (!developerToken) {
    throw new Error('Google Ads developer token not configured');
  }

  // Get the campaign's budget resource name
  const campaign = await prisma.googleCampaign.findUnique({
    where: {
      workspaceId_campaignId: {
        workspaceId,
        campaignId,
      },
    },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Update budget via mutate
  const response = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/campaignBudgets:mutate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operations: [
          {
            updateMask: 'amountMicros',
            update: {
              resourceName: `customers/${customerId}/campaignBudgets/${campaignId}`,
              amountMicros: newBudgetMicros.toString(),
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Google campaign budget: ${error}`);
  }

  // Update local database
  await prisma.googleCampaign.update({
    where: {
      workspaceId_campaignId: {
        workspaceId,
        campaignId,
      },
    },
    data: {
      budgetAmountMicros: newBudgetMicros,
    },
  });
}

export async function updateGoogleCampaignStatus(
  workspaceId: string,
  customerId: string,
  campaignId: string,
  status: 'ENABLED' | 'PAUSED'
): Promise<void> {
  const accessToken = await getGoogleAccessToken(workspaceId);
  const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN;

  if (!developerToken) {
    throw new Error('Google Ads developer token not configured');
  }

  const response = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/campaigns:mutate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operations: [
          {
            updateMask: 'status',
            update: {
              resourceName: `customers/${customerId}/campaigns/${campaignId}`,
              status,
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Google campaign status: ${error}`);
  }

  // Update local database
  await prisma.googleCampaign.update({
    where: {
      workspaceId_campaignId: {
        workspaceId,
        campaignId,
      },
    },
    data: {
      status,
    },
  });
}

export async function updateGoogleAdGroupStatus(
  workspaceId: string,
  customerId: string,
  adGroupId: string,
  status: 'ENABLED' | 'PAUSED'
): Promise<void> {
  const accessToken = await getGoogleAccessToken(workspaceId);
  const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN;

  if (!developerToken) {
    throw new Error('Google Ads developer token not configured');
  }

  const response = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/adGroups:mutate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operations: [
          {
            updateMask: 'status',
            update: {
              resourceName: `customers/${customerId}/adGroups/${adGroupId}`,
              status,
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Google ad group status: ${error}`);
  }

  // Update local database
  await prisma.googleAdGroup.update({
    where: {
      workspaceId_adGroupId: {
        workspaceId,
        adGroupId,
      },
    },
    data: {
      status,
    },
  });
}
