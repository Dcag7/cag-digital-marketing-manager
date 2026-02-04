import 'server-only';

/**
 * Browser Worker Interface
 * 
 * This is a scaffold for future browser automation capabilities.
 * It provides a contract for submitting browser-based jobs but does not
 * enable actual browser automation in the MVP.
 * 
 * To enable:
 * 1. Deploy a browser worker service (Fly.io, Render, Browserless)
 * 2. Set BROWSER_WORKER_ENABLED=true in environment
 * 3. Configure BROWSER_WORKER_URL
 * 4. Implement actual browser automation logic
 */

export interface BrowserJob {
  jobId: string;
  actionPlanId: string;
  workspaceId: string;
  action: string;
  params: Record<string, unknown>;
}

export interface BrowserJobResult {
  jobId: string;
  status: 'completed' | 'failed' | 'running';
  screenshots?: string[];
  logs?: string[];
  error?: string;
}

export async function submitBrowserJob(
  workspaceId: string,
  actionPlanId: string,
  action: string,
  params: Record<string, unknown>
): Promise<string> {
  const enabled = process.env.BROWSER_WORKER_ENABLED === 'true';
  
  if (!enabled) {
    throw new Error('Browser worker is not enabled. Set BROWSER_WORKER_ENABLED=true to enable.');
  }

  const workerUrl = process.env.BROWSER_WORKER_URL;
  if (!workerUrl) {
    throw new Error('BROWSER_WORKER_URL is not configured');
  }

  // Check if workspace has browser automation enabled
  // This would require a flag in Workspace model
  
  const response = await fetch(`${workerUrl}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BROWSER_WORKER_SECRET}`,
    },
    body: JSON.stringify({
      workspaceId,
      actionPlanId,
      action,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Browser worker error: ${response.status}`);
  }

  const data = await response.json() as { jobId: string };
  return data.jobId;
}

export async function getBrowserJobStatus(jobId: string): Promise<BrowserJobResult> {
  const workerUrl = process.env.BROWSER_WORKER_URL;
  if (!workerUrl) {
    throw new Error('BROWSER_WORKER_URL is not configured');
  }

  const response = await fetch(`${workerUrl}/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.BROWSER_WORKER_SECRET}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get job status: ${response.status}`);
  }

  return response.json() as Promise<BrowserJobResult>;
}

/**
 * Documented deployment targets:
 * 
 * 1. Fly.io
 *    - Deploy Playwright service
 *    - Set BROWSER_WORKER_URL=https://your-app.fly.dev
 * 
 * 2. Render
 *    - Deploy as background worker
 *    - Set BROWSER_WORKER_URL=https://your-service.onrender.com
 * 
 * 3. Browserless
 *    - Use managed Browserless service
 *    - Set BROWSER_WORKER_URL=https://your-browserless-instance.com
 * 
 * Security requirements:
 * - Must require explicit workspace enablement flag
 * - Must require approvals before execution
 * - Must store screenshots/logs in AuditLog
 * - Must never expose browser automation to unauthorized users
 */
