'use server';

import { prisma } from '@/lib/db';
import { checkWorkspaceAccess } from './workspace';
import { revalidatePath } from 'next/cache';

export async function approveRecommendation(recommendationId: string, workspaceId: string) {
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'OPERATOR');
  if (!hasAccess) throw new Error('Unauthorized');

  await prisma.recommendation.update({
    where: { id: recommendationId },
    data: { status: 'APPROVED' },
  });

  // Update proposed actions status
  await prisma.proposedAction.updateMany({
    where: { recommendationId, status: 'PENDING' },
    data: { status: 'APPROVED' },
  });

  revalidatePath(`/app/${workspaceId}/recommendations`);
}

export async function rejectRecommendation(recommendationId: string) {
  await prisma.recommendation.update({
    where: { id: recommendationId },
    data: { status: 'REJECTED' },
  });

  await prisma.proposedAction.updateMany({
    where: { recommendationId, status: 'PENDING' },
    data: { status: 'REJECTED' },
  });
}
