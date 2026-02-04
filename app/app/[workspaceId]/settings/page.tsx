import { getWorkspaceMember } from '@/server/actions/workspace';
import { getIntegrations } from '@/server/actions/integrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const member = await getWorkspaceMember(workspaceId);
  const integrations = await getIntegrations(workspaceId);

  const canManage = member?.role === 'OWNER' || member?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace configuration</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="members" disabled={!canManage}>
            Members
          </TabsTrigger>
          <TabsTrigger value="guardrails" disabled={!canManage}>
            Guardrails
          </TabsTrigger>
          <TabsTrigger value="business" disabled={!canManage}>
            Business Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meta Marketing API</CardTitle>
              <CardDescription>Connect your Facebook ad account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    Status:{' '}
                    {integrations.find(i => i.type === 'META')?.status || 'DISCONNECTED'}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/app/${workspaceId}/settings/integrations/meta`}>
                    {integrations.find(i => i.type === 'META')?.status === 'CONNECTED'
                      ? 'Reconnect'
                      : 'Connect'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shopify</CardTitle>
              <CardDescription>Connect your Shopify store</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    Status:{' '}
                    {integrations.find(i => i.type === 'SHOPIFY')?.status || 'DISCONNECTED'}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/app/${workspaceId}/settings/integrations/shopify`}>
                    {integrations.find(i => i.type === 'SHOPIFY')?.status === 'CONNECTED'
                      ? 'Reconnect'
                      : 'Connect'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Ads</CardTitle>
              <CardDescription>Connect your Google Ads account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    Status:{' '}
                    {integrations.find(i => i.type === 'GOOGLE_ADS')?.status || 'DISCONNECTED'}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/app/${workspaceId}/settings/integrations/google`}>
                    {integrations.find(i => i.type === 'GOOGLE_ADS')?.status === 'CONNECTED'
                      ? 'Reconnect'
                      : 'Connect'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Members</CardTitle>
              <CardDescription>Manage who has access to this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Member management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardrails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guardrails</CardTitle>
              <CardDescription>Set limits and safety rules for automated actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Guardrails configuration coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Configure your business metrics and targets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Business profile configuration coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
