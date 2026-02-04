import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import { checkWorkspaceAccess } from '@/server/actions/workspace';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, accessToken, adAccountId } = body;

    if (!workspaceId || !accessToken || !adAccountId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check workspace access
    const hasAccess = await checkWorkspaceAccess(workspaceId, 'ADMIN');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate the token by making a test API call
    const testResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}?fields=name,currency,timezone_name&access_token=${accessToken}`
    );

    if (!testResponse.ok) {
      const errorData = await testResponse.json();
      return NextResponse.json({ 
        error: errorData.error?.message || 'Invalid Meta credentials' 
      }, { status: 400 });
    }

    const accountData = await testResponse.json();

    // Encrypt and store credentials
    const encryptedCredentials = encrypt(JSON.stringify({
      accessToken,
      adAccountId,
    }));

    await prisma.encryptedSecret.upsert({
      where: {
        workspaceId_integrationType: {
          workspaceId,
          integrationType: 'META',
        },
      },
      create: {
        workspaceId,
        integrationType: 'META',
        encryptedJson: encryptedCredentials,
      },
      update: {
        encryptedJson: encryptedCredentials,
      },
    });

    // Update integration status
    await prisma.integration.upsert({
      where: {
        workspaceId_type: {
          workspaceId,
          type: 'META',
        },
      },
      create: {
        workspaceId,
        type: 'META',
        status: 'CONNECTED',
        connectedAt: new Date(),
        metadata: {
          adAccountId,
          accountName: accountData.name,
          currency: accountData.currency,
          timezone: accountData.timezone_name,
        },
      },
      update: {
        status: 'CONNECTED',
        connectedAt: new Date(),
        metadata: {
          adAccountId,
          accountName: accountData.name,
          currency: accountData.currency,
          timezone: accountData.timezone_name,
        },
      },
    });

    // Create or update ad account record
    await prisma.metaAdAccount.upsert({
      where: {
        workspaceId_accountId: {
          workspaceId,
          accountId: adAccountId,
        },
      },
      create: {
        id: `${workspaceId}_${adAccountId}`,
        workspaceId,
        accountId: adAccountId,
        name: accountData.name || adAccountId,
        currency: accountData.currency || 'ZAR',
        timezone: accountData.timezone_name || 'Africa/Johannesburg',
      },
      update: {
        name: accountData.name || adAccountId,
        currency: accountData.currency || 'ZAR',
        timezone: accountData.timezone_name || 'Africa/Johannesburg',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: 'CONNECT_INTEGRATION',
        channel: 'META',
        reason: `Connected Meta ad account ${accountData.name || adAccountId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meta connection error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to connect' 
    }, { status: 500 });
  }
}
