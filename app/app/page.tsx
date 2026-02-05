import { redirect } from 'next/navigation';
import { getUserWorkspaces } from '@/server/actions/workspace';
import { CreateWorkspaceForm } from './create-workspace-form';

export default async function AppPage() {
  const workspaces = await getUserWorkspaces();

  if (workspaces.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-center">Create Your First Workspace</h1>
          <p className="text-muted-foreground text-center">
            A workspace represents a client or brand you'll manage.
          </p>
          <CreateWorkspaceForm />
        </div>
      </div>
    );
  }

  // Redirect to first workspace or show selector
  if (workspaces.length === 1) {
    redirect(`/app/${workspaces[0].id}`);
  }

  // Show workspace selector
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-center">Select Workspace</h1>
        <div className="grid gap-4">
          {workspaces.map((workspace) => (
            <a
              key={workspace.id}
              href={`/app/${workspace.id}`}
              className="block p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="font-semibold">{workspace.name}</div>
              <div className="text-sm text-muted-foreground">
                Role: {workspace.role}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
