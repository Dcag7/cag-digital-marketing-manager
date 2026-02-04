import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Image, Video, Palette, TrendingDown, Plus, Zap } from 'lucide-react';

export default async function CreativePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  // Sample creative types for the empty state
  const creativeTypes = [
    { name: 'Images', icon: Image, count: 0, color: 'from-blue-500 to-indigo-600' },
    { name: 'Videos', icon: Video, count: 0, color: 'from-red-500 to-rose-600' },
    { name: 'Carousels', icon: Palette, count: 0, color: 'from-yellow-400 to-amber-500' },
  ];

  return (
    <div className="space-y-8 animate-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Creative Intelligence</h1>
          </div>
          <p className="text-muted-foreground">Manage creatives, detect fatigue, and generate briefs</p>
        </div>
        <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Upload Creative
        </Button>
      </div>

      {/* Creative Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {creativeTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.name} className="hover-lift">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{type.name}</p>
                    <p className="text-3xl font-bold mt-1">{type.count}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Creative Library */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Image className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Creative Library</CardTitle>
                <p className="text-sm text-muted-foreground">All your ad creatives in one place</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <Image className="h-10 w-10 text-white" />
              </div>
              <p className="text-lg font-semibold">No creatives yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Connect Meta to sync your ad creatives</p>
              <Button variant="outline">
                Connect Meta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fatigue Detection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Fatigue Detection</CardTitle>
              <p className="text-sm text-muted-foreground">Creatives showing signs of declining performance</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 text-center">
            <Zap className="h-8 w-8 text-orange-500 mx-auto mb-3" />
            <p className="font-medium">No fatigue detected</p>
            <p className="text-sm text-muted-foreground mt-1">All your creatives are performing well</p>
          </div>
        </CardContent>
      </Card>

      {/* Creative Briefs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Creative Briefs</CardTitle>
                <p className="text-sm text-muted-foreground">AI-generated briefs for new creatives</p>
              </div>
            </div>
            <Button variant="outline" className="border-green-500/50 text-green-600 hover:bg-green-500/10">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Brief
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 text-center">
            <Sparkles className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <p className="font-medium">No briefs generated yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click &quot;Generate Brief&quot; to create AI-powered creative briefs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
