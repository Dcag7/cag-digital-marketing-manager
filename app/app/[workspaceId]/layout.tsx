import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getWorkspaceMember, getUserWorkspaces } from '@/server/actions/workspace';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Megaphone, 
  Sparkles, 
  Lightbulb, 
  CheckSquare, 
  FileText,
  Settings,
  LogOut
} from 'lucide-react';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const member = await getWorkspaceMember(workspaceId);
  if (!member) {
    redirect('/app');
  }

  const workspaces = await getUserWorkspaces();

  const navItems = [
    { href: `/app/${workspaceId}/overview`, label: 'Overview', icon: LayoutDashboard },
    { href: `/app/${workspaceId}/campaigns`, label: 'Campaigns', icon: Megaphone },
    { href: `/app/${workspaceId}/creative`, label: 'Creative', icon: Sparkles },
    { href: `/app/${workspaceId}/recommendations`, label: 'Recommendations', icon: Lightbulb },
    { href: `/app/${workspaceId}/tasks`, label: 'Tasks', icon: CheckSquare },
    { href: `/app/${workspaceId}/audit`, label: 'Audit Log', icon: FileText },
    { href: `/app/${workspaceId}/settings`, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Growth OS</h2>
          <p className="text-xs text-muted-foreground">Workspace: {workspaceId.slice(0, 8)}</p>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Link
            href="/app"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Workspace</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <select className="border rounded px-3 py-1">
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id} selected={ws.id === workspaceId}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-muted-foreground">
            Role: {member.role}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
