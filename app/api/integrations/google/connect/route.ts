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
    const { workspaceId, customerId, developerToken, refreshToken, clientId, clientSecret } = body;

    if (!workspaceId || !customerId || !developerToken || !refreshToken || !clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check workspace access
    const hasAccess = await checkWorkspaceAccess(workspaceId, 'ADMIN');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Normalize customer ID (remove dashes)
    const normalizedCustomerId = customerId.replace(/-/g, '');

    // Get access token from refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ 
        error: 'Invalid OAuth credentials. Please check your client ID, secret, and refresh token.' 
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Test the Google Ads API connection
    const testResponse = await fetch(
      `https://googleads.googleapis.com/v14/customers/${normalizedCustomerId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!testResponse.ok) {
      const errorData = await testResponse.json();
      return NextResponse.json({ 
        error: errorData.error?.message || 'Invalid Google Ads credentials or insufficient permissions' 
      }, { status: 400 });
    }

    const customerData = await testResponse.json();

    // Encrypt and store credentials
    const encryptedCredentials = encrypt(JSON.stringify({
      customerId: normalizedCustomerId,
      developerToken,
      refreshToken,
      clientId,
      clientSecret,
    }));

    await prisma.encryptedSecret.upsert({
      where: {
        workspaceId_integrationType: {
          workspaceId,
          integrationType: 'GOOGLE_ADS',
        },
      },
      create: {
        workspaceId,
        integrationType: 'GOOGLE_ADS',
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
          type: 'GOOGLE_ADS',
        },
      },
      create: {
        workspaceId,
        type: 'GOOGLE_ADS',
        status: 'CONNECTED',
        connectedAt: new Date(),
        metadata: {
          customerId: normalizedCustomerId,
          customerName: customerData.descriptiveName,
        },
      },
      update: {
        status: 'CONNECTED',
        connectedAt: new Date(),
        metadata: {
          customerId: normalizedCustomerId,
          customerName: customerData.descriptiveName,
        },
      },
    });

    // Create or update account record
    await prisma.googleAdsAccount.upsert({
      where: {
        workspaceId_customerId: {
          workspaceId,
          customerId: normalizedCustomerId,
        },
      },
      create: {
        id: `${workspaceId}_${normalizedCustomerId}`,
        workspaceId,
        customerId: normalizedCustomerId,
        name: customerData.descriptiveName,
        currency: customerData.currencyCode,
        timezone: customerData.timeZone,
      },
      update: {
        name: customerData.descriptiveName,
        currency: customerData.currencyCode,
        timezone: customerData.timeZone,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: 'CONNECT_INTEGRATION',
        channel: 'GOOGLE',
        reason: `Connected Google Ads account ${customerData.descriptiveName || normalizedCustomerId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Ads connection error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to connect' 
    }, { status: 500 });
  }
}
