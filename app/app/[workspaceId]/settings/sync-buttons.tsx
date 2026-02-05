'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { syncMetaData, syncShopifyData, syncGoogleData, SyncResult } from '@/server/actions/sync';

interface SyncButtonProps {
  workspaceId: string;
  integrationType: 'META' | 'SHOPIFY' | 'GOOGLE_ADS';
  isConnected: boolean;
}

const DATE_RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days (default)' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last 1 year' },
];

export function SyncButton({ workspaceId, integrationType, isConnected }: SyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [days, setDays] = useState(90);

  const handleSync = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      let syncResult: SyncResult;
      
      switch (integrationType) {
        case 'META':
          syncResult = await syncMetaData(workspaceId, days);
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
      
      // Clear success message after 10 seconds
      if (syncResult.success) {
        setTimeout(() => setResult(null), 10000);
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
    <div className="space-y-3 pt-2 border-t">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label htmlFor={`sync-days-${integrationType}`} className="text-xs text-muted-foreground">
            Sync period
          </Label>
          <select
            id={`sync-days-${integrationType}`}
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            disabled={isLoading}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="pt-5">
          <Button
            variant="default"
            size="sm"
            onClick={handleSync}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>
      
      {result && (
        <div className={`text-sm flex items-start gap-2 p-3 rounded-md ${result.success ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'}`}>
          {result.success ? (
            <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">{result.message}</p>
            {result.error && <p className="text-xs mt-1 opacity-80">{result.error}</p>}
            {result.details && (
              <p className="text-xs mt-1 opacity-80">{result.details}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
