'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ShopifyIntegrationPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const [shopDomain, setShopDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (!shopDomain) {
      setError('Please enter your Shopify store domain');
      return;
    }

    setIsLoading(true);
    setError('');

    // Normalize shop domain
    let normalizedDomain = shopDomain.trim().toLowerCase();
    if (!normalizedDomain.includes('.myshopify.com')) {
      normalizedDomain = `${normalizedDomain}.myshopify.com`;
    }
    // Remove protocol if present
    normalizedDomain = normalizedDomain.replace(/^https?:\/\//, '');

    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectUri = `${appUrl}/api/integrations/shopify/callback`;

    // Encode workspace ID in state
    const state = Buffer.from(JSON.stringify({ workspaceId })).toString('base64');

    // Required scopes for order and product data
    const scopes = [
      'read_orders',
      'read_products',
      'read_inventory',
      'read_analytics',
    ].join(',');

    const authUrl = new URL(`https://${normalizedDomain}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', apiKey || '');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    window.location.href = authUrl.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connect Shopify</h1>
        <p className="text-muted-foreground">
          Connect your Shopify store to sync orders and products
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shopify Store</CardTitle>
          <CardDescription>
            Grant access to read your store&apos;s orders, products, and analytics data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p className="font-medium">This integration will allow Growth OS to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Read your order history and revenue data</li>
              <li>View product catalog and inventory levels</li>
              <li>Access store analytics for attribution</li>
              <li>Calculate true ROAS from actual orders</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopDomain">Store Domain</Label>
            <div className="flex gap-2">
              <Input
                id="shopDomain"
                placeholder="your-store"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
              <span className="flex items-center text-muted-foreground text-sm">
                .myshopify.com
              </span>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="bg-muted p-4 rounded-md text-sm">
            <p className="font-medium mb-2">Before connecting:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Ensure you have admin or app installation permissions</li>
              <li>The store should be on a Shopify plan (not paused)</li>
              <li>You&apos;ll be redirected to Shopify to authorize access</li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleConnect} disabled={isLoading || !shopDomain}>
              {isLoading ? 'Connecting...' : 'Connect Shopify Store'}
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
