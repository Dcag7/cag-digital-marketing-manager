'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { checkWorkspaceAccess } from './workspace';
import { executeAction } from '@/server/adapters/executor';
import { revalidatePath } from 'next/cache';

export async function runExecution(
  workspaceId: string,
  recommendationId: string,
  actionIds: string[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const hasAccess = await checkWorkspaceAccess(workspaceId, 'OPERATOR');
  if (!hasAccess) throw new Error('Unauthorized');

  // Get approved actions
  const actions = await prisma.proposedAction.findMany({
    where: {
      id: { in: actionIds },
      recommendationId,
      status: 'APPROVED',
    },
  });

  if (actions.length === 0) {
    throw new Error('No approved actions to execute');
  }

  // Create execution run
  const executionRun = await prisma.executionRun.create({
    data: {
      workspaceId,
      recommendationId,
      status: 'RUNNING',
    },
  });

  const results = [];

  for (const action of actions) {
    try {
      const entity = action.entity as { level: string; id: string; name?: string } | null;
      if (!entity) {
        continue; // Skip actions without entity data
      }

      // Get before state
      let beforeState: unknown = null;
      if (action.channel === 'META') {
        if (entity.level === 'adset') {
          const adSet = await prisma.metaAdSet.findUnique({
            where: {
              workspaceId_adSetId: {
                workspaceId,
                adSetId: entity.id,
              },
            },
          });
          beforeState = adSet ? { dailyBudget: adSet.dailyBudget, status: adSet.status } : null;
        }
      }

      // Execute action
      const result = await executeAction(
        { workspaceId, userId },
        {
          channel: action.channel,
          type: action.type,
          entity,
          beforeState,
        }
      );

      // Create execution action record
      const executionAction = await prisma.executionAction.create({
        data: {
          executionRunId: executionRun.id,
          proposedActionId: action.id,
          channel: action.channel,
          type: action.type,
          entity: entity,
          beforeState: beforeState as object,
          afterState: result.afterState as object,
          status: result.success ? 'EXECUTED' : 'FAILED',
          error: result.error || null,
          executedAt: result.success ? new Date() : null,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          workspaceId,
          userId,
          action: `EXECUTE_${action.type}`,
          channel: action.channel,
          entityType: entity.level,
          entityId: entity.id,
          beforeState: beforeState as object,
          afterState: result.afterState as object,
          reason: action.rationale,
          executionActionId: executionAction.id,
        },
      });

      // Update proposed action status
      await prisma.proposedAction.update({
        where: { id: action.id },
        data: { status: result.success ? 'EXECUTED' : 'FAILED' },
      });

      results.push({ actionId: action.id, success: result.success, error: result.error });
    } catch (error) {
      results.push({
        actionId: action.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update execution run status
  const successCount = results.filter(r => r.success).length;
  const status =
    successCount === results.length
      ? 'COMPLETED'
      : successCount > 0
      ? 'PARTIAL'
      : 'FAILED';

  await prisma.executionRun.update({
    where: { id: executionRun.id },
    data: {
      status,
      finishedAt: new Date(),
    },
  });

  // Update recommendation status if all actions executed
  const allExecuted = await prisma.proposedAction.count({
    where: {
      recommendationId,
      status: { in: ['EXECUTED', 'FAILED', 'REJECTED'] },
    },
  });

  const totalActions = await prisma.proposedAction.count({
    where: { recommendationId },
  });

  if (allExecuted === totalActions) {
    await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { status: 'EXECUTED', executedAt: new Date() },
    });
  }

  revalidatePath(`/app/${workspaceId}/recommendations`);
  revalidatePath(`/app/${workspaceId}/audit`);

  return { executionRunId: executionRun.id, results };
}
