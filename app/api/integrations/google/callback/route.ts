import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { saveIntegrationSecret, updateIntegrationStatus } from '@/server/actions/integrations';
import { prisma } from '@/lib/db';

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
    console.error('Google OAuth error:', error, errorDescription);
    settingsUrl.searchParams.set('error', 'google_auth_failed');
    settingsUrl.searchParams.set('error_description', errorDescription || error);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code) {
    settingsUrl.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(settingsUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    settingsUrl.searchParams.set('error', 'google_not_configured');
    return NextResponse.redirect(settingsUrl);
  }

  const redirectUri = `${appUrl}/api/integrations/google/callback`;

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Google token exchange failed:', errorData);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokenData = await tokenResponse.json();

    // Store encrypted tokens
    await saveIntegrationSecret(workspaceId, 'GOOGLE_ADS', {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      obtained_at: Date.now(),
    });

    // Get accessible customer IDs using Google Ads API
    let customerIds: string[] = [];
    if (developerToken) {
      try {
        const customersResponse = await fetch(
          'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers',
          {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'developer-token': developerToken,
            },
          }
        );

        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          customerIds = (customersData.resourceNames || []).map((rn: string) =>
            rn.replace('customers/', '')
          );

          // Create Google Ads account records
          for (const customerId of customerIds) {
            try {
              // Get account details
              const accountResponse = await fetch(
                `https://googleads.googleapis.com/v17/customers/${customerId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'developer-token': developerToken,
                    'login-customer-id': customerId,
                  },
                }
              );

              let accountInfo = { descriptiveName: `Account ${customerId}` };
              if (accountResponse.ok) {
                const accountData = await accountResponse.json();
                accountInfo = {
                  descriptiveName: accountData.descriptiveName || `Account ${customerId}`,
                };
              }

              await prisma.googleAdsAccount.upsert({
                where: {
                  workspaceId_customerId: {
                    workspaceId,
                    customerId,
                  },
                },
                create: {
                  id: `${workspaceId}_${customerId}`,
                  workspaceId,
                  customerId,
                  name: accountInfo.descriptiveName,
                },
                update: {
                  name: accountInfo.descriptiveName,
                },
              });
            } catch (accountError) {
              console.error(`Failed to fetch account ${customerId}:`, accountError);
            }
          }
        }
      } catch (customersError) {
        console.error('Failed to fetch Google Ads customers:', customersError);
      }
    }

    // Update integration status
    await updateIntegrationStatus(workspaceId, 'GOOGLE_ADS', 'CONNECTED', {
      customer_ids: customerIds,
    });

    settingsUrl.searchParams.set('success', 'google_connected');
    return NextResponse.redirect(settingsUrl);
  } catch (error) {
    console.error('Google OAuth callback error:', error);

    try {
      await updateIntegrationStatus(workspaceId, 'GOOGLE_ADS', 'ERROR');
    } catch {}

    settingsUrl.searchParams.set('error', 'google_connection_failed');
    settingsUrl.searchParams.set(
      'error_description',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.redirect(settingsUrl);
  }
}
