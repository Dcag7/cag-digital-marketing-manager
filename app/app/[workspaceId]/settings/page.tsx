import { getWorkspaceMember } from '@/server/actions/workspace';
import { getIntegrations } from '@/server/actions/integrations';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { updateBusinessProfile } from '@/server/actions/business-profile';
import { updateGuardrails } from '@/server/actions/guardrails';
import { revalidatePath } from 'next/cache';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const member = await getWorkspaceMember(workspaceId);
  const integrations = await getIntegrations(workspaceId);
  
  const businessProfile = await prisma.workspaceBusinessProfile.findUnique({
    where: { workspaceId },
  });
  
  const guardrails = await prisma.workspaceGuardrails.findUnique({
    where: { workspaceId },
  });

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
          <TabsTrigger value="business" disabled={!canManage}>
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="guardrails" disabled={!canManage}>
            Guardrails
          </TabsTrigger>
          <TabsTrigger value="members" disabled={!canManage}>
            Members
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
                    <span className={integrations.find(i => i.type === 'META')?.status === 'CONNECTED' ? 'text-green-600' : 'text-yellow-600'}>
                      {integrations.find(i => i.type === 'META')?.status || 'DISCONNECTED'}
                    </span>
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
                    <span className={integrations.find(i => i.type === 'SHOPIFY')?.status === 'CONNECTED' ? 'text-green-600' : 'text-yellow-600'}>
                      {integrations.find(i => i.type === 'SHOPIFY')?.status || 'DISCONNECTED'}
                    </span>
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
                    <span className={integrations.find(i => i.type === 'GOOGLE_ADS')?.status === 'CONNECTED' ? 'text-green-600' : 'text-yellow-600'}>
                      {integrations.find(i => i.type === 'GOOGLE_ADS')?.status || 'DISCONNECTED'}
                    </span>
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

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Configure your business metrics and targets. These values are used by the AI to make recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={async (formData: FormData) => {
                  'use server';
                  await updateBusinessProfile(workspaceId, {
                    targetCpaZar: parseFloat(formData.get('targetCpaZar') as string) || 0,
                    breakEvenRoas: parseFloat(formData.get('breakEvenRoas') as string) || 1,
                    grossMarginPct: (parseFloat(formData.get('grossMarginPct') as string) || 50) / 100,
                    avgShippingCostZar: parseFloat(formData.get('avgShippingCostZar') as string) || 0,
                    returnRatePct: (parseFloat(formData.get('returnRatePct') as string) || 0) / 100,
                    paymentFeesPct: (parseFloat(formData.get('paymentFeesPct') as string) || 3) / 100,
                    monthlySpendCapZar: formData.get('monthlySpendCapZar') 
                      ? parseFloat(formData.get('monthlySpendCapZar') as string) 
                      : null,
                    strategicMode: (formData.get('strategicMode') as 'GROWTH' | 'EFFICIENCY' | 'RECOVERY' | 'LIQUIDATION' | 'HOLD') || 'GROWTH',
                  });
                  revalidatePath(`/app/${workspaceId}/settings`);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetCpaZar">Target CPA (ZAR)</Label>
                    <Input
                      id="targetCpaZar"
                      name="targetCpaZar"
                      type="number"
                      step="0.01"
                      defaultValue={businessProfile?.targetCpaZar || ''}
                      placeholder="e.g., 150"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your target cost per acquisition in South African Rand
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="breakEvenRoas">Break-Even ROAS</Label>
                    <Input
                      id="breakEvenRoas"
                      name="breakEvenRoas"
                      type="number"
                      step="0.01"
                      defaultValue={businessProfile?.breakEvenRoas || ''}
                      placeholder="e.g., 2.5"
                    />
                    <p className="text-xs text-muted-foreground">
                      The ROAS at which you break even (e.g., 2.5 = R2.50 revenue per R1 spent)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grossMarginPct">Gross Margin (%)</Label>
                    <Input
                      id="grossMarginPct"
                      name="grossMarginPct"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      defaultValue={businessProfile ? (businessProfile.grossMarginPct * 100).toFixed(0) : ''}
                      placeholder="e.g., 50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your gross profit margin percentage
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avgShippingCostZar">Avg Shipping Cost (ZAR)</Label>
                    <Input
                      id="avgShippingCostZar"
                      name="avgShippingCostZar"
                      type="number"
                      step="0.01"
                      defaultValue={businessProfile?.avgShippingCostZar || ''}
                      placeholder="e.g., 75"
                    />
                    <p className="text-xs text-muted-foreground">
                      Average shipping cost per order
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="returnRatePct">Return Rate (%)</Label>
                    <Input
                      id="returnRatePct"
                      name="returnRatePct"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      defaultValue={businessProfile ? (businessProfile.returnRatePct * 100).toFixed(1) : ''}
                      placeholder="e.g., 5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentage of orders that are returned
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentFeesPct">Payment Fees (%)</Label>
                    <Input
                      id="paymentFeesPct"
                      name="paymentFeesPct"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      defaultValue={businessProfile ? (businessProfile.paymentFeesPct * 100).toFixed(1) : ''}
                      placeholder="e.g., 3"
                    />
                    <p className="text-xs text-muted-foreground">
                      Payment gateway fees (e.g., PayFast, Peach)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlySpendCapZar">Monthly Spend Cap (ZAR)</Label>
                    <Input
                      id="monthlySpendCapZar"
                      name="monthlySpendCapZar"
                      type="number"
                      step="1"
                      defaultValue={businessProfile?.monthlySpendCapZar || ''}
                      placeholder="e.g., 50000 (optional)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum monthly ad spend (leave empty for no cap)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strategicMode">Strategic Mode</Label>
                    <select
                      id="strategicMode"
                      name="strategicMode"
                      defaultValue={businessProfile?.strategicMode || 'GROWTH'}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="GROWTH">Growth - Maximize revenue</option>
                      <option value="EFFICIENCY">Efficiency - Optimize ROAS</option>
                      <option value="RECOVERY">Recovery - Reduce losses</option>
                      <option value="LIQUIDATION">Liquidation - Clear stock</option>
                      <option value="HOLD">Hold - Maintain current</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Your current business objective
                    </p>
                  </div>
                </div>

                <Button type="submit">Save Business Profile</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardrails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guardrails</CardTitle>
              <CardDescription>
                Set safety limits for automated actions. The AI will respect these limits when making recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={async (formData: FormData) => {
                  'use server';
                  await updateGuardrails(workspaceId, {
                    maxBudgetChangePercentDaily: parseFloat(formData.get('maxBudgetChangePercentDaily') as string) || 20,
                    maxPausesPerDay: parseInt(formData.get('maxPausesPerDay') as string) || 5,
                    minSpendZar: parseFloat(formData.get('minSpendZar') as string) || 100,
                    maxSpendZar: formData.get('maxSpendZar') 
                      ? parseFloat(formData.get('maxSpendZar') as string) 
                      : null,
                  });
                  revalidatePath(`/app/${workspaceId}/settings`);
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxBudgetChangePercentDaily">Max Daily Budget Change (%)</Label>
                    <Input
                      id="maxBudgetChangePercentDaily"
                      name="maxBudgetChangePercentDaily"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      defaultValue={guardrails?.maxBudgetChangePercentDaily || 20}
                      placeholder="e.g., 20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum percentage a budget can change in one day (up or down)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPausesPerDay">Max Pauses Per Day</Label>
                    <Input
                      id="maxPausesPerDay"
                      name="maxPausesPerDay"
                      type="number"
                      step="1"
                      min="0"
                      defaultValue={guardrails?.maxPausesPerDay || 5}
                      placeholder="e.g., 5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of campaigns/ad sets that can be paused per day
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minSpendZar">Min Spend Before Action (ZAR)</Label>
                    <Input
                      id="minSpendZar"
                      name="minSpendZar"
                      type="number"
                      step="1"
                      min="0"
                      defaultValue={guardrails?.minSpendZar || 100}
                      placeholder="e.g., 100"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum spend required before pausing an underperforming entity
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxSpendZar">Max Daily Spend (ZAR)</Label>
                    <Input
                      id="maxSpendZar"
                      name="maxSpendZar"
                      type="number"
                      step="1"
                      min="0"
                      defaultValue={guardrails?.maxSpendZar || ''}
                      placeholder="e.g., 5000 (optional)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum daily spend cap (leave empty for no cap)
                    </p>
                  </div>
                </div>

                <Button type="submit">Save Guardrails</Button>
              </form>
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
                Member management coming soon. Currently, you are the only member (OWNER).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
