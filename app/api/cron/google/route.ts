import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncGoogleInsights } from '@/server/adapters/google';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all workspaces with connected Google Ads integration
    const integrations = await prisma.integration.findMany({
      where: {
        type: 'GOOGLE_ADS',
        status: 'CONNECTED',
      },
      select: {
        workspaceId: true,
      },
    });

    const results = [];

    for (const integration of integrations) {
      try {
        await syncGoogleInsights(integration.workspaceId, 7);
        results.push({
          workspaceId: integration.workspaceId,
          status: 'success',
        });
      } catch (error) {
        console.error(`Failed to sync Google Ads for workspace ${integration.workspaceId}:`, error);
        results.push({
          workspaceId: integration.workspaceId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Google Ads cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
