import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getUserWorkspaces } from '@/server/actions/workspace';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const workspaces = await getUserWorkspaces();
  if (workspaces.length === 0) {
    // Redirect to create workspace page or show empty state
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Workspaces</h1>
          <p className="text-muted-foreground mb-4">
            Create your first workspace to get started.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
