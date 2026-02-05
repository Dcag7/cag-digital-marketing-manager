'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MetaIntegrationPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);

    const appId = process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri = `${appUrl}/api/integrations/meta/callback`;
    
    // Encode workspace ID in state
    const state = Buffer.from(JSON.stringify({ workspaceId })).toString('base64');

    // Required scopes for Marketing API
    const scopes = [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
    ].join(',');

    const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
    authUrl.searchParams.set('client_id', appId || '');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');

    window.location.href = authUrl.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connect Meta</h1>
        <p className="text-muted-foreground">
          Connect your Facebook/Instagram advertising account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta Marketing API</CardTitle>
          <CardDescription>
            Grant access to manage your Meta ad accounts, campaigns, and view performance data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p className="font-medium">This integration will allow Growth OS to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Read your ad account performance data</li>
              <li>View and manage campaigns, ad sets, and ads</li>
              <li>Update budgets and pause/enable campaigns</li>
              <li>Access business management features</li>
            </ul>
          </div>

          <div className="bg-muted p-4 rounded-md text-sm">
            <p className="font-medium mb-2">Before connecting:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Ensure you have admin access to the Facebook Business Manager</li>
              <li>Make sure your ad account is active and in good standing</li>
              <li>You&apos;ll be redirected to Facebook to authorize access</li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? 'Connecting...' : 'Connect Meta Account'}
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
