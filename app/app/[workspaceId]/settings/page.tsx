import { auth } from '@clerk/nextjs/server';
import { getWorkspaceMember, getWorkspaceMembers } from '@/server/actions/workspace';
import { getIntegrations } from '@/server/actions/integrations';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { BusinessProfileForm } from './business-profile-form';
import { GuardrailsForm } from './guardrails-form';
import { MembersForm } from './members-form';

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ success?: string; error?: string; error_description?: string }>;
}) {
  const { workspaceId } = await params;
  const query = await searchParams;
  const { userId } = await auth();
  
  const member = await getWorkspaceMember(workspaceId);
  const integrations = await getIntegrations(workspaceId);

  const canManage = member?.role === 'OWNER' || member?.role === 'ADMIN';

  // Get additional data for forms if user can manage
  let businessProfile = null;
  let guardrails = null;
  let members: Awaited<ReturnType<typeof getWorkspaceMembers>> = [];

  if (canManage) {
    [businessProfile, guardrails, members] = await Promise.all([
      prisma.workspaceBusinessProfile.findUnique({ where: { workspaceId } }),
      prisma.workspaceGuardrails.findUnique({ where: { workspaceId } }),
      getWorkspaceMembers(workspaceId),
    ]);
  }

  const getStatusBadge = (status: string | undefined) => {
    if (status === 'CONNECTED') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Connected</Badge>;
    }
    if (status === 'ERROR') {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="secondary">Disconnected</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace configuration</p>
      </div>

      {/* Show success/error messages from OAuth redirects */}
      {query.success && (
        <div className="p-4 text-sm text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20 rounded-md">
          {query.success === 'meta_connected' && 'Meta account connected successfully!'}
          {query.success === 'shopify_connected' && 'Shopify store connected successfully!'}
          {query.success === 'google_connected' && 'Google Ads account connected successfully!'}
        </div>
      )}

      {query.error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          <p className="font-medium">Connection failed</p>
          <p>{query.error_description || query.error}</p>
        </div>
      )}

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
              <CardDescription>Connect your Facebook/Instagram ad accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {getStatusBadge(integrations.find(i => i.type === 'META')?.status)}
                  {integrations.find(i => i.type === 'META')?.connectedAt && (
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(integrations.find(i => i.type === 'META')!.connectedAt!).toLocaleDateString()}
                    </p>
                  )}
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
              <CardDescription>Connect your Shopify store for revenue attribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {getStatusBadge(integrations.find(i => i.type === 'SHOPIFY')?.status)}
                  {integrations.find(i => i.type === 'SHOPIFY')?.connectedAt && (
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(integrations.find(i => i.type === 'SHOPIFY')!.connectedAt!).toLocaleDateString()}
                    </p>
                  )}
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
                <div className="space-y-1">
                  {getStatusBadge(integrations.find(i => i.type === 'GOOGLE_ADS')?.status)}
                  {integrations.find(i => i.type === 'GOOGLE_ADS')?.connectedAt && (
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(integrations.find(i => i.type === 'GOOGLE_ADS')!.connectedAt!).toLocaleDateString()}
                    </p>
                  )}
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
              {canManage && userId ? (
                <MembersForm
                  workspaceId={workspaceId}
                  members={members}
                  currentUserId={userId}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have permission to manage members
                </p>
              )}
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
              {canManage ? (
                <GuardrailsForm
                  workspaceId={workspaceId}
                  initialData={guardrails}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have permission to manage guardrails
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Configure your business metrics and targets for AI recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {canManage ? (
                <BusinessProfileForm
                  workspaceId={workspaceId}
                  initialData={businessProfile}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have permission to manage business profile
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
