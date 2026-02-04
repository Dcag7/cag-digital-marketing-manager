import { redirect } from 'next/navigation';
import { getUserWorkspaces, createWorkspace } from '@/server/actions/workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function AppPage() {
  const workspaces = await getUserWorkspaces();

  type WorkspaceType = typeof workspaces[number];

  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
        {/* Colorful gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-red-500/20 rounded-full blur-3xl translate-y-1/2" />
        
        <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">G</span>
            </div>
            <CardTitle className="text-2xl">Welcome to Growth OS</CardTitle>
            <CardDescription className="text-base">
              Create your first workspace to get started. A workspace represents a client or brand you&apos;ll manage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData: FormData) => {
                'use server';
                const name = formData.get('name') as string;
                const slug = name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, '');
                
                const workspace = await createWorkspace({ name, slug });
                redirect(`/app/${workspace.id}/overview`);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., My Brand, Client ABC"
                  required
                  minLength={1}
                  maxLength={100}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  This is the name of the brand or client you&apos;ll be managing.
                </p>
              </div>
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Create Workspace
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (workspaces.length === 1) {
    redirect(`/app/${workspaces[0].id}/overview`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Colorful gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl translate-x-1/2" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-red-500/20 rounded-full blur-3xl translate-y-1/2" />
      
      <Card className="w-full max-w-2xl relative backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
          <CardTitle className="text-2xl">Select Workspace</CardTitle>
          <CardDescription>Choose a workspace to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {workspaces.map((workspace: WorkspaceType, index: number) => {
              const colors = [
                'from-blue-500 to-indigo-600',
                'from-green-500 to-emerald-600',
                'from-yellow-400 to-orange-500',
                'from-red-500 to-rose-600',
                'from-purple-500 to-violet-600',
              ];
              const colorClass = colors[index % colors.length];
              
              return (
                <a
                  key={workspace.id}
                  href={`/app/${workspace.id}/overview`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all duration-200 group hover-lift"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-md`}>
                    <span className="text-white font-bold text-lg">
                      {workspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{workspace.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Role: {workspace.role}
                    </div>
                  </div>
                  <div className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
                    →
                  </div>
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
