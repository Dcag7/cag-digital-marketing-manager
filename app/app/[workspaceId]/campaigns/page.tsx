import { prisma } from '@/lib/db';
import { CampaignsClient } from './campaigns-client';

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  // Get campaigns with their insights aggregated
  const metaCampaigns = await prisma.metaCampaign.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
  });

  // Get insights for the last 7 days for quick metrics
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const insights = await prisma.metaInsightDaily.groupBy({
    by: ['entityId'],
    where: {
      workspaceId,
      level: 'CAMPAIGN',
      date: { gte: sevenDaysAgo },
    },
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      purchaseValue: true,
    },
  });

  // Create a map of campaign metrics
  const metricsMap = new Map(
    insights.map((i) => [
      i.entityId,
      {
        spend: i._sum.spend || 0,
        impressions: i._sum.impressions || 0,
        clicks: i._sum.clicks || 0,
        purchases: i._sum.purchases || 0,
        revenue: i._sum.purchaseValue || 0,
        roas: i._sum.spend && i._sum.spend > 0 
          ? (i._sum.purchaseValue || 0) / i._sum.spend 
          : 0,
        cpa: i._sum.purchases && i._sum.purchases > 0 
          ? (i._sum.spend || 0) / i._sum.purchases 
          : 0,
      },
    ])
  );

  // Combine campaigns with their metrics
  const campaignsWithMetrics = metaCampaigns.map((campaign) => ({
    id: campaign.id,
    campaignId: campaign.campaignId,
    name: campaign.name,
    status: campaign.status,
    objective: campaign.objective,
    metrics: metricsMap.get(campaign.campaignId) || {
      spend: 0,
      impressions: 0,
      clicks: 0,
      purchases: 0,
      revenue: 0,
      roas: 0,
      cpa: 0,
    },
  }));

  // Get Google campaigns (basic for now)
  const googleCampaigns = await prisma.googleCampaign.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
  });

  return (
    <CampaignsClient
      workspaceId={workspaceId}
      metaCampaigns={campaignsWithMetrics}
      googleCampaigns={googleCampaigns.map((c) => ({
        id: c.id,
        campaignId: c.campaignId,
        name: c.name,
        status: c.status,
        metrics: { spend: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0, roas: 0, cpa: 0 },
      }))}
    />
  );
}
