'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GoogleIntegrationPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri = `${appUrl}/api/integrations/google/callback`;

    // Encode workspace ID in state
    const state = Buffer.from(JSON.stringify({ workspaceId })).toString('base64');

    // Required scopes for Google Ads API
    const scopes = [
      'https://www.googleapis.com/auth/adwords',
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId || '');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    window.location.href = authUrl.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connect Google Ads</h1>
        <p className="text-muted-foreground">
          Connect your Google Ads account to sync campaigns and performance data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Ads</CardTitle>
          <CardDescription>
            Grant access to manage your Google Ads campaigns and view performance metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p className="font-medium">This integration will allow Growth OS to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Read your Google Ads campaign performance data</li>
              <li>View and manage campaigns, ad groups, and ads</li>
              <li>Update budgets and pause/enable campaigns</li>
              <li>Access conversion tracking data</li>
            </ul>
          </div>

          <div className="bg-muted p-4 rounded-md text-sm">
            <p className="font-medium mb-2">Before connecting:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Ensure you have admin access to your Google Ads account</li>
              <li>The account should be active (not suspended)</li>
              <li>You&apos;ll be redirected to Google to authorize access</li>
              <li>Select all accounts you want to manage when prompted</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Note: Google Ads API Access Required
            </p>
            <p className="text-yellow-700 dark:text-yellow-300">
              Your Google Ads account must have API access enabled. If you
              encounter issues, contact your Google Ads representative or
              check your API access in the Google Ads UI under Tools &amp; Settings.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? 'Connecting...' : 'Connect Google Ads'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/app/${workspaceId}/settings`)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
