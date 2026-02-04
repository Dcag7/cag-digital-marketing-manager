import 'server-only';
import { prisma } from '@/lib/db';
import { subDays } from 'date-fns';

export interface MetricsPeriod {
  startDate: Date;
  endDate: Date;
}

export interface ChannelMetrics {
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  ctr: number;
  cvr?: number;
  frequency?: number;
  impressions: number;
  clicks: number;
  purchases: number;
}

export interface WorkspaceMetrics {
  meta: ChannelMetrics;
  google: ChannelMetrics;
  total: ChannelMetrics;
  profit?: number;
}

export async function calculateWorkspaceMetrics(
  workspaceId: string,
  days: number = 7
): Promise<WorkspaceMetrics> {
  const endDate = new Date();
  const startDate = subDays(endDate, days);

  // Get business profile for profit calculation
  const businessProfile = await prisma.workspaceBusinessProfile.findUnique({
    where: { workspaceId },
  });

  // Meta metrics
  const metaInsights = await prisma.metaInsightDaily.aggregate({
    where: {
      workspaceId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      purchaseValue: true,
    },
    _avg: {
      ctr: true,
      frequency: true,
    },
  });

  // Google metrics
  const googleInsights = await prisma.googleInsightDaily.aggregate({
    where: {
      workspaceId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      impressions: true,
      clicks: true,
      conversions: true,
      conversionValue: true,
    },
    _avg: {
      ctr: true,
    },
  });

  // Convert Google cost from micros
  const googleCostMicros = await prisma.googleInsightDaily.aggregate({
    where: {
      workspaceId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      costMicros: true,
    },
  });

  // Shopify revenue (truth source)
  const shopifyRevenue = await prisma.shopifyOrder.aggregate({
    where: {
      workspaceId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      totalPrice: true,
    },
  });

  const metaSpend = metaInsights._sum.spend || 0;
  const metaImpressions = metaInsights._sum.impressions || 0;
  const metaClicks = metaInsights._sum.clicks || 0;
  const metaPurchases = metaInsights._sum.purchases || 0;
  const metaPurchaseValue = metaInsights._sum.purchaseValue || 0;
  const metaCtr = metaInsights._avg.ctr || 0;
  const metaFrequency = metaInsights._avg.frequency || 0;

  const googleSpend = Number(googleCostMicros._sum.costMicros || 0) / 1_000_000;
  const googleImpressions = googleInsights._sum.impressions || 0;
  const googleClicks = googleInsights._sum.clicks || 0;
  const googleConversions = googleInsights._sum.conversions || 0;
  const googleConversionValue = googleInsights._sum.conversionValue || 0;
  const googleCtr = googleInsights._avg.ctr || 0;

  const totalRevenue = shopifyRevenue._sum.totalPrice || 0;
  const totalSpend = metaSpend + googleSpend;

  const meta: ChannelMetrics = {
    spend: metaSpend,
    revenue: metaPurchaseValue, // Attribution from Meta
    roas: metaSpend > 0 ? metaPurchaseValue / metaSpend : 0,
    cpa: metaPurchases > 0 ? metaSpend / metaPurchases : 0,
    ctr: metaCtr,
    frequency: metaFrequency,
    impressions: metaImpressions,
    clicks: metaClicks,
    purchases: metaPurchases,
  };

  const google: ChannelMetrics = {
    spend: googleSpend,
    revenue: googleConversionValue,
    roas: googleSpend > 0 ? googleConversionValue / googleSpend : 0,
    cpa: googleConversions > 0 ? googleSpend / googleConversions : 0,
    ctr: googleCtr,
    cvr: googleClicks > 0 ? googleConversions / googleClicks : 0,
    impressions: googleImpressions,
    clicks: googleClicks,
    purchases: googleConversions,
  };

  const total: ChannelMetrics = {
    spend: totalSpend,
    revenue: totalRevenue,
    roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    cpa: (metaPurchases + googleConversions) > 0
      ? totalSpend / (metaPurchases + googleConversions)
      : 0,
    ctr: (metaImpressions + googleImpressions) > 0
      ? ((metaClicks + googleClicks) / (metaImpressions + googleImpressions)) * 100
      : 0,
    impressions: metaImpressions + googleImpressions,
    clicks: metaClicks + googleClicks,
    purchases: metaPurchases + googleConversions,
  };

  // Calculate profit if business profile exists
  let profit: number | undefined;
  if (businessProfile) {
    const margin = businessProfile.grossMarginPct;
    const fees = businessProfile.paymentFeesPct;
    const shipping = businessProfile.avgShippingCostZar;
    const returns = businessProfile.returnRatePct;

    // Approximate profit calculation
    const grossProfit = totalRevenue * margin;
    const feesCost = totalRevenue * fees;
    const shippingCost = shipping * (metaPurchases + googleConversions);
    const returnsCost = totalRevenue * returns;
    profit = grossProfit - feesCost - shippingCost - returnsCost - totalSpend;
  }

  return {
    meta,
    google,
    total,
    profit,
  };
}
