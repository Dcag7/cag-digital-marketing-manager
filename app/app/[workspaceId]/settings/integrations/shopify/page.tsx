'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParams, useRouter } from 'next/navigation';

export default function ShopifyIntegrationPage() {
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
    const shopDomain = formData.get('shopDomain') as string;
    const accessToken = formData.get('accessToken') as string;

    try {
      const response = await fetch(`/api/integrations/shopify/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, shopDomain, accessToken }),
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
        <h1 className="text-3xl font-bold">Connect Shopify</h1>
        <p className="text-muted-foreground">Connect your Shopify store to sync orders and products</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shopify Credentials</CardTitle>
          <CardDescription>
            Enter your Shopify store credentials. You&apos;ll need to create a private app in your Shopify admin.
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
                <Label htmlFor="shopDomain">Shop Domain</Label>
                <Input
                  id="shopDomain"
                  name="shopDomain"
                  placeholder="your-store.myshopify.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your Shopify store domain (without https://)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Admin API Access Token</Label>
                <Input
                  id="accessToken"
                  name="accessToken"
                  type="password"
                  placeholder="shpat_xxxxx"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Get this from your Shopify Admin → Settings → Apps → Develop apps
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Connecting...' : 'Connect Shopify'}
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
            <h4 className="font-semibold mb-1">1. Go to Shopify Admin</h4>
            <p className="text-muted-foreground">
              Log in to your Shopify store admin panel.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">2. Create a Custom App</h4>
            <p className="text-muted-foreground">
              Go to Settings → Apps and sales channels → Develop apps → Create an app
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">3. Configure API Scopes</h4>
            <p className="text-muted-foreground">
              In your app, go to Configuration → Admin API integration. Enable these scopes:
              read_orders, read_products, read_customers, read_analytics
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">4. Install and Get Token</h4>
            <p className="text-muted-foreground">
              Install the app, then go to API credentials to reveal the Admin API access token.
              Copy the token that starts with &quot;shpat_&quot;.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
