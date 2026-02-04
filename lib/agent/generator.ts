import 'server-only';
import { prisma } from '@/lib/db';
import { analyzeEntityPerformance, applyRules, RuleResult } from './rules';
import { callLLMJson } from '@/lib/llm/client';
import { z } from 'zod';
import { StrategicMode } from '@prisma/client';

const RecommendationSchema = z.object({
  summary: z.string(),
  modeRecommendation: z.enum(['GROWTH', 'EFFICIENCY', 'RECOVERY', 'LIQUIDATION', 'HOLD']),
  diagnostics: z.array(z.object({
    metric: z.string(),
    finding: z.string(),
    evidence: z.any().optional(),
  })),
  proposedActions: z.array(z.object({
    channel: z.enum(['META', 'GOOGLE', 'SHOPIFY', 'OPS']),
    type: z.enum(['UPDATE_BUDGET', 'PAUSE_ENTITY', 'CREATE_TASK', 'DUPLICATE_ADSET']),
    entity: z.object({
      level: z.enum(['campaign', 'adset', 'ad', 'adgroup']),
      id: z.string(),
      name: z.string().optional(),
    }),
    rationale: z.string(),
    expectedImpact: z.object({
      revenueZar: z.number().optional(),
      profitZar: z.number().optional(),
      cpaChangeZar: z.number().optional(),
    }).optional(),
    guardrailNotes: z.string().optional(),
  })),
  creativeBriefs: z.array(z.object({
    title: z.string(),
    angle: z.string(),
    hook: z.string(),
    script: z.string().optional(),
    shotList: z.any().optional(),
    overlays: z.any().optional(),
    captions: z.any().optional(),
    placements: z.array(z.string()).optional(),
  })).optional(),
});

type RecommendationData = z.infer<typeof RecommendationSchema>;

export async function generateRecommendation(workspaceId: string): Promise<string> {
  // Get business profile
  const businessProfile = await prisma.workspaceBusinessProfile.findUnique({
    where: { workspaceId },
  });
  if (!businessProfile) {
    throw new Error('Business profile not configured');
  }

  // Analyze entities
  const entities = await analyzeEntityPerformance(workspaceId, 7);
  if (entities.length === 0) {
    throw new Error('No entity data available');
  }

  // Apply rules
  const ruleResults = await applyRules(workspaceId, entities);

  // Prepare context for LLM
  const winners = ruleResults.filter(r => r.action === 'SCALE');
  const losers = ruleResults.filter(r => r.action === 'REDUCE' || r.action === 'PAUSE');
  const needsCreative = ruleResults.filter(r => r.reason.includes('Creative refresh'));

  const prompt = `You are a digital marketing strategist analyzing performance data for an eCommerce brand.

Business Context:
- Target CPA: ${businessProfile.targetCpaZar} ZAR
- Break-even ROAS: ${businessProfile.breakEvenRoas}
- Gross Margin: ${(businessProfile.grossMarginPct * 100).toFixed(1)}%
- Strategic Mode: ${businessProfile.strategicMode}

Performance Summary (Last 7 Days):
- Total Entities Analyzed: ${entities.length}
- Winners (candidates to scale): ${winners.length}
- Losers (candidates to reduce/pause): ${losers.length}
- Entities needing creative refresh: ${needsCreative.length}

Rule-Based Analysis Results:
${ruleResults.map((r, i) => `
${i + 1}. ${r.entity.entityName} (${r.entity.channel} ${r.entity.level})
   - Action: ${r.action}
   - ROAS: ${r.entity.roas.toFixed(2)}, CPA: ${r.entity.cpa.toFixed(2)} ZAR
   - Spend: ${r.entity.spend.toFixed(2)} ZAR, Revenue: ${r.entity.revenue.toFixed(2)} ZAR
   - Reason: ${r.reason}
`).join('')}

Your task:
1. Provide a clear summary of the situation
2. Recommend a strategic mode (GROWTH, EFFICIENCY, RECOVERY, LIQUIDATION, or HOLD)
3. List key diagnostics (metrics, findings, evidence)
4. Propose specific actions based on the rule results, prioritizing by impact
5. If creative refresh is needed, generate creative briefs with hooks, angles, and scripts

Return your response as JSON matching this schema:
{
  "summary": "string",
  "modeRecommendation": "GROWTH|EFFICIENCY|RECOVERY|LIQUIDATION|HOLD",
  "diagnostics": [{"metric": "string", "finding": "string", "evidence": {}}],
  "proposedActions": [{
    "channel": "META|GOOGLE|SHOPIFY|OPS",
    "type": "UPDATE_BUDGET|PAUSE_ENTITY|CREATE_TASK|DUPLICATE_ADSET",
    "entity": {"level": "campaign|adset|ad|adgroup", "id": "string", "name": "string"},
    "rationale": "string",
    "expectedImpact": {"revenueZar": number, "profitZar": number, "cpaChangeZar": number},
    "guardrailNotes": "string"
  }],
  "creativeBriefs": [{
    "title": "string",
    "angle": "string",
    "hook": "string",
    "script": "string",
    "shotList": {},
    "overlays": {},
    "captions": {},
    "placements": []
  }]
}`;

  const llmResponse = await callLLMJson<RecommendationData>(
    [{ role: 'user', content: prompt }],
    RecommendationSchema.shape
  );

  // Validate and create recommendation
  const validated = RecommendationSchema.parse(llmResponse);

  // Create recommendation in database
  const recommendation = await prisma.recommendation.create({
    data: {
      workspaceId,
      status: 'DRAFT',
      summary: validated.summary,
      modeRecommendation: validated.modeRecommendation,
      dataSnapshot: {
        entities: entities.map(e => ({
          entityId: e.entityId,
          entityName: e.entityName,
          spend: e.spend,
          revenue: e.revenue,
          roas: e.roas,
          cpa: e.cpa,
        })),
        ruleResults: ruleResults.map(r => ({
          action: r.action,
          entityId: r.entity.entityId,
          reason: r.reason,
        })),
      },
      diagnostics: {
        create: validated.diagnostics.map(d => ({
          metric: d.metric,
          finding: d.finding,
          evidence: d.evidence || {},
        })),
      },
      proposedActions: {
        create: validated.proposedActions.map(a => ({
          channel: a.channel,
          type: a.type,
          entity: a.entity,
          rationale: a.rationale,
          expectedImpact: a.expectedImpact || {},
          guardrailNotes: a.guardrailNotes || null,
        })),
      },
      creativeBriefs: {
        create: (validated.creativeBriefs || []).map(b => ({
          title: b.title,
          angle: b.angle,
          hook: b.hook,
          script: b.script || null,
          shotList: b.shotList || null,
          overlays: b.overlays || null,
          captions: b.captions || null,
          placements: b.placements || [],
        })),
      },
    },
  });

  return recommendation.id;
}

export async function proposeRecommendation(recommendationId: string) {
  await prisma.recommendation.update({
    where: { id: recommendationId },
    data: { status: 'PROPOSED' },
  });
}
