import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type MetaCampaignWithRelations = Awaited<ReturnType<typeof getMetaCampaigns>>[number];
type GoogleCampaignWithRelations = Awaited<ReturnType<typeof getGoogleCampaigns>>[number];

async function getMetaCampaigns(workspaceId: string) {
  return prisma.metaCampaign.findMany({
    where: { workspaceId },
    include: {
      adSets: {
        include: {
          ads: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getGoogleCampaigns(workspaceId: string) {
  return prisma.googleCampaign.findMany({
    where: { workspaceId },
    include: {
      adGroups: {
        include: {
          ads: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function CampaignsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const metaCampaigns = await getMetaCampaigns(workspaceId);
  const googleCampaigns = await getGoogleCampaigns(workspaceId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <p className="text-muted-foreground">Manage your advertising campaigns</p>
      </div>

      <Tabs defaultValue="meta" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meta">Meta ({metaCampaigns.length})</TabsTrigger>
          <TabsTrigger value="google">Google ({googleCampaigns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="meta" className="space-y-4">
          {metaCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No Meta campaigns found. Connect Meta integration to sync.</p>
              </CardContent>
            </Card>
          ) : (
            metaCampaigns.map((campaign: MetaCampaignWithRelations) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <CardTitle>{campaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Status: {campaign.status} | Objective: {campaign.objective || 'N/A'}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Ad Sets: {campaign.adSets.length} | Ads: {campaign.adSets.reduce((sum: number, as: MetaCampaignWithRelations['adSets'][number]) => sum + as.ads.length, 0)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="google" className="space-y-4">
          {googleCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No Google Ads campaigns found. Connect Google Ads integration to sync.</p>
              </CardContent>
            </Card>
          ) : (
            googleCampaigns.map((campaign: GoogleCampaignWithRelations) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <CardTitle>{campaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Status: {campaign.status}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Ad Groups: {campaign.adGroups.length} | Ads: {campaign.adGroups.reduce((sum: number, ag: GoogleCampaignWithRelations['adGroups'][number]) => sum + ag.ads.length, 0)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
