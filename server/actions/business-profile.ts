'use server';

import { prisma } from '@/lib/db';
import { checkWorkspaceAccess } from './workspace';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateBusinessProfileSchema = z.object({
  targetCpaZar: z.number().min(0),
  breakEvenRoas: z.number().min(0),
  grossMarginPct: z.number().min(0).max(1),
  avgShippingCostZar: z.number().min(0).optional(),
  returnRatePct: z.number().min(0).max(1).optional(),
  paymentFeesPct: z.number().min(0).max(1).optional(),
  monthlySpendCapZar: z.number().min(0).optional().nullable(),
  strategicMode: z.enum(['GROWTH', 'EFFICIENCY', 'RECOVERY', 'LIQUIDATION', 'HOLD']).optional(),
  constraints: z.any().optional(),
  productPriorities: z.any().optional(),
});

export async function updateBusinessProfile(
  workspaceId: string,
  data: z.infer<typeof updateBusinessProfileSchema>
) {
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'ADMIN');
  if (!hasAccess) throw new Error('Unauthorized');

  const validated = updateBusinessProfileSchema.parse(data);

  await prisma.workspaceBusinessProfile.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      targetCpaZar: validated.targetCpaZar,
      breakEvenRoas: validated.breakEvenRoas,
      grossMarginPct: validated.grossMarginPct,
      avgShippingCostZar: validated.avgShippingCostZar || 0,
      returnRatePct: validated.returnRatePct || 0,
      paymentFeesPct: validated.paymentFeesPct || 0.03,
      monthlySpendCapZar: validated.monthlySpendCapZar || null,
      strategicMode: validated.strategicMode || 'GROWTH',
      constraints: validated.constraints || null,
      productPriorities: validated.productPriorities || null,
    },
    update: validated,
  });

  revalidatePath(`/app/${workspaceId}/settings`);
}
