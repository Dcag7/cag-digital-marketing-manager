'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParams, useRouter } from 'next/navigation';

export default function MetaIntegrationPage() {
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
    const accessToken = formData.get('accessToken') as string;
    const adAccountId = formData.get('adAccountId') as string;

    try {
      const response = await fetch(`/api/integrations/meta/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, accessToken, adAccountId }),
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
        <h1 className="text-3xl font-bold">Connect Meta Marketing API</h1>
        <p className="text-muted-foreground">Connect your Facebook/Instagram ad account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta Credentials</CardTitle>
          <CardDescription>
            Enter your Meta Marketing API credentials. You can get these from the Meta Business Suite.
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
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  name="accessToken"
                  type="password"
                  placeholder="Your Meta access token"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Get this from{' '}
                  <a 
                    href="https://developers.facebook.com/tools/explorer/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Meta Graph API Explorer
                  </a>
                  {' '}or your Meta App settings.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adAccountId">Ad Account ID</Label>
                <Input
                  id="adAccountId"
                  name="adAccountId"
                  placeholder="act_123456789"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Find this in Meta Business Suite → Ad Account Settings. Include the &quot;act_&quot; prefix.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Connecting...' : 'Connect Meta'}
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
            <h4 className="font-semibold mb-1">1. Create a Meta App (if you haven&apos;t already)</h4>
            <p className="text-muted-foreground">
              Go to{' '}
              <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Meta for Developers
              </a>
              {' '}and create a new app with &quot;Business&quot; type.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Add Marketing API</h4>
            <p className="text-muted-foreground">
              In your app settings, add the Marketing API product.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Generate Access Token</h4>
            <p className="text-muted-foreground">
              Use the Graph API Explorer to generate a token with ads_read and ads_management permissions.
              For production, use a System User token.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Find Ad Account ID</h4>
            <p className="text-muted-foreground">
              In Meta Business Suite, go to Settings → Ad Account Settings. The ID starts with &quot;act_&quot;.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
