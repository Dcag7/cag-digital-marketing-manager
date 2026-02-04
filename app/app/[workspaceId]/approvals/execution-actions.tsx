'use client';

import { Button } from '@/components/ui/button';
import { runExecution } from '@/server/actions/executions';
import { useState } from 'react';

export function ExecutionActions({
  recommendationId,
  workspaceId,
  actionIds,
}: {
  recommendationId: string;
  workspaceId: string;
  actionIds: string[];
}) {
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!confirm('Are you sure you want to execute these actions? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await runExecution(workspaceId, recommendationId, actionIds);
      alert('Execution started successfully');
      window.location.reload();
    } catch (error) {
      alert('Failed to execute: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExecute} disabled={loading} variant="default">
      Execute All Actions
    </Button>
  );
}
