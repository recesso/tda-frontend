/**
 * Talent Demand Analyst Agent API Proxy
 * Securely connects to remote LangGraph deployment
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 1800; // 30 minutes for comprehensive analysis (reports take ~20 min)

// LangGraph Agent Deployment URL
const AGENT_DEPLOYMENT_URL = process.env.LANGSMITH_AGENT_URL || 'https://prod-deepagents-agent-build-d4c1479ed8ce53fbb8c3eefc91f0aa7d.us.langgraph.app';

/**
 * POST /api/agents/talent-demand
 * Stream requests to remote LangGraph deployment
 * NOTE: Auth removed for standalone TDA - public access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, threadId } = body;

    // PHASE 10: Allow empty messages for follow-up result retrieval
    // Empty message triggers LangSmith to return accumulated sub-agent results
    if (userMessage === undefined || userMessage === null || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'User message is required' },
        { status: 400 }
      );
    }

    if (!threadId || typeof threadId !== 'string') {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Talent Demand API] Processing message for thread ${threadId}`);

    // Get secret environment variables from server-side process.env
    const apiKey = process.env.LANGSMITH_API_KEY;
    const workspaceId = process.env.LANGSMITH_WORKSPACE_ID;

    if (!apiKey || !workspaceId) {
      console.error('[Talent Demand API] Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API credentials' },
        { status: 500 }
      );
    }

    // Deployment assistant ID
    const assistantId = process.env.LANGSMITH_ASSISTANT_ID || '50bd6c8e-2996-455b-83c1-3c815899a69b';

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1 FIX: Thread Reuse for Multi-Turn Conversations
    // ═══════════════════════════════════════════════════════════════

    /**
     * Validate if a string is a valid UUID (LangSmith thread ID format)
     * LangSmith uses standard UUIDs like: 042c522a-438c-45ff-ada4-82298f59229f
     */
    const isValidUUID = (id: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    let langGraphThreadId: string;

    if (threadId && isValidUUID(threadId)) {
      // REUSE existing LangSmith thread for multi-turn conversation
      langGraphThreadId = threadId;
      console.log(`[Talent Demand API] ♻️  REUSING existing thread: ${langGraphThreadId}`);
      console.log(`[Talent Demand API] Multi-turn conversation enabled`);
    } else {
      // CREATE new thread for first message
      console.log(`[Talent Demand API] 🆕 Creating new thread...`);
      console.log(`[Talent Demand API] URL: ${AGENT_DEPLOYMENT_URL}`);
      console.log(`[Talent Demand API] API Key starts with: ${apiKey?.substring(0, 20)}...`);

      const createThreadResponse = await fetch(`${AGENT_DEPLOYMENT_URL}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'X-Auth-Scheme': 'langsmith-api-key',
        },
        body: JSON.stringify({}),
      });

      if (!createThreadResponse.ok) {
        console.error('[Talent Demand API] Failed to create thread:', await createThreadResponse.text());
        return NextResponse.json(
          { error: 'Failed to create conversation thread' },
          { status: 500 }
        );
      }

      const thread = await createThreadResponse.json();
      langGraphThreadId = thread.thread_id;
      console.log(`[Talent Demand API] ✅ Created new LangSmith thread: ${langGraphThreadId}`);
    }

    // Construct LangGraph request - matches REST API format
    const langGraphBody = {
      assistant_id: assistantId,
      input: {
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      },
    };

    console.log(`[Talent Demand API] Forwarding to LangGraph: ${AGENT_DEPLOYMENT_URL}/threads/${langGraphThreadId}/runs/stream`);
    console.log(`[Talent Demand API] Request payload:`, JSON.stringify(langGraphBody, null, 2));
    console.log(`[Talent Demand API] Request headers: Content-Type=application/json, X-Api-Key=${apiKey?.substring(0, 30)}..., X-Auth-Scheme=langsmith-api-key`);

    // Make authenticated request to Agent Builder deployment
    // PHASE 6 FIX: Configure undici for long-lived streaming connections
    // @ts-ignore - undici Agent configuration
    const Agent = (await import('undici')).Agent;
    const customAgent = new Agent({
      keepAliveTimeout: 1800000, // 30 minutes
      keepAliveMaxTimeout: 1800000,
      headersTimeout: 1800000,
      bodyTimeout: 1800000,
      connectTimeout: 60000, // 1 minute for initial connection
    });

    const response = await fetch(`${AGENT_DEPLOYMENT_URL}/threads/${langGraphThreadId}/runs/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'X-Auth-Scheme': 'langsmith-api-key',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify(langGraphBody),
      // @ts-ignore - undici-specific options
      dispatcher: customAgent,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Talent Demand API] LangGraph error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `LangGraph request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Stream the response back to client
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { error: 'No response body from LangGraph' },
        { status: 500 }
      );
    }

    // Create streaming response with proper cleanup
    const stream = new ReadableStream({
      async start(controller) {
        let streamActive = true;

        const cleanup = () => {
          streamActive = false;
          try {
            reader.cancel();
          } catch (e) {
            // Ignore cancel errors
          }
          try {
            if (controller.desiredSize !== null) {
              controller.close();
            }
          } catch (e) {
            // Controller already closed
          }
        };

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log('[Talent Demand API] Client aborted request');
          cleanup();
        });

        try {
          const decoder = new TextDecoder();
          let chunkCount = 0;

          while (streamActive) {
            const { done, value } = await reader.read();
            if (done) {
              console.log(`[Talent Demand API] Stream complete - received ${chunkCount} chunks`);
              break;
            }

            chunkCount++;
            const text = decoder.decode(value, { stream: true });
            console.log(`[Talent Demand API] Chunk ${chunkCount}:`, text.substring(0, 200));

            controller.enqueue(value);
          }
          cleanup();
        } catch (error) {
          console.error('[Talent Demand API] Stream error:', error);
          cleanup();
          controller.error(error);
        }
      },

      cancel() {
        console.log('[Talent Demand API] Client disconnected - cancelling stream');
        try {
          reader.cancel();
        } catch (e) {
          // Ignore
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Thread-Id': langGraphThreadId, // ← PHASE 1: Return thread ID for multi-turn
      },
    });

  } catch (error) {
    console.error('[Talent Demand API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Agent proxy failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/talent-demand
 * Returns agent configuration
 */
export async function GET() {
  return NextResponse.json({
    name: 'Talent Demand Analyst',
    description: 'AI-powered analysis of talent demand trends, workforce planning, and skills requirements',
    version: '1.0.0',
    framework: 'LangGraph (Remote Deployment)',
    deployment: {
      url: AGENT_DEPLOYMENT_URL,
      type: 'streaming',
    },
    capabilities: [
      'Real-time talent demand analysis',
      'Workforce trend identification',
      'Skills gap assessment',
      'Labor market insights',
      'Conversational interaction',
    ],
  });
}
