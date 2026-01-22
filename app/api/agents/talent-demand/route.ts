/**
 * Talent Demand Analyst Agent API Proxy
 * Securely connects to remote LangGraph deployment
 *
 * FIX (Jan 2026): After Agent Builder GA, API is intermittent.
 * Solution: Retry logic with exponential backoff + fallback to GitHub deployment.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 1800; // 30 minutes for comprehensive analysis

// Primary: Agent Builder deployment (full multi-agent system)
const AGENT_BUILDER_URL = 'https://prod-deepagents-agent-build-d4c1479ed8ce53fbb8c3eefc91f0aa7d.us.langgraph.app';
const AGENT_BUILDER_ASSISTANT_ID = '50bd6c8e-2996-455b-83c1-3c815899a69b';

// Fallback: GitHub deployment (simpler but stable)
const GITHUB_URL = 'https://sbttalentdemandanalyst-b289aed6f80c5d64b7d3088a7a9830ff.us.langgraph.app';
const GITHUB_ASSISTANT_ID = 'fe096781-5601-53d2-b2f6-0d3403f7e9ca';

/**
 * Retry a fetch request with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If successful or client error (4xx except 403), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 403)) {
        return response;
      }

      // For 403 Forbidden, retry (LangSmith intermittent issue)
      if (response.status === 403) {
        console.log(`[Talent Demand API] Attempt ${attempt + 1}/${maxRetries} got 403, retrying...`);
        lastError = new Error(`403 Forbidden`);

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[Talent Demand API] Attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * POST /api/agents/talent-demand
 * Proxy requests with retry logic and fallback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, threadId } = body;

    if (userMessage === undefined || userMessage === null || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'User message is required' },
        { status: 400 }
      );
    }

    console.log(`[Talent Demand API] Processing message for thread ${threadId || 'new'}`);

    const apiKey = process.env.LANGSMITH_API_KEY;
    // Use HOST tenant ID, not workspace ID - this is required for Agent Builder GA (Jan 2026)
    const tenantId = process.env.LANGSMITH_TENANT_ID;

    if (!apiKey || !tenantId) {
      console.error('[Talent Demand API] Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API credentials' },
        { status: 500 }
      );
    }

    // Try Agent Builder first (full multi-agent system)
    console.log(`[Talent Demand API] Trying Agent Builder deployment...`);

    const agentBuilderBody = {
      assistant_id: AGENT_BUILDER_ASSISTANT_ID,
      input: {
        messages: [{ role: 'user', content: userMessage }],
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'X-Auth-Scheme': 'langsmith-api-key',
      'X-Tenant-Id': tenantId,
    };

    let response: Response | null = null;
    let usedFallback = false;

    try {
      response = await fetchWithRetry(
        `${AGENT_BUILDER_URL}/runs/wait`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(agentBuilderBody),
        },
        3, // 3 retries
        2000 // 2 second base delay
      );

      if (!response.ok) {
        throw new Error(`Agent Builder returned ${response.status}`);
      }
    } catch (agentBuilderError) {
      console.log(`[Talent Demand API] Agent Builder failed, trying GitHub fallback...`);
      usedFallback = true;

      // Fallback to GitHub deployment
      try {
        // First create a thread on GitHub
        const threadResponse = await fetch(`${GITHUB_URL}/threads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'X-Auth-Scheme': 'langsmith-api-key',
          },
          body: JSON.stringify({}),
        });

        if (!threadResponse.ok) {
          throw new Error(`GitHub thread creation failed: ${threadResponse.status}`);
        }

        const thread = await threadResponse.json();
        console.log(`[Talent Demand API] GitHub thread created: ${thread.thread_id}`);

        // Run on GitHub deployment with streaming
        response = await fetch(`${GITHUB_URL}/threads/${thread.thread_id}/runs/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'X-Auth-Scheme': 'langsmith-api-key',
          },
          body: JSON.stringify({
            assistant_id: GITHUB_ASSISTANT_ID,
            input: {
              messages: [{ role: 'user', content: userMessage }],
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`GitHub run failed: ${response.status} - ${errorText}`);
        }

        // GitHub returns streaming, pass it through directly
        return new NextResponse(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Thread-Id': thread.thread_id,
            'X-Fallback-Mode': 'github',
          },
        });
      } catch (githubError) {
        console.error('[Talent Demand API] Both deployments failed:', githubError);
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again in a moment.' },
          { status: 503 }
        );
      }
    }

    // Agent Builder succeeded - process response
    const result = await response.json();
    console.log(`[Talent Demand API] Agent Builder responded with ${result.messages?.length || 0} messages`);

    // Convert to SSE format for frontend compatibility
    const messages = result.messages || [];
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const metadataEvent = `event: metadata\ndata: ${JSON.stringify({ run_id: 'agent-builder' })}\n\n`;
        controller.enqueue(encoder.encode(metadataEvent));

        for (const msg of messages) {
          const valuesEvent = `event: values\ndata: ${JSON.stringify({ messages: [msg], tools: result.tools || [] })}\n\n`;
          controller.enqueue(encoder.encode(valuesEvent));
        }

        const endEvent = `event: end\ndata: {}\n\n`;
        controller.enqueue(encoder.encode(endEvent));
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Thread-Id': 'agent-builder-mode',
        'X-Fallback-Mode': usedFallback ? 'github' : 'agent-builder',
      },
    });

  } catch (error) {
    console.error('[Talent Demand API] Error:', error);
    return NextResponse.json(
      {
        error: 'Service temporarily unavailable. Please try again.',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

/**
 * GET /api/agents/talent-demand
 */
export async function GET() {
  return NextResponse.json({
    name: 'Talent Demand Analyst',
    description: 'AI-powered analysis of talent demand trends',
    version: '1.0.1',
    status: 'operational',
  });
}
