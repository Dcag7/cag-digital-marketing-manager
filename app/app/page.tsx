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
    // Show create workspace UI
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Growth OS</CardTitle>
            <CardDescription>
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
                />
                <p className="text-xs text-muted-foreground">
                  This is the name of the brand or client you&apos;ll be managing.
                </p>
              </div>
              <Button type="submit" className="w-full">
                Create Workspace
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to first workspace or show selector
  if (workspaces.length === 1) {
    redirect(`/app/${workspaces[0].id}/overview`);
  }

  // Show workspace selector
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-800">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Select Workspace</CardTitle>
          <CardDescription>Choose a workspace to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {workspaces.map((workspace: WorkspaceType) => (
              <a
                key={workspace.id}
                href={`/app/${workspace.id}/overview`}
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-semibold">{workspace.name}</div>
                <div className="text-sm text-muted-foreground">
                  Role: {workspace.role}
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
