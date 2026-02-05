import { prisma } from '@/lib/db';

export type RecommendationType = 
  | 'SCALE_BUDGET' 
  | 'PAUSE_CAMPAIGN' 
  | 'REDUCE_BUDGET'
  | 'REVIEW_CREATIVE'
  | 'EXPAND_AUDIENCE'
  | 'TEST_NEW_CREATIVE'
  | 'INCREASE_BID'
  | 'OPTIMIZE_TARGETING';

export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';

export interface Recommendation {
  id: string;
  campaignId: string;
  campaignName: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: string;
  metrics: {
    currentSpend: number;
    currentRevenue: number;
    currentRoas: number;
    currentCpa: number;
    purchases: number;
  };
  suggestedAction?: {
    type: 'BUDGET_CHANGE' | 'STATUS_CHANGE' | 'REVIEW';
    currentValue?: number | string;
    suggestedValue?: number | string;
  };
  status: RecommendationStatus;
  createdAt: Date;
}

interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  status: string;
  objective: string | null;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  purchases: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

// Thresholds for recommendations (can be made configurable per workspace)
const THRESHOLDS = {
  // ROAS thresholds
  EXCELLENT_ROAS: 4.0,
  GOOD_ROAS: 2.5,
  BREAK_EVEN_ROAS: 1.0,
  POOR_ROAS: 0.5,
  
  // Minimum spend to consider for recommendations
  MIN_SPEND_FOR_ANALYSIS: 100, // R100 minimum spend
  
  // Days without conversions before suggesting pause
  DAYS_NO_CONVERSIONS: 7,
  
  // Budget increase suggestions
  BUDGET_INCREASE_PERCENT: 20,
  BUDGET_DECREASE_PERCENT: 30,
  
  // CTR thresholds
  LOW_CTR: 0.5,
  GOOD_CTR: 1.5,
};

export async function generateRecommendations(
  workspaceId: string,
  days: number = 7
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  
  // Get date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get campaigns with their aggregated metrics
  const campaigns = await prisma.metaCampaign.findMany({
    where: { workspaceId },
  });
  
  // Get insights aggregated by campaign
  const insights = await prisma.metaInsightDaily.groupBy({
    by: ['entityId'],
    where: {
      workspaceId,
      level: 'CAMPAIGN',
      date: { gte: startDate, lte: endDate },
    },
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      purchaseValue: true,
    },
  });
  
  // Create metrics map
  const metricsMap = new Map<string, CampaignMetrics>();
  
  for (const campaign of campaigns) {
    const insight = insights.find(i => i.entityId === campaign.campaignId);
    
    const spend = insight?._sum.spend || 0;
    const revenue = insight?._sum.purchaseValue || 0;
    const purchases = insight?._sum.purchases || 0;
    const impressions = insight?._sum.impressions || 0;
    const clicks = insight?._sum.clicks || 0;
    
    metricsMap.set(campaign.campaignId, {
      campaignId: campaign.campaignId,
      campaignName: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      spend,
      revenue,
      roas: spend > 0 ? revenue / spend : 0,
      cpa: purchases > 0 ? spend / purchases : 0,
      purchases,
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    });
  }
  
  // Analyze each campaign and generate recommendations
  for (const [campaignId, metrics] of metricsMap) {
    // Skip campaigns with very low spend
    if (metrics.spend < THRESHOLDS.MIN_SPEND_FOR_ANALYSIS) {
      continue;
    }
    
    // Only analyze active campaigns for scaling, but include paused for reactivation
    const isActive = metrics.status.toUpperCase() === 'ACTIVE';
    
    // 1. HIGH ROAS - Scale Budget
    if (isActive && metrics.roas >= THRESHOLDS.EXCELLENT_ROAS && metrics.purchases >= 3) {
      recommendations.push({
        id: `${campaignId}_scale_${Date.now()}`,
        campaignId,
        campaignName: metrics.campaignName,
        type: 'SCALE_BUDGET',
        priority: 'HIGH',
        title: `🚀 Scale "${metrics.campaignName}"`,
        description: `This campaign is performing exceptionally well with ${metrics.roas.toFixed(2)}x ROAS. Consider increasing budget to capture more conversions.`,
        reasoning: `With ${metrics.purchases} purchases at ${metrics.roas.toFixed(2)}x ROAS (${formatCurrency(metrics.cpa)} CPA), this campaign is highly profitable. Scaling budget could increase revenue while maintaining efficiency.`,
        expectedImpact: `Potential additional revenue of ${formatCurrency(metrics.revenue * 0.2)} with ${THRESHOLDS.BUDGET_INCREASE_PERCENT}% budget increase`,
        metrics: {
          currentSpend: metrics.spend,
          currentRevenue: metrics.revenue,
          currentRoas: metrics.roas,
          currentCpa: metrics.cpa,
          purchases: metrics.purchases,
        },
        suggestedAction: {
          type: 'BUDGET_CHANGE',
          currentValue: metrics.spend,
          suggestedValue: metrics.spend * (1 + THRESHOLDS.BUDGET_INCREASE_PERCENT / 100),
        },
        status: 'PENDING',
        createdAt: new Date(),
      });
    }
    
    // 2. GOOD ROAS - Consider Scaling
    else if (isActive && metrics.roas >= THRESHOLDS.GOOD_ROAS && metrics.roas < THRESHOLDS.EXCELLENT_ROAS && metrics.purchases >= 2) {
      recommendations.push({
        id: `${campaignId}_test_scale_${Date.now()}`,
        campaignId,
        campaignName: metrics.campaignName,
        type: 'SCALE_BUDGET',
        priority: 'MEDIUM',
        title: `📈 Test scaling "${metrics.campaignName}"`,
        description: `Campaign showing good performance with ${metrics.roas.toFixed(2)}x ROAS. Test a small budget increase.`,
        reasoning: `${metrics.purchases} purchases with healthy ${metrics.roas.toFixed(2)}x ROAS suggests room for growth. A conservative budget test could reveal scaling potential.`,
        expectedImpact: `Test with 10-15% budget increase to validate scaling potential`,
        metrics: {
          currentSpend: metrics.spend,
          currentRevenue: metrics.revenue,
          currentRoas: metrics.roas,
          currentCpa: metrics.cpa,
          purchases: metrics.purchases,
        },
        suggestedAction: {
          type: 'BUDGET_CHANGE',
          currentValue: metrics.spend,
          suggestedValue: metrics.spend * 1.15,
        },
        status: 'PENDING',
        createdAt: new Date(),
      });
    }
    
    // 3. POOR ROAS with spend - Reduce or Pause
    else if (isActive && metrics.roas < THRESHOLDS.POOR_ROAS && metrics.spend >= THRESHOLDS.MIN_SPEND_FOR_ANALYSIS * 2) {
      recommendations.push({
        id: `${campaignId}_pause_${Date.now()}`,
        campaignId,
        campaignName: metrics.campaignName,
        type: 'PAUSE_CAMPAIGN',
        priority: 'HIGH',
        title: `⚠️ Pause "${metrics.campaignName}"`,
        description: `Campaign underperforming with only ${metrics.roas.toFixed(2)}x ROAS. Spending ${formatCurrency(metrics.spend)} with minimal return.`,
        reasoning: `With ${formatCurrency(metrics.spend)} spent and only ${formatCurrency(metrics.revenue)} revenue (${metrics.purchases} purchases), this campaign is not profitable. Pausing will stop the bleed while you review the strategy.`,
        expectedImpact: `Save ${formatCurrency(metrics.spend / days)} per day by pausing`,
        metrics: {
          currentSpend: metrics.spend,
          currentRevenue: metrics.revenue,
          currentRoas: metrics.roas,
          currentCpa: metrics.cpa,
          purchases: metrics.purchases,
        },
        suggestedAction: {
          type: 'STATUS_CHANGE',
          currentValue: 'ACTIVE',
          suggestedValue: 'PAUSED',
        },
        status: 'PENDING',
        createdAt: new Date(),
      });
    }
    
    // 4. Break-even ROAS - Reduce Budget
    else if (isActive && metrics.roas >= THRESHOLDS.POOR_ROAS && metrics.roas < THRESHOLDS.BREAK_EVEN_ROAS && metrics.spend >= THRESHOLDS.MIN_SPEND_FOR_ANALYSIS * 2) {
      recommendations.push({
        id: `${campaignId}_reduce_${Date.now()}`,
        campaignId,
        campaignName: metrics.campaignName,
        type: 'REDUCE_BUDGET',
        priority: 'MEDIUM',
        title: `📉 Reduce budget for "${metrics.campaignName}"`,
        description: `Campaign at ${metrics.roas.toFixed(2)}x ROAS is below break-even. Reduce budget while optimizing.`,
        reasoning: `${metrics.roas.toFixed(2)}x ROAS means you're losing money on this campaign. Reduce budget by ${THRESHOLDS.BUDGET_DECREASE_PERCENT}% while reviewing targeting and creative.`,
        expectedImpact: `Reduce losses by ${formatCurrency(metrics.spend * THRESHOLDS.BUDGET_DECREASE_PERCENT / 100)} while maintaining presence`,
        metrics: {
          currentSpend: metrics.spend,
          currentRevenue: metrics.revenue,
          currentRoas: metrics.roas,
          currentCpa: metrics.cpa,
          purchases: metrics.purchases,
        },
        suggestedAction: {
          type: 'BUDGET_CHANGE',
          currentValue: metrics.spend,
          suggestedValue: metrics.spend * (1 - THRESHOLDS.BUDGET_DECREASE_PERCENT / 100),
        },
        status: 'PENDING',
        createdAt: new Date(),
      });
    }
    
    // 5. No conversions but spending - Review
    else if (isActive && metrics.purchases === 0 && metrics.spend >= THRESHOLDS.MIN_SPEND_FOR_ANALYSIS) {
      recommendations.push({
        id: `${campaignId}_review_${Date.now()}`,
        campaignId,
        campaignName: metrics.campaignName,
        type: 'REVIEW_CREATIVE',
        priority: 'HIGH',
        title: `🔍 Review "${metrics.campaignName}"`,
        description: `No conversions after spending ${formatCurrency(metrics.spend)}. Creative or targeting may need adjustment.`,
        reasoning: `${formatCurrency(metrics.spend)} spent with ${metrics.impressions.toLocaleString()} impressions but 0 conversions indicates a disconnect. Review your creative, landing page, and audience targeting.`,
        expectedImpact: `Identifying issues could unlock conversion potential`,
        metrics: {
          currentSpend: metrics.spend,
          currentRevenue: metrics.revenue,
          currentRoas: metrics.roas,
          currentCpa: metrics.cpa,
          purchases: metrics.purchases,
        },
        suggestedAction: {
          type: 'REVIEW',
        },
        status: 'PENDING',
        createdAt: new Date(),
      });
    }
    
    // 6. Low CTR - Creative Review
    if (isActive && metrics.ctr < THRESHOLDS.LOW_CTR && metrics.impressions >= 1000) {
      recommendations.push({
        id: `${campaignId}_ctr_${Date.now()}`,
        campaignId,
        campaignName: metrics.campaignName,
        type: 'TEST_NEW_CREATIVE',
        priority: 'LOW',
        title: `🎨 Test new creative for "${metrics.campaignName}"`,
        description: `CTR of ${metrics.ctr.toFixed(2)}% is below average. New creative could improve engagement.`,
        reasoning: `With ${metrics.ctr.toFixed(2)}% CTR from ${metrics.impressions.toLocaleString()} impressions, your ads aren't capturing attention. Testing new creative angles, images, or copy could significantly improve performance.`,
        expectedImpact: `Improving CTR to 1%+ could increase clicks by ${Math.round(metrics.impressions * 0.005)}+`,
        metrics: {
          currentSpend: metrics.spend,
          currentRevenue: metrics.revenue,
          currentRoas: metrics.roas,
          currentCpa: metrics.cpa,
          purchases: metrics.purchases,
        },
        suggestedAction: {
          type: 'REVIEW',
        },
        status: 'PENDING',
        createdAt: new Date(),
      });
    }
  }
  
  // Sort by priority (HIGH first) then by potential impact
  recommendations.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Secondary sort by spend (higher spend = higher impact)
    return b.metrics.currentSpend - a.metrics.currentSpend;
  });
  
  return recommendations;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('ZAR', 'R');
}

// Save recommendation action (approve/reject)
export async function saveRecommendationAction(
  workspaceId: string,
  recommendationId: string,
  action: 'APPROVED' | 'REJECTED',
  notes?: string
): Promise<void> {
  // For now, we'll just log the action
  // In a full implementation, this would save to database and potentially
  // trigger the actual changes via Meta API
  console.log(`Recommendation ${recommendationId} ${action} for workspace ${workspaceId}`, notes);
}
