import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import { saveIntegrationSecret, updateIntegrationStatus } from '@/server/actions/integrations';
import { prisma } from '@/lib/db';

function verifyShopifyHmac(query: URLSearchParams, secret: string): boolean {
  const hmac = query.get('hmac');
  if (!hmac) return false;

  // Create a copy without hmac
  const params = new URLSearchParams(query);
  params.delete('hmac');

  // Sort parameters alphabetically
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const computedHmac = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(computedHmac)
  );
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Parse state to get workspaceId
  let workspaceId: string;
  try {
    const stateData = JSON.parse(Buffer.from(state || '', 'base64').toString());
    workspaceId = stateData.workspaceId;
  } catch {
    return NextResponse.redirect(
      new URL('/app?error=invalid_state', request.url)
    );
  }

  const settingsUrl = new URL(`/app/${workspaceId}/settings`, request.url);

  if (!shop || !code) {
    settingsUrl.searchParams.set('error', 'missing_params');
    return NextResponse.redirect(settingsUrl);
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  if (!apiKey || !apiSecret) {
    settingsUrl.searchParams.set('error', 'shopify_not_configured');
    return NextResponse.redirect(settingsUrl);
  }

  // Verify HMAC
  if (!verifyShopifyHmac(searchParams, apiSecret)) {
    console.error('Shopify HMAC verification failed');
    settingsUrl.searchParams.set('error', 'hmac_verification_failed');
    return NextResponse.redirect(settingsUrl);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: apiKey,
          client_secret: apiSecret,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Shopify token exchange failed:', errorData);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get shop info
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': tokenData.access_token,
      },
    });

    let shopInfo = { name: shop, currency: 'ZAR' };
    if (shopResponse.ok) {
      const shopData = await shopResponse.json();
      shopInfo = {
        name: shopData.shop.name,
        currency: shopData.shop.currency || 'ZAR',
      };
    }

    // Store the encrypted token
    await saveIntegrationSecret(workspaceId, 'SHOPIFY', {
      access_token: tokenData.access_token,
      scope: tokenData.scope,
      shop_domain: shop,
      obtained_at: Date.now(),
    });

    // Create or update shop record
    await prisma.shopifyShop.upsert({
      where: {
        workspaceId_shopDomain: {
          workspaceId,
          shopDomain: shop,
        },
      },
      create: {
        id: `${workspaceId}_${shop}`,
        workspaceId,
        shopDomain: shop,
        name: shopInfo.name,
        currency: shopInfo.currency,
      },
      update: {
        name: shopInfo.name,
        currency: shopInfo.currency,
      },
    });

    // Update integration status
    await updateIntegrationStatus(workspaceId, 'SHOPIFY', 'CONNECTED', {
      shop_domain: shop,
      shop_name: shopInfo.name,
    });

    settingsUrl.searchParams.set('success', 'shopify_connected');
    return NextResponse.redirect(settingsUrl);
  } catch (error) {
    console.error('Shopify OAuth callback error:', error);

    try {
      await updateIntegrationStatus(workspaceId, 'SHOPIFY', 'ERROR');
    } catch {}

    settingsUrl.searchParams.set('error', 'shopify_connection_failed');
    settingsUrl.searchParams.set(
      'error_description',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.redirect(settingsUrl);
  }
}
