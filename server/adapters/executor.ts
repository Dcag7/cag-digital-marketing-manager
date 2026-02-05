import 'server-only';
import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { ActionChannel, ActionType } from '@prisma/client';
import { getMetaAccessToken } from './meta';
import { 
  updateGoogleCampaignBudget, 
  updateGoogleCampaignStatus, 
  updateGoogleAdGroupStatus 
} from './google';
import { fetchShopifyAPI } from './shopify';

export interface ExecutionContext {
  workspaceId: string;
  userId: string;
}

export async function executeAction(
  context: ExecutionContext,
  action: {
    channel: ActionChannel;
    type: ActionType;
    entity: { level: string; id: string; name?: string };
    beforeState?: unknown;
  }
): Promise<{ success: boolean; afterState?: unknown; error?: string }> {
  try {
    switch (action.channel) {
      case 'META':
        return await executeMetaAction(context, action);
      case 'GOOGLE':
        return await executeGoogleAction(context, action);
      case 'SHOPIFY':
        return await executeShopifyAction(context, action);
      case 'OPS':
        return await executeOpsAction(context, action);
      default:
        throw new Error(`Unsupported channel: ${action.channel}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function executeMetaAction(
  context: ExecutionContext,
  action: {
    type: ActionType;
    entity: { level: string; id: string; name?: string };
    beforeState?: unknown;
  }
): Promise<{ success: boolean; afterState?: unknown; error?: string }> {
  const { workspaceId } = context;

  if (action.type === 'UPDATE_BUDGET') {
    // Get current ad set or campaign
    if (action.entity.level === 'adset') {
      const adSet = await prisma.metaAdSet.findUnique({
        where: {
          workspaceId_adSetId: {
            workspaceId,
            adSetId: action.entity.id,
          },
        },
      });

      if (!adSet) {
        throw new Error('Ad set not found');
      }

      // Get the budget change from beforeState or calculate
      const budgetChange = (action.beforeState as { budgetChange?: number })?.budgetChange || 0;
      const newBudget = (adSet.dailyBudget || 0) * (1 + budgetChange / 100);

      // Update via Meta API
      const account = await prisma.metaAdAccount.findFirst({
        where: { workspaceId },
      });
      if (!account) {
        throw new Error('Meta account not found');
      }

      // Update ad set budget via Meta API (POST request)
      const token = await getMetaAccessToken(workspaceId);
      const response = await fetch(`https://graph.facebook.com/v21.0/${action.entity.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daily_budget: Math.round(newBudget * 100), // Convert to cents
          access_token: token,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Meta API error: ${response.status} ${error}`);
      }

      // Update in database
      await prisma.metaAdSet.update({
        where: {
          workspaceId_adSetId: {
            workspaceId,
            adSetId: action.entity.id,
          },
        },
        data: { dailyBudget: newBudget },
      });

      return {
        success: true,
        afterState: { dailyBudget: newBudget },
      };
    }
  }

  if (action.type === 'PAUSE_ENTITY') {
    const account = await prisma.metaAdAccount.findFirst({
      where: { workspaceId },
    });
    if (!account) {
      throw new Error('Meta account not found');
    }

    // Determine entity type and update status
    let entityType = '';
    if (action.entity.level === 'campaign') {
      entityType = 'campaign';
    } else if (action.entity.level === 'adset') {
      entityType = 'adset';
    } else if (action.entity.level === 'ad') {
      entityType = 'ad';
    }

    // Pause entity via Meta API (POST request)
    const token = await getMetaAccessToken(workspaceId);
    const response = await fetch(`https://graph.facebook.com/v21.0/${action.entity.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'PAUSED',
        access_token: token,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta API error: ${response.status} ${error}`);
    }

    // Update in database
    if (action.entity.level === 'campaign') {
      await prisma.metaCampaign.update({
        where: {
          workspaceId_campaignId: {
            workspaceId,
            campaignId: action.entity.id,
          },
        },
        data: { status: 'PAUSED' },
      });
    } else if (action.entity.level === 'adset') {
      await prisma.metaAdSet.update({
        where: {
          workspaceId_adSetId: {
            workspaceId,
            adSetId: action.entity.id,
          },
        },
        data: { status: 'PAUSED' },
      });
    } else if (action.entity.level === 'ad') {
      await prisma.metaAd.update({
        where: {
          workspaceId_adId: {
            workspaceId,
            adId: action.entity.id,
          },
        },
        data: { status: 'PAUSED' },
      });
    }

    return {
      success: true,
      afterState: { status: 'PAUSED' },
    };
  }

  throw new Error(`Unsupported Meta action type: ${action.type}`);
}

async function executeGoogleAction(
  context: ExecutionContext,
  action: {
    type: ActionType;
    entity: { level: string; id: string; name?: string };
    beforeState?: unknown;
  }
): Promise<{ success: boolean; afterState?: unknown; error?: string }> {
  const { workspaceId } = context;

  // Get the Google Ads account to find the customer ID
  const account = await prisma.googleAdsAccount.findFirst({
    where: { workspaceId },
  });

  if (!account) {
    throw new Error('Google Ads account not found');
  }

  if (action.type === 'UPDATE_BUDGET') {
    if (action.entity.level === 'campaign') {
      const campaign = await prisma.googleCampaign.findUnique({
        where: {
          workspaceId_campaignId: {
            workspaceId,
            campaignId: action.entity.id,
          },
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Calculate new budget
      const budgetChange = (action.beforeState as { budgetChange?: number })?.budgetChange || 0;
      const currentBudget = Number(campaign.budgetAmountMicros || 0);
      const newBudgetMicros = BigInt(Math.round(currentBudget * (1 + budgetChange / 100)));

      await updateGoogleCampaignBudget(
        workspaceId,
        account.customerId,
        action.entity.id,
        newBudgetMicros
      );

      return {
        success: true,
        afterState: { budgetAmountMicros: newBudgetMicros.toString() },
      };
    }
  }

  if (action.type === 'PAUSE_ENTITY') {
    if (action.entity.level === 'campaign') {
      await updateGoogleCampaignStatus(
        workspaceId,
        account.customerId,
        action.entity.id,
        'PAUSED'
      );

      return {
        success: true,
        afterState: { status: 'PAUSED' },
      };
    }

    if (action.entity.level === 'adgroup') {
      await updateGoogleAdGroupStatus(
        workspaceId,
        account.customerId,
        action.entity.id,
        'PAUSED'
      );

      return {
        success: true,
        afterState: { status: 'PAUSED' },
      };
    }
  }

  throw new Error(`Unsupported Google Ads action: ${action.type} on ${action.entity.level}`);
}

async function executeShopifyAction(
  context: ExecutionContext,
  action: {
    type: ActionType;
    entity: { level: string; id: string; name?: string };
    beforeState?: unknown;
  }
): Promise<{ success: boolean; afterState?: unknown; error?: string }> {
  const { workspaceId } = context;

  // Shopify actions are typically read-only in this context
  // The main Shopify execution is creating tasks based on insights
  
  if (action.type === 'CREATE_TASK') {
    // Delegate to OPS action for task creation
    return executeOpsAction(context, action);
  }

  // Future: Add product/inventory updates if needed
  if (action.entity.level === 'product') {
    const updateData = action.beforeState as {
      status?: string;
      title?: string;
    };

    if (updateData.status) {
      // Update product status via Shopify API
      await fetchShopifyAPI(workspaceId, `products/${action.entity.id}.json`, {
        method: 'PUT',
        body: {
          product: {
            id: action.entity.id,
            status: updateData.status,
          },
        },
      });

      // Update local database
      await prisma.shopifyProduct.update({
        where: {
          workspaceId_productId: {
            workspaceId,
            productId: action.entity.id,
          },
        },
        data: {
          status: updateData.status,
        },
      });

      return {
        success: true,
        afterState: { status: updateData.status },
      };
    }
  }

  // For now, Shopify actions primarily generate tasks
  // Return success for recognized but unimplemented actions
  return {
    success: true,
    afterState: { note: 'Shopify action acknowledged' },
  };
}

async function executeOpsAction(
  context: ExecutionContext,
  action: {
    type: ActionType;
    entity: { level: string; id: string; name?: string };
    beforeState?: unknown;
  }
): Promise<{ success: boolean; afterState?: unknown; error?: string }> {
  if (action.type === 'CREATE_TASK') {
    // Create task from action
    const taskData = action.beforeState as {
      title: string;
      description?: string;
      priority?: string;
      dueDate?: string;
    };

    await prisma.task.create({
      data: {
        workspaceId: context.workspaceId,
        title: taskData.title,
        description: taskData.description || null,
        priority: (taskData.priority as any) || 'MEDIUM',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      },
    });

    return {
      success: true,
      afterState: { created: true },
    };
  }

  throw new Error(`Unsupported OPS action type: ${action.type}`);
}
