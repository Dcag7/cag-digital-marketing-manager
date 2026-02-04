import { prisma } from '@/lib/db';
import { checkWorkspaceAccess } from '@/server/actions/workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { generateRecommendation, proposeRecommendation } from '@/lib/agent/generator';
import { RecommendationActions } from './recommendation-actions';

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const hasAccess = await checkWorkspaceAccess(workspaceId, 'OPERATOR');

  const recommendations = await prisma.recommendation.findMany({
    where: { workspaceId },
    include: {
      proposedActions: true,
      diagnostics: true,
      creativeBriefs: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  type RecommendationType = typeof recommendations[number];
  type ProposedActionType = RecommendationType['proposedActions'][number];
  type DiagnosticType = RecommendationType['diagnostics'][number];
  type CreativeBriefType = RecommendationType['creativeBriefs'][number];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recommendations</h1>
          <p className="text-muted-foreground">AI-generated action plans requiring approval</p>
        </div>
        {hasAccess && (
          <form action={async () => {
            'use server';
            const id = await generateRecommendation(workspaceId);
            await proposeRecommendation(id);
          }}>
            <Button type="submit">Generate New Recommendation</Button>
          </form>
        )}
      </div>

      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No recommendations yet. Generate one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          recommendations.map((rec: RecommendationType) => (
            <Card key={rec.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="mb-2">{rec.summary}</CardTitle>
                    <CardDescription>
                      Created {formatDate(rec.createdAt)}
                      {rec.modeRecommendation && (
                        <Badge variant="outline" className="ml-2">
                          {rec.modeRecommendation}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      rec.status === 'PROPOSED'
                        ? 'default'
                        : rec.status === 'APPROVED'
                        ? 'default'
                        : rec.status === 'EXECUTED'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {rec.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {rec.diagnostics.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Diagnostics</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {rec.diagnostics.map((d: DiagnosticType, i: number) => (
                        <li key={i}>
                          <strong>{d.metric}:</strong> {d.finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rec.proposedActions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      Proposed Actions ({rec.proposedActions.length})
                    </h3>
                    <ul className="space-y-2">
                      {rec.proposedActions.slice(0, 3).map((action: ProposedActionType) => {
                        const entityName = (action.entity as Record<string, unknown>)?.name as string | undefined;
                        return (
                          <li key={action.id} className="text-sm border-l-2 pl-2">
                            <strong>{action.type}</strong> on {action.channel}{' '}
                            {entityName && `(${entityName})`}
                            <p className="text-muted-foreground text-xs mt-1">
                              {action.rationale}
                            </p>
                          </li>
                        );
                      })}
                      {rec.proposedActions.length > 3 && (
                        <li className="text-sm text-muted-foreground">
                          +{rec.proposedActions.length - 3} more actions
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {rec.creativeBriefs.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      Creative Briefs ({rec.creativeBriefs.length})
                    </h3>
                    <ul className="space-y-2">
                      {rec.creativeBriefs.map((brief: CreativeBriefType) => (
                        <li key={brief.id} className="text-sm">
                          <strong>{brief.title}</strong> - {brief.angle}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rec.status === 'PROPOSED' && hasAccess && (
                  <RecommendationActions recommendationId={rec.id} workspaceId={workspaceId} />
                )}

                <div className="pt-2">
                  <Link
                    href={`/app/${workspaceId}/recommendations/${rec.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
