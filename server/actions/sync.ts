'use server';

import { prisma } from '@/lib/db';
import { syncMetaInsights, syncMetaAdAccounts } from '@/server/adapters/meta';
import { revalidatePath } from 'next/cache';

export type SyncResult = {
  success: boolean;
  message: string;
  error?: string;
};

export async function syncMetaData(workspaceId: string): Promise<SyncResult> {
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

    // Sync ad accounts first
    await syncMetaAdAccounts(workspaceId);
    
    // Then sync insights (which also syncs campaigns)
    await syncMetaInsights(workspaceId, 7);

    revalidatePath(`/app/${workspaceId}`);
    revalidatePath(`/app/${workspaceId}/campaigns`);
    revalidatePath(`/app/${workspaceId}/settings`);

    return {
      success: true,
      message: 'Meta data synced successfully',
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

export async function syncShopifyData(workspaceId: string): Promise<SyncResult> {
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

    // Shopify sync not yet implemented
    return {
      success: false,
      message: 'Shopify sync coming soon',
      error: 'Shopify data sync is not yet implemented',
    };

    // TODO: Implement Shopify sync when adapter is ready
    // const { syncShopifyOrders } = await import('@/server/adapters/shopify');
    // await syncShopifyOrders(workspaceId, 7);
    // revalidatePath(`/app/${workspaceId}`);
    // revalidatePath(`/app/${workspaceId}/settings`);
    // return { success: true, message: 'Shopify data synced successfully' };
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

    // TODO: Implement Google Ads sync when adapter is ready
    // const { syncGoogleInsights } = await import('@/server/adapters/google');
    // await syncGoogleInsights(workspaceId, 7);
    // revalidatePath(`/app/${workspaceId}`);
    // revalidatePath(`/app/${workspaceId}/campaigns`);
    // revalidatePath(`/app/${workspaceId}/settings`);
    // return { success: true, message: 'Google Ads data synced successfully' };
  } catch (error) {
    console.error('Google sync error:', error);
    return {
      success: false,
      message: 'Failed to sync Google Ads data',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
