'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { syncMetaData, syncShopifyData, syncGoogleData, SyncResult } from '@/server/actions/sync';

interface SyncButtonProps {
  workspaceId: string;
  integrationType: 'META' | 'SHOPIFY' | 'GOOGLE_ADS';
  isConnected: boolean;
}

export function SyncButton({ workspaceId, integrationType, isConnected }: SyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      let syncResult: SyncResult;
      
      switch (integrationType) {
        case 'META':
          syncResult = await syncMetaData(workspaceId);
          break;
        case 'SHOPIFY':
          syncResult = await syncShopifyData(workspaceId);
          break;
        case 'GOOGLE_ADS':
          syncResult = await syncGoogleData(workspaceId);
          break;
        default:
          syncResult = { success: false, message: 'Unknown integration type' };
      }

      setResult(syncResult);
      
      // Clear success message after 5 seconds
      if (syncResult.success) {
        setTimeout(() => setResult(null), 5000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Sync failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Syncing...' : 'Sync Now'}
      </Button>
      
      {result && (
        <span className={`text-sm flex items-center gap-1 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.success ? (
            <>
              <Check className="h-4 w-4" />
              {result.message}
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              {result.error || result.message}
            </>
          )}
        </span>
      )}
    </div>
  );
}
