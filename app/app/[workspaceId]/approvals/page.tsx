import { prisma } from '@/lib/db';
import { checkWorkspaceAccess } from '@/server/actions/workspace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { ExecutionActions } from './execution-actions';

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'OPERATOR');

  const recommendations = await prisma.recommendation.findMany({
    where: {
      workspaceId,
      status: 'APPROVED',
    },
    include: {
      proposedActions: {
        where: {
          status: 'APPROVED',
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approvals</h1>
        <p className="text-muted-foreground">Execute approved recommendations</p>
      </div>

      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No approved recommendations ready for execution</p>
            </CardContent>
          </Card>
        ) : (
          recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-2">{rec.summary}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Approved {formatDate(rec.updatedAt)}
                    </p>
                  </div>
                  <Badge>{rec.proposedActions.length} actions ready</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {rec.proposedActions.map((action) => (
                    <div key={action.id} className="text-sm border-l-2 pl-2">
                      <strong>{action.type}</strong> on {action.channel}{' '}
                      {action.entity.name && `(${action.entity.name})`}
                      <p className="text-muted-foreground text-xs mt-1">
                        {action.rationale}
                      </p>
                    </div>
                  ))}
                </div>
                {hasAccess && rec.proposedActions.length > 0 && (
                  <ExecutionActions
                    recommendationId={rec.id}
                    workspaceId={workspaceId}
                    actionIds={rec.proposedActions.map(a => a.id)}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
