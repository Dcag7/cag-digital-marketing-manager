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
  ChevronDown,
  GraduationCap,
  Mail,
  Bot
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
    { href: `/app/${workspaceId}/overview`, label: 'Overview', icon: LayoutDashboard, color: 'text-blue-500' },
    { href: `/app/${workspaceId}/ai-manager`, label: 'AI Manager', icon: Bot, color: 'text-violet-500' },
    { href: `/app/${workspaceId}/campaigns`, label: 'Campaigns', icon: Megaphone, color: 'text-green-500' },
    { href: `/app/${workspaceId}/email`, label: 'Email', icon: Mail, color: 'text-pink-500' },
    { href: `/app/${workspaceId}/creative`, label: 'Creative', icon: Sparkles, color: 'text-yellow-500' },
    { href: `/app/${workspaceId}/recommendations`, label: 'Recommendations', icon: Lightbulb, color: 'text-purple-500' },
    { href: `/app/${workspaceId}/tasks`, label: 'Tasks', icon: CheckSquare, color: 'text-orange-500' },
    { href: `/app/${workspaceId}/academy`, label: 'Academy', icon: GraduationCap, color: 'text-indigo-500' },
    { href: `/app/${workspaceId}/audit`, label: 'Audit Log', icon: FileText, color: 'text-slate-500' },
    { href: `/app/${workspaceId}/settings`, label: 'Settings', icon: Settings, color: 'text-slate-500' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground tracking-tight">Growth OS</h1>
            </div>
          </div>
        </div>

        {/* Workspace Selector */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {currentWorkspace?.name?.charAt(0).toUpperCase() || 'W'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {currentWorkspace?.name || 'Workspace'}
              </p>
              <p className="text-xs text-muted-foreground">{member.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary group"
              >
                <Icon className={`w-5 h-5 ${item.color} transition-transform group-hover:scale-110`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <Link
            href="/app"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          >
            <ArrowLeftRight className="w-5 h-5" />
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
                  avatarBox: "w-9 h-9"
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
