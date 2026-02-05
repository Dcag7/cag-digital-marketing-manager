import { generateRecommendations } from '@/server/services/recommendations';
import { RecommendationsClient } from './recommendations-client';

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  
  // Generate recommendations based on last 7 days of data
  const recommendations = await generateRecommendations(workspaceId, 7);
  
  return (
    <RecommendationsClient 
      workspaceId={workspaceId} 
      recommendations={recommendations} 
    />
  );
}
