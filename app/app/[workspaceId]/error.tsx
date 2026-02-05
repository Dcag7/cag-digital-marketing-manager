'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  useEffect(() => {
    console.error('Workspace error:', error);
  }, [error]);

  const isUnauthorized =
    error.message.toLowerCase().includes('unauthorized') ||
    error.message.toLowerCase().includes('access denied');

  const isNotFound =
    error.message.toLowerCase().includes('not found') ||
    error.message.toLowerCase().includes('does not exist');

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive">
            {isUnauthorized
              ? 'Access Denied'
              : isNotFound
              ? 'Not Found'
              : 'Something went wrong'}
          </CardTitle>
          <CardDescription>
            {isUnauthorized
              ? "You don't have permission to access this workspace or resource."
              : isNotFound
              ? 'The requested resource could not be found.'
              : 'An unexpected error occurred while loading this page.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-muted p-3 rounded-md">
              <p className="font-mono text-sm text-destructive break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="font-mono text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={reset}>Try Again</Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/app/${workspaceId}/overview`)}
            >
              Go to Overview
            </Button>
            <Button variant="ghost" onClick={() => router.push('/app')}>
              All Workspaces
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
