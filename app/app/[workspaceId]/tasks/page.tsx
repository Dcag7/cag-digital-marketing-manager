import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default async function TasksPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const tasks = await prisma.task.findMany({
    where: { workspaceId },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
    ],
    take: 50,
  });

  type TaskType = typeof tasks[number];

  const thisWeek = tasks.filter((task: TaskType) => {
    if (!task.dueDate) return false;
    const due = new Date(task.dueDate);
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);
    return due >= now && due <= weekFromNow;
  });

  const priorityColors = {
    URGENT: 'destructive',
    HIGH: 'default',
    MEDIUM: 'secondary',
    LOW: 'outline',
  } as const;

  const statusColors = {
    TODO: 'secondary',
    IN_PROGRESS: 'default',
    DONE: 'outline',
    CANCELLED: 'outline',
  } as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">Manage your weekly plan and action items</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This Week Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {thisWeek.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks due this week</p>
          ) : (
            <div className="space-y-2">
              {thisWeek.map((task: TaskType) => (
                <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground">{task.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityColors[task.priority]}>
                      {task.priority}
                    </Badge>
                    <Badge variant={statusColors[task.status]}>
                      {task.status}
                    </Badge>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task: TaskType) => (
                <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground">{task.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityColors[task.priority]}>
                      {task.priority}
                    </Badge>
                    <Badge variant={statusColors[task.status]}>
                      {task.status}
                    </Badge>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
