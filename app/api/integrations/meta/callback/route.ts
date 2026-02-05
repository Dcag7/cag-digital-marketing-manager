import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { saveIntegrationSecret, updateIntegrationStatus } from '@/server/actions/integrations';
import { syncMetaAdAccounts } from '@/server/adapters/meta';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

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

  // Handle OAuth error
  if (error) {
    console.error('Meta OAuth error:', error, errorDescription);
    settingsUrl.searchParams.set('error', 'meta_auth_failed');
    settingsUrl.searchParams.set('error_description', errorDescription || error);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code) {
    settingsUrl.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appId || !appSecret || !appUrl) {
      throw new Error('Meta app credentials not configured');
    }

    const redirectUri = `${appUrl}/api/integrations/meta/callback`;

    // Exchange code for short-lived access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        }),
      { method: 'GET' }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Meta token exchange failed:', errorData);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const shortLivedToken = tokenData.access_token;

    // Exchange short-lived token for long-lived token
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken,
        }),
      { method: 'GET' }
    );

    if (!longLivedResponse.ok) {
      const errorData = await longLivedResponse.text();
      console.error('Meta long-lived token exchange failed:', errorData);
      throw new Error('Failed to get long-lived token');
    }

    const longLivedData = await longLivedResponse.json();

    // Store the encrypted token
    await saveIntegrationSecret(workspaceId, 'META', {
      access_token: longLivedData.access_token,
      token_type: longLivedData.token_type || 'bearer',
      expires_in: longLivedData.expires_in,
      obtained_at: Date.now(),
    });

    // Update integration status
    await updateIntegrationStatus(workspaceId, 'META', 'CONNECTED');

    // Sync ad accounts
    try {
      await syncMetaAdAccounts(workspaceId);
    } catch (syncError) {
      console.error('Failed to sync Meta ad accounts:', syncError);
      // Don't fail the whole flow, just log the error
    }

    settingsUrl.searchParams.set('success', 'meta_connected');
    return NextResponse.redirect(settingsUrl);
  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    
    // Update status to error
    try {
      await updateIntegrationStatus(workspaceId, 'META', 'ERROR');
    } catch {}

    settingsUrl.searchParams.set('error', 'meta_connection_failed');
    settingsUrl.searchParams.set(
      'error_description',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.redirect(settingsUrl);
  }
}
