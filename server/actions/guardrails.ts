'use server';

import { prisma } from '@/lib/db';
import { checkWorkspaceAccess } from './workspace';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateGuardrailsSchema = z.object({
  maxBudgetChangePercentDaily: z.number().min(0).max(100).optional(),
  maxPausesPerDay: z.number().int().min(0).optional(),
  minSpendZar: z.number().min(0).optional(),
  maxSpendZar: z.number().min(0).optional().nullable(),
  requireApprovalFor: z.array(z.string()).optional(),
});

export async function updateGuardrails(
  workspaceId: string,
  data: z.infer<typeof updateGuardrailsSchema>
) {
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'ADMIN');
  if (!hasAccess) throw new Error('Unauthorized');

  const validated = updateGuardrailsSchema.parse(data);

  await prisma.workspaceGuardrails.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      ...validated,
    },
    update: validated,
  });

  revalidatePath(`/app/${workspaceId}/settings`);
}
