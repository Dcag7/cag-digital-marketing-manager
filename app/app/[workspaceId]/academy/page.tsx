import { AcademyClient } from './academy-client';

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  
  return <AcademyClient workspaceId={workspaceId} />;
}
