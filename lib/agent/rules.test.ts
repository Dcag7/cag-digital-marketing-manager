import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    metaCampaign: {
      findMany: vi.fn(),
    },
    googleCampaign: {
      findMany: vi.fn(),
    },
    metaInsightDaily: {
      aggregate: vi.fn(),
    },
    googleInsightDaily: {
      aggregate: vi.fn(),
    },
    workspaceBusinessProfile: {
      findUnique: vi.fn(),
    },
  },
}));

// Import after mocking
import { prisma } from '@/lib/db';
import { analyzeEntityPerformance, applyRules, type EntityPerformance, type RuleResult } from './rules';

describe('Rules Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeEntityPerformance', () => {
    it('should aggregate Meta campaign metrics', async () => {
      const mockMetaCampaigns = [
        {
          id: 'camp_1',
          campaignId: 'meta_123',
          name: 'Test Campaign',
          status: 'ACTIVE',
        },
      ];

      const mockInsights = {
        _sum: {
          spend: 1000,
          purchaseValue: 3500,
          purchases: 25,
          impressions: 50000,
          clicks: 500,
        },
        _avg: {
          ctr: 1.0,
          frequency: 2.5,
        },
      };

      vi.mocked(prisma.metaCampaign.findMany).mockResolvedValue(mockMetaCampaigns as any);
      vi.mocked(prisma.googleCampaign.findMany).mockResolvedValue([]);
      vi.mocked(prisma.metaInsightDaily.aggregate).mockResolvedValue(mockInsights as any);

      const result = await analyzeEntityPerformance('workspace_1', 7);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        entityId: 'meta_123',
        entityName: 'Test Campaign',
        channel: 'META',
        spend: 1000,
        revenue: 3500,
        roas: 3.5,
        cpa: 40,
        purchases: 25,
      });
    });

    it('should return empty array when no campaigns exist', async () => {
      vi.mocked(prisma.metaCampaign.findMany).mockResolvedValue([]);
      vi.mocked(prisma.googleCampaign.findMany).mockResolvedValue([]);

      const result = await analyzeEntityPerformance('workspace_1', 7);

      expect(result).toHaveLength(0);
    });
  });

  describe('applyRules', () => {
    const mockBusinessProfile = {
      targetCpaZar: 100,
      breakEvenRoas: 2.5,
      grossMarginPct: 0.4,
    };

    const mockGuardrails = {
      minSpendZar: 50,
    };

    beforeEach(() => {
      vi.mocked(prisma.workspaceBusinessProfile.findUnique).mockResolvedValue(
        mockBusinessProfile as any
      );
      vi.mocked(prisma.workspaceGuardrails.findUnique).mockResolvedValue(
        mockGuardrails as any
      );
    });

    it('should recommend SCALE for high-performing entities', async () => {
      const entities: EntityPerformance[] = [
        {
          entityId: 'camp_1',
          entityName: 'Winner Campaign',
          level: 'campaign',
          channel: 'META',
          spend: 1000,
          revenue: 4000,
          roas: 4.0, // > 2.5 * 1.2 = 3.0
          cpa: 50, // < 100 * 0.8 = 80
          purchases: 20,
          impressions: 50000,
          clicks: 500,
          ctr: 1.0,
        },
      ];

      const results = await applyRules('workspace_1', entities);

      expect(results).toHaveLength(1);
      expect(results[0].action).toBe('SCALE');
      expect(results[0].suggestedBudgetChange).toBe(15);
    });

    it('should recommend REDUCE for underperforming entities', async () => {
      const entities: EntityPerformance[] = [
        {
          entityId: 'camp_2',
          entityName: 'Loser Campaign',
          level: 'campaign',
          channel: 'META',
          spend: 500,
          revenue: 600,
          roas: 1.2, // < 2.5 break-even
          cpa: 250, // > 100 target
          purchases: 2,
          impressions: 25000,
          clicks: 200,
          ctr: 0.8,
        },
      ];

      const results = await applyRules('workspace_1', entities);

      expect(results).toHaveLength(1);
      expect(results[0].action).toBe('REDUCE');
      expect(results[0].suggestedBudgetChange).toBe(-30);
    });

    it('should recommend PAUSE for entities with spend but no purchases', async () => {
      const entities: EntityPerformance[] = [
        {
          entityId: 'camp_3',
          entityName: 'No Sales Campaign',
          level: 'campaign',
          channel: 'META',
          spend: 200, // >= minSpendZar (50)
          revenue: 0,
          roas: 0,
          cpa: 0,
          purchases: 0,
          impressions: 10000,
          clicks: 100,
          ctr: 1.0,
        },
      ];

      const results = await applyRules('workspace_1', entities);

      expect(results).toHaveLength(1);
      expect(results[0].action).toBe('PAUSE');
    });

    it('should recommend HOLD for entities needing creative refresh', async () => {
      const entities: EntityPerformance[] = [
        {
          entityId: 'camp_4',
          entityName: 'Fatigued Campaign',
          level: 'campaign',
          channel: 'META',
          spend: 800,
          revenue: 2500,
          roas: 3.125, // > break-even
          cpa: 80, // < target
          purchases: 10,
          impressions: 60000,
          clicks: 300,
          ctr: 0.5, // < 1.0
          frequency: 4.5, // > 3
        },
      ];

      const results = await applyRules('workspace_1', entities);

      expect(results).toHaveLength(1);
      expect(results[0].action).toBe('HOLD');
      expect(results[0].reason).toContain('Creative refresh');
    });

    it('should recommend HOLD for acceptable performance', async () => {
      const entities: EntityPerformance[] = [
        {
          entityId: 'camp_5',
          entityName: 'Average Campaign',
          level: 'campaign',
          channel: 'META',
          spend: 500,
          revenue: 1500,
          roas: 3.0, // Above break-even but not enough to scale
          cpa: 85, // Below target but not enough to scale
          purchases: 6,
          impressions: 30000,
          clicks: 350,
          ctr: 1.17,
        },
      ];

      const results = await applyRules('workspace_1', entities);

      expect(results).toHaveLength(1);
      expect(results[0].action).toBe('HOLD');
      expect(results[0].reason).toContain('acceptable range');
    });

    it('should throw error when business profile not configured', async () => {
      vi.mocked(prisma.workspaceBusinessProfile.findUnique).mockResolvedValue(null);

      const entities: EntityPerformance[] = [
        {
          entityId: 'camp_1',
          entityName: 'Test',
          level: 'campaign',
          channel: 'META',
          spend: 100,
          revenue: 300,
          roas: 3,
          cpa: 50,
          purchases: 2,
          impressions: 5000,
          clicks: 50,
          ctr: 1.0,
        },
      ];

      await expect(applyRules('workspace_1', entities)).rejects.toThrow(
        'Business profile not configured'
      );
    });
  });
});
