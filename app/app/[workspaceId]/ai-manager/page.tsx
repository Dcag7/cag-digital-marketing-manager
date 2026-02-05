import { prisma } from '@/lib/db';
import { AIManagerClient } from './ai-manager-client';

export default async function AIManagerPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  // Get workspace data for context
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      businessProfile: true,
    },
  });

  // Get recent performance summary
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const recentInsights = await prisma.metaInsightDaily.findMany({
    where: {
      workspaceId,
      date: { gte: startDate, lte: endDate },
      level: 'CAMPAIGN',
    },
    select: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      purchaseValue: true,
    },
  });

  const totals = recentInsights.reduce(
    (acc, i) => ({
      spend: acc.spend + (i.spend || 0),
      impressions: acc.impressions + (i.impressions || 0),
      clicks: acc.clicks + (i.clicks || 0),
      purchases: acc.purchases + (i.purchases || 0),
      revenue: acc.revenue + (i.purchaseValue || 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0 }
  );

  const performanceSummary = {
    spend: totals.spend,
    revenue: totals.revenue,
    roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
    purchases: totals.purchases,
    cpa: totals.purchases > 0 ? totals.spend / totals.purchases : 0,
    impressions: totals.impressions,
    clicks: totals.clicks,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
  };

  // Get active campaigns count
  const activeCampaigns = await prisma.metaCampaign.count({
    where: {
      workspaceId,
      status: 'ACTIVE',
    },
  });

  return (
    <AIManagerClient
      workspaceId={workspaceId}
      workspaceName={workspace?.name || 'Workspace'}
      businessProfile={workspace?.businessProfile || null}
      performanceSummary={performanceSummary}
      activeCampaigns={activeCampaigns}
    />
  );
}
