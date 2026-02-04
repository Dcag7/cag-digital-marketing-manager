'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParams, useRouter } from 'next/navigation';

export default function GoogleAdsIntegrationPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const customerId = formData.get('customerId') as string;
    const developerToken = formData.get('developerToken') as string;
    const refreshToken = formData.get('refreshToken') as string;
    const clientId = formData.get('clientId') as string;
    const clientSecret = formData.get('clientSecret') as string;

    try {
      const response = await fetch(`/api/integrations/google/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workspaceId, 
          customerId, 
          developerToken, 
          refreshToken,
          clientId,
          clientSecret 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/app/${workspaceId}/settings`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connect Google Ads</h1>
        <p className="text-muted-foreground">Connect your Google Ads account to sync campaigns</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Ads Credentials</CardTitle>
          <CardDescription>
            Enter your Google Ads API credentials. This requires a Google Ads API developer token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="p-4 bg-green-50 text-green-800 rounded-md">
              ✓ Successfully connected! Redirecting...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer ID</Label>
                <Input
                  id="customerId"
                  name="customerId"
                  placeholder="123-456-7890"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your Google Ads customer ID (found in the top right of Google Ads)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="developerToken">Developer Token</Label>
                <Input
                  id="developerToken"
                  name="developerToken"
                  type="password"
                  placeholder="Your developer token"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Get this from Google Ads API Center
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">OAuth Client ID</Label>
                <Input
                  id="clientId"
                  name="clientId"
                  placeholder="xxxxx.apps.googleusercontent.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">OAuth Client Secret</Label>
                <Input
                  id="clientSecret"
                  name="clientSecret"
                  type="password"
                  placeholder="Your client secret"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refreshToken">Refresh Token</Label>
                <Input
                  id="refreshToken"
                  name="refreshToken"
                  type="password"
                  placeholder="Your refresh token"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Generated via OAuth flow with your Google account
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Connecting...' : 'Connect Google Ads'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push(`/app/${workspaceId}/settings`)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to get your credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-1">1. Apply for API Access</h4>
            <p className="text-muted-foreground">
              Go to{' '}
              <a href="https://ads.google.com/aw/apicenter" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Google Ads API Center
              </a>
              {' '}and apply for a developer token (if you haven&apos;t already).
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Create OAuth Credentials</h4>
            <p className="text-muted-foreground">
              In Google Cloud Console, create OAuth 2.0 credentials (Web application type).
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Generate Refresh Token</h4>
            <p className="text-muted-foreground">
              Use the OAuth Playground or Google&apos;s client libraries to generate a refresh token
              with the https://www.googleapis.com/auth/adwords scope.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Find Customer ID</h4>
            <p className="text-muted-foreground">
              Your Customer ID is shown in the top right corner of Google Ads (format: 123-456-7890).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
