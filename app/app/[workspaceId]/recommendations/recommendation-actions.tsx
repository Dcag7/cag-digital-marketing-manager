'use client';

import { Button } from '@/components/ui/button';
import { approveRecommendation, rejectRecommendation } from '@/server/actions/recommendations';
import { useState } from 'react';

export function RecommendationActions({
  recommendationId,
  workspaceId,
}: {
  recommendationId: string;
  workspaceId: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveRecommendation(recommendationId, workspaceId);
      window.location.reload();
    } catch (error) {
      alert('Failed to approve: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await rejectRecommendation(recommendationId);
      window.location.reload();
    } catch (error) {
      alert('Failed to reject: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 pt-2">
      <Button onClick={handleApprove} disabled={loading} variant="default">
        Approve
      </Button>
      <Button onClick={handleReject} disabled={loading} variant="outline">
        Reject
      </Button>
    </div>
  );
}
