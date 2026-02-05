'use server';

import { prisma } from '@/lib/db';
import { syncMetaInsights, syncMetaAdAccounts } from '@/server/adapters/meta';
import { syncAllShopifyData } from '@/server/adapters/shopify';
import { revalidatePath } from 'next/cache';

export type SyncResult = {
  success: boolean;
  message: string;
  error?: string;
  details?: string;
};

export async function syncMetaData(workspaceId: string, days: number = 90, clearFirst: boolean = true): Promise<SyncResult> {
  try {
    // Check if integration is connected
    const integration = await prisma.integration.findFirst({
      where: {
        workspaceId,
        type: 'META',
        status: 'CONNECTED',
      },
    });

    if (!integration) {
      return {
        success: false,
        message: 'Meta integration not connected',
        error: 'Please connect your Meta account first',
      };
    }

    // Clear old insight data to prevent stale/duplicate data
    if (clearFirst) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      await prisma.metaInsightDaily.deleteMany({
        where: {
          workspaceId,
          date: { gte: cutoffDate },
        },
      });
      console.log(`Cleared existing insights for last ${days} days`);
    }

    // Sync ad accounts first
    await syncMetaAdAccounts(workspaceId);
    
    // Then sync insights (which also syncs campaigns)
    await syncMetaInsights(workspaceId, days);

    // Get counts for feedback
    const [campaignCount, insightCount] = await Promise.all([
      prisma.metaCampaign.count({ where: { workspaceId } }),
      prisma.metaInsightDaily.count({ where: { workspaceId } }),
    ]);

    revalidatePath(`/app/${workspaceId}`);
    revalidatePath(`/app/${workspaceId}/campaigns`);
    revalidatePath(`/app/${workspaceId}/overview`);
    revalidatePath(`/app/${workspaceId}/settings`);

    return {
      success: true,
      message: 'Meta data synced successfully',
      details: `Synced ${campaignCount} campaigns with ${insightCount} daily insight records (last ${days} days)`,
    };
  } catch (error) {
    console.error('Meta sync error:', error);
    return {
      success: false,
      message: 'Failed to sync Meta data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function syncShopifyData(workspaceId: string, days: number = 90, clearFirst: boolean = true): Promise<SyncResult> {
  try {
    // Check if integration is connected
    const integration = await prisma.integration.findFirst({
      where: {
        workspaceId,
        type: 'SHOPIFY',
        status: 'CONNECTED',
      },
    });

    if (!integration) {
      return {
        success: false,
        message: 'Shopify integration not connected',
        error: 'Please connect your Shopify store first',
      };
    }

    // Clear old data if requested
    if (clearFirst) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      await prisma.shopifyOrder.deleteMany({
        where: {
          workspaceId,
          createdAt: { gte: cutoffDate },
        },
      });
      
      await prisma.shopifyEmailMetrics.deleteMany({
        where: {
          workspaceId,
          date: { gte: cutoffDate },
        },
      });
      
      console.log(`Cleared existing Shopify data for last ${days} days`);
    }

    // Sync all Shopify data
    await syncAllShopifyData(workspaceId, days);

    // Get counts for feedback
    const [orderCount, productCount, emailCampaignCount] = await Promise.all([
      prisma.shopifyOrder.count({ where: { workspaceId } }),
      prisma.shopifyProduct.count({ where: { workspaceId } }),
      prisma.shopifyEmailCampaign.count({ where: { workspaceId } }),
    ]);

    revalidatePath(`/app/${workspaceId}`);
    revalidatePath(`/app/${workspaceId}/campaigns`);
    revalidatePath(`/app/${workspaceId}/overview`);
    revalidatePath(`/app/${workspaceId}/settings`);

    return {
      success: true,
      message: 'Shopify data synced successfully',
      details: `Synced ${orderCount} orders, ${productCount} products, ${emailCampaignCount} email campaigns (last ${days} days)`,
    };
  } catch (error) {
    console.error('Shopify sync error:', error);
    return {
      success: false,
      message: 'Failed to sync Shopify data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function syncGoogleData(workspaceId: string): Promise<SyncResult> {
  try {
    // Check if integration is connected
    const integration = await prisma.integration.findFirst({
      where: {
        workspaceId,
        type: 'GOOGLE_ADS',
        status: 'CONNECTED',
      },
    });

    if (!integration) {
      return {
        success: false,
        message: 'Google Ads integration not connected',
        error: 'Please connect your Google Ads account first',
      };
    }

    // Google Ads sync not yet implemented
    return {
      success: false,
      message: 'Google Ads sync coming soon',
      error: 'Google Ads data sync is not yet implemented',
    };
  } catch (error) {
    console.error('Google sync error:', error);
    return {
      success: false,
      message: 'Failed to sync Google Ads data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
