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
  ArrowLeftRight,
  ChevronDown
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserButton } from '@clerk/nextjs';

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
  const currentWorkspace = workspaces.find(w => w.id === workspaceId);

  type WorkspaceType = typeof workspaces[number];

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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Growth OS</h1>
            </div>
          </div>
        </div>

        {/* Workspace Selector */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-xs">
                {currentWorkspace?.name?.charAt(0).toUpperCase() || 'W'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {currentWorkspace?.name || 'Workspace'}
              </p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary group"
              >
                <Icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Link
            href="/app"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Switch Workspace</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Breadcrumb or page title can go here */}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
