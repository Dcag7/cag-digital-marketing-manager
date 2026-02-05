import { prisma } from '@/lib/db';
import { CampaignsClient } from './campaigns-client';

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  // Get all campaigns
  const metaCampaigns = await prisma.metaCampaign.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
  });

  // Get the date range of synced data
  const [minDate, maxDate] = await Promise.all([
    prisma.metaInsightDaily.findFirst({
      where: { workspaceId },
      orderBy: { date: 'asc' },
      select: { date: true },
    }),
    prisma.metaInsightDaily.findFirst({
      where: { workspaceId },
      orderBy: { date: 'desc' },
      select: { date: true },
    }),
  ]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const syncedDateRange = {
    start: minDate?.date ? formatDate(minDate.date) : 'Not synced',
    end: maxDate?.date ? formatDate(maxDate.date) : 'Not synced',
  };

  // Get ALL daily insights for the workspace (we'll filter client-side for date range)
  const insights = await prisma.metaInsightDaily.findMany({
    where: {
      workspaceId,
      level: 'CAMPAIGN',
    },
    select: {
      date: true,
      entityId: true,
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      purchaseValue: true,
    },
    orderBy: { date: 'desc' },
  });

  // Transform insights to the format expected by the client
  const dailyInsights = insights.map(i => ({
    date: i.date.toISOString(),
    campaignId: i.entityId,
    spend: i.spend || 0,
    impressions: i.impressions || 0,
    clicks: i.clicks || 0,
    purchases: i.purchases || 0,
    revenue: i.purchaseValue || 0,
  }));

  // Calculate default metrics (last 7 days) for initial render
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const last7DaysInsights = dailyInsights.filter(i => {
    const d = new Date(i.date);
    return d >= startDate && d <= endDate;
  });

  // Aggregate by campaign for default view
  const metricsMap = new Map<string, {
    spend: number;
    impressions: number;
    clicks: number;
    purchases: number;
    revenue: number;
    roas: number;
    cpa: number;
  }>();

  for (const insight of last7DaysInsights) {
    const existing = metricsMap.get(insight.campaignId) || {
      spend: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0, roas: 0, cpa: 0
    };
    
    existing.spend += insight.spend;
    existing.impressions += insight.impressions;
    existing.clicks += insight.clicks;
    existing.purchases += insight.purchases;
    existing.revenue += insight.revenue;
    
    metricsMap.set(insight.campaignId, existing);
  }

  // Calculate ROAS and CPA
  for (const [id, metrics] of metricsMap) {
    metrics.roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
    metrics.cpa = metrics.purchases > 0 ? metrics.spend / metrics.purchases : 0;
    metricsMap.set(id, metrics);
  }

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
      dailyInsights={dailyInsights}
      syncedDateRange={syncedDateRange}
    />
  );
}
