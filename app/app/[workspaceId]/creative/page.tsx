import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CreativePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Creative Intelligence</h1>
        <p className="text-muted-foreground">Manage creatives, detect fatigue, and generate briefs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creative Library</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Creative library coming soon</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fatigue Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Fatigue detection coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
