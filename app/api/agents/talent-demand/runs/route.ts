/**
 * Thread Runs Status API
 * Fetches the run status from LangSmith to detect TRUE completion
 *
 * The /runs endpoint provides reliable completion detection:
 * - status: "pending" - Not started
 * - status: "running" - Still working
 * - status: "success" - Truly complete
 * - status: "error" - Failed
 *
 * This is more reliable than checking tool balance or todos.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const AGENT_DEPLOYMENT_URL = process.env.LANGSMITH_AGENT_URL || 'https://prod-deepagents-agent-build-d4c1479ed8ce53fbb8c3eefc91f0aa7d.us.langgraph.app';

interface RunStatus {
  runId: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'unknown';
  createdAt?: string;
  updatedAt?: string;
}

interface RunsResponse {
  latestRun: RunStatus | null;
  allRuns: RunStatus[];
  success: boolean;
}

/**
 * POST /api/agents/talent-demand/runs
 * Get the run status for a thread to detect completion
 */
export async function POST(request: NextRequest) {
  try {
    // NOTE: Auth removed for standalone TDA - public access
    const body = await request.json();
    const { threadId } = body;

    if (!threadId || typeof threadId !== 'string') {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    console.log('[Runs API] Fetching run status for thread:', threadId);

    // Get API credentials
    const apiKey = process.env.LANGSMITH_API_KEY;

    if (!apiKey) {
      console.error('[Runs API] Missing LANGSMITH_API_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Call the /runs endpoint
    const runsUrl = `${AGENT_DEPLOYMENT_URL}/threads/${threadId}/runs`;
    console.log('[Runs API] Fetching from:', runsUrl);

    const response = await fetch(runsUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'X-Auth-Scheme': 'langsmith-api-key',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Runs API] Failed to fetch runs:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to retrieve runs: ${response.statusText}` },
        { status: response.status }
      );
    }

    const runsData = await response.json();

    console.log('[Runs API] Raw response type:', typeof runsData);
    console.log('[Runs API] Is array:', Array.isArray(runsData));

    // Parse runs - could be array or single object
    let runs: any[] = [];
    if (Array.isArray(runsData)) {
      runs = runsData;
    } else if (runsData && typeof runsData === 'object') {
      // Single run or wrapped response
      if (runsData.runs && Array.isArray(runsData.runs)) {
        runs = runsData.runs;
      } else if (runsData.run_id || runsData.status) {
        runs = [runsData];
      }
    }

    console.log('[Runs API] Parsed runs count:', runs.length);

    // Map to our status format
    const mappedRuns: RunStatus[] = runs.map((run: any) => ({
      runId: run.run_id || run.id || 'unknown',
      status: run.status || 'unknown',
      createdAt: run.created_at || run.createdAt,
      updatedAt: run.updated_at || run.updatedAt,
    }));

    // Get the latest run (first in array, usually sorted by newest)
    const latestRun = mappedRuns.length > 0 ? mappedRuns[0] : null;

    console.log('[Runs API] Latest run status:', latestRun?.status || 'none');

    return NextResponse.json({
      latestRun,
      allRuns: mappedRuns,
      success: true
    } as RunsResponse);

  } catch (error) {
    console.error('[Runs API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retrieve runs',
        success: false
      },
      { status: 500 }
    );
  }
}
