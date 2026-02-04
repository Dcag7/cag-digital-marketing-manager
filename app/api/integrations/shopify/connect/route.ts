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
    const { workspaceId, shopDomain, accessToken } = body;

    if (!workspaceId || !shopDomain || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check workspace access
    const hasAccess = await checkWorkspaceAccess(workspaceId, 'ADMIN');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Normalize shop domain
    const normalizedDomain = shopDomain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    // Validate the token by making a test API call
    const testResponse = await fetch(
      `https://${normalizedDomain}/admin/api/2024-01/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!testResponse.ok) {
      return NextResponse.json({ 
        error: 'Invalid Shopify credentials. Please check your shop domain and access token.' 
      }, { status: 400 });
    }

    const shopData = await testResponse.json();

    // Encrypt and store credentials
    const encryptedCredentials = encrypt(JSON.stringify({
      shopDomain: normalizedDomain,
      accessToken,
    }));

    await prisma.encryptedSecret.upsert({
      where: {
        workspaceId_integrationType: {
          workspaceId,
          integrationType: 'SHOPIFY',
        },
      },
      create: {
        workspaceId,
        integrationType: 'SHOPIFY',
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
          type: 'SHOPIFY',
        },
      },
      create: {
        workspaceId,
        type: 'SHOPIFY',
        status: 'CONNECTED',
        connectedAt: new Date(),
        metadata: {
          shopDomain: normalizedDomain,
          shopName: shopData.shop?.name,
          currency: shopData.shop?.currency,
        },
      },
      update: {
        status: 'CONNECTED',
        connectedAt: new Date(),
        metadata: {
          shopDomain: normalizedDomain,
          shopName: shopData.shop?.name,
          currency: shopData.shop?.currency,
        },
      },
    });

    // Create or update shop record
    await prisma.shopifyShop.upsert({
      where: {
        workspaceId_shopDomain: {
          workspaceId,
          shopDomain: normalizedDomain,
        },
      },
      create: {
        id: `${workspaceId}_${normalizedDomain}`,
        workspaceId,
        shopDomain: normalizedDomain,
        name: shopData.shop?.name,
        currency: shopData.shop?.currency || 'ZAR',
      },
      update: {
        name: shopData.shop?.name,
        currency: shopData.shop?.currency || 'ZAR',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        workspaceId,
        userId,
        action: 'CONNECT_INTEGRATION',
        channel: 'SHOPIFY',
        reason: `Connected Shopify store ${shopData.shop?.name || normalizedDomain}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Shopify connection error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to connect' 
    }, { status: 500 });
  }
}
