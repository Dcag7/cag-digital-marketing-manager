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
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        
        <Card className="w-full max-w-md relative">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">G</span>
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
              <Button type="submit" className="w-full h-11">
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      
      <Card className="w-full max-w-2xl relative">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <CardTitle className="text-2xl">Select Workspace</CardTitle>
          <CardDescription>Choose a workspace to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {workspaces.map((workspace: WorkspaceType) => (
              <a
                key={workspace.id}
                href={`/app/${workspace.id}/overview`}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-colors">
                  <span className="text-primary font-semibold">
                    {workspace.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{workspace.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Role: {workspace.role}
                  </div>
                </div>
                <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                  →
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
