import 'server-only';
import { prisma } from '@/lib/db';
import { StrategicMode } from '@prisma/client';

export interface EntityPerformance {
  entityId: string;
  entityName: string;
  level: 'campaign' | 'adset' | 'ad' | 'adgroup';
  channel: 'META' | 'GOOGLE';
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  purchases: number;
  impressions: number;
  clicks: number;
  ctr: number;
  frequency?: number;
}

export interface RuleResult {
  action: 'SCALE' | 'REDUCE' | 'PAUSE' | 'HOLD';
  entity: EntityPerformance;
  reason: string;
  suggestedBudgetChange?: number; // percentage
}

export async function analyzeEntityPerformance(
  workspaceId: string,
  days: number = 7
): Promise<EntityPerformance[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results: EntityPerformance[] = [];

  // Meta campaigns
  const metaCampaigns = await prisma.metaCampaign.findMany({
    where: { workspaceId },
  });

  for (const campaign of metaCampaigns) {
    const insights = await prisma.metaInsightDaily.aggregate({
      where: {
        workspaceId,
        entityId: campaign.campaignId,
        level: 'CAMPAIGN',
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        spend: true,
        purchaseValue: true,
        purchases: true,
        impressions: true,
        clicks: true,
      },
      _avg: {
        ctr: true,
        frequency: true,
      },
    });

    const spend = insights._sum.spend || 0;
    const revenue = insights._sum.purchaseValue || 0;
    const purchases = insights._sum.purchases || 0;

    if (spend > 0) {
      results.push({
        entityId: campaign.campaignId,
        entityName: campaign.name,
        level: 'campaign',
        channel: 'META',
        spend,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        cpa: purchases > 0 ? spend / purchases : 0,
        purchases,
        impressions: insights._sum.impressions || 0,
        clicks: insights._sum.clicks || 0,
        ctr: insights._avg.ctr || 0,
        frequency: insights._avg.frequency || undefined,
      });
    }
  }

  // Google campaigns
  const googleCampaigns = await prisma.googleCampaign.findMany({
    where: { workspaceId },
  });

  for (const campaign of googleCampaigns) {
    const insights = await prisma.googleInsightDaily.aggregate({
      where: {
        workspaceId,
        entityId: campaign.campaignId,
        level: 'CAMPAIGN',
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        costMicros: true,
        conversionValue: true,
        conversions: true,
        impressions: true,
        clicks: true,
      },
      _avg: {
        ctr: true,
      },
    });

    const spend = Number(insights._sum.costMicros || 0) / 1_000_000;
    const revenue = Number(insights._sum.conversionValue || 0);
    const conversions = Number(insights._sum.conversions || 0);

    if (spend > 0) {
      results.push({
        entityId: campaign.campaignId,
        entityName: campaign.name,
        level: 'campaign',
        channel: 'GOOGLE',
        spend,
        revenue,
        roas: spend > 0 ? revenue / spend : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        purchases: conversions,
        impressions: insights._sum.impressions || 0,
        clicks: insights._sum.clicks || 0,
        ctr: insights._avg.ctr || 0,
      });
    }
  }

  return results;
}

export async function applyRules(
  workspaceId: string,
  entities: EntityPerformance[]
): Promise<RuleResult[]> {
  const businessProfile = await prisma.workspaceBusinessProfile.findUnique({
    where: { workspaceId },
  });

  if (!businessProfile) {
    throw new Error('Business profile not configured');
  }

  const results: RuleResult[] = [];

  for (const entity of entities) {
    // Rule 1: ROAS below break-even OR CPA above target -> reduce or pause
    if (entity.roas < businessProfile.breakEvenRoas || entity.cpa > businessProfile.targetCpaZar) {
      // If spend is very low and no purchases, pause
      if (entity.spend < businessProfile.minSpendZar && entity.purchases === 0) {
        results.push({
          action: 'PAUSE',
          entity,
          reason: `ROAS ${entity.roas.toFixed(2)} below break-even (${businessProfile.breakEvenRoas}) or CPA ${entity.cpa.toFixed(2)} above target (${businessProfile.targetCpaZar}). No purchases with low spend.`,
        });
      } else {
        results.push({
          action: 'REDUCE',
          entity,
          reason: `ROAS ${entity.roas.toFixed(2)} below break-even (${businessProfile.breakEvenRoas}) or CPA ${entity.cpa.toFixed(2)} above target (${businessProfile.targetCpaZar}).`,
          suggestedBudgetChange: -30, // Reduce by 30%
        });
      }
      continue;
    }

    // Rule 2: High spend with zero purchases -> pause
    if (entity.spend >= businessProfile.minSpendZar && entity.purchases === 0) {
      results.push({
        action: 'PAUSE',
        entity,
        reason: `Spend ${entity.spend.toFixed(2)} ZAR with zero purchases.`,
      });
      continue;
    }

    // Rule 3: Frequency too high + CTR drop -> creative refresh (HOLD for now, will create task)
    if (entity.frequency && entity.frequency > 3 && entity.ctr < 1.0) {
      results.push({
        action: 'HOLD',
        entity,
        reason: `High frequency (${entity.frequency.toFixed(2)}) with low CTR (${entity.ctr.toFixed(2)}%). Creative refresh needed.`,
      });
      continue;
    }

    // Rule 4: Winner -> scale (within guardrails)
    if (entity.roas > businessProfile.breakEvenRoas * 1.2 && entity.cpa < businessProfile.targetCpaZar * 0.8) {
      results.push({
        action: 'SCALE',
        entity,
        reason: `Strong performance: ROAS ${entity.roas.toFixed(2)} (${(businessProfile.breakEvenRoas * 1.2).toFixed(2)} target), CPA ${entity.cpa.toFixed(2)} (${(businessProfile.targetCpaZar * 0.8).toFixed(2)} target).`,
        suggestedBudgetChange: 15, // Scale by 15%
      });
      continue;
    }

    // Default: HOLD
    results.push({
      action: 'HOLD',
      entity,
      reason: 'Performance within acceptable range. No action needed.',
    });
  }

  return results;
}
