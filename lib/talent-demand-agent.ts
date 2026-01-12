/**
 * Client-side utility for Talent Demand Analyst agent
 * Streams responses from the remote LangGraph deployment via API proxy
 */

// PHASE 4.2: Content block types from LangSmith
export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | string;
  text?: string;
  id?: string;
  name?: string;
  input?: any;
  content?: any;
  [key: string]: any;
}

export interface StreamChunk {
  type: 'message' | 'tool_use' | 'tool_result' | 'error' | 'end';
  content?: string;
  contentBlocks?: ContentBlock[]; // ← PHASE 4.2: Full structured content
  toolName?: string; // ← PHASE 4.2: For tool_use events
  toolInput?: any; // ← PHASE 4.2: Tool parameters
  toolResult?: any; // ← PHASE 4.3: Tool result data
  toolCallId?: string; // ← PHASE 4.3: Tool call identifier
  error?: string;
  threadId?: string;
}

/**
 * Stream agent response from the Talent Demand Analyst
 *
 * @param userInput - The user's message/question
 * @param threadId - Thread ID for conversation continuity
 * @param onChunk - Callback function to handle each stream chunk
 * @param seenMessageIds - Optional Set to track message IDs across requests (for deduplication)
 * @returns Promise that resolves when stream is complete
 */
export async function streamAgentResponse(
  userInput: string,
  threadId: string,
  onChunk: (chunk: StreamChunk) => void,
  seenMessageIds?: Set<string>
): Promise<void> {
  // ═══════════════════════════════════════════════════════════════
  // PHASE 0 DIAGNOSTIC: Comprehensive logging to understand SSE format
  // ═══════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════');
  console.log('[DIAGNOSTIC] Stream Started');
  console.log('[DIAGNOSTIC] User Input:', userInput);
  console.log('[DIAGNOSTIC] Thread ID:', threadId);
  console.log('═══════════════════════════════════════════════════════');

  try {
    // PHASE 6: Extended timeout for long-running queries (60 minutes - multi-file generation can take 20+ min)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3600000); // 60 minutes

    const response = await fetch('/api/agents/talent-demand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: userInput,
        threadId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[DIAGNOSTIC] Response Status:', response.status);
    console.log('[DIAGNOSTIC] Response Headers:', Object.fromEntries(response.headers.entries()));

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Extract thread ID from response header
    // ═══════════════════════════════════════════════════════════════
    const returnedThreadId = response.headers.get('X-Thread-Id');
    if (returnedThreadId) {
      console.log('[PHASE 2] ✅ Backend returned thread ID:', returnedThreadId);
      console.log('[PHASE 2] Multi-turn conversation ready');
    } else {
      console.warn('[PHASE 2] ⚠️ No thread ID in response headers');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('[DIAGNOSTIC] HTTP Error:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let eventCount = 0;
    let currentEventType = '';

    // ═══════════════════════════════════════════════════════════════
    // PHASE 5.4: COMPREHENSIVE METRICS TRACKING
    // Track all stream events for diagnostic analysis
    // ═══════════════════════════════════════════════════════════════
    const metrics = {
      startTime: Date.now(),
      totalEvents: 0,
      aiMessages: 0,
      toolUseMessages: 0,
      toolResultMessages: 0,
      humanMessages: 0,
      errorMessages: 0,
      uniqueMessageIds: new Set<string>(),
      toolInvocations: [] as Array<{ name: string; subagent: string; time: number }>,
      artifacts: [] as Array<{ fileName: string; size: number; time: number }>,
      eventTypes: {} as Record<string, number>,
    };

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3.7 FIX: Use passed-in Set or create new one for single-request deduplication
    // If seenMessageIds is passed, it persists across requests (multi-turn conversation)
    // If not passed, create new Set for single-request deduplication only
    // ═══════════════════════════════════════════════════════════════
    const messageIdTracker = seenMessageIds || new Set<string>();

    // PHASE 8: DEEP DEBUGGING - Track chunk reception
    let chunkNumber = 0;
    let lastChunkTime = Date.now();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        const duration = Date.now() - metrics.startTime;
        console.log('═══════════════════════════════════════════════════════');
        console.log('[PHASE 5.4 METRICS] Stream Completed Successfully');
        console.log('[PHASE 5.4] Duration:', (duration / 1000).toFixed(2), 'seconds');
        console.log('[PHASE 5.4] Total Events:', metrics.totalEvents);
        console.log('[PHASE 5.4] AI Messages:', metrics.aiMessages);
        console.log('[PHASE 5.4] Tool Use Messages:', metrics.toolUseMessages);
        console.log('[PHASE 5.4] Tool Result Messages:', metrics.toolResultMessages);
        console.log('[PHASE 5.4] Unique Message IDs:', metrics.uniqueMessageIds.size);
        console.log('[PHASE 5.4] Tool Invocations:', metrics.toolInvocations.length);
        console.log('[PHASE 5.4] Artifacts Created:', metrics.artifacts.length);
        console.log('[PHASE 5.4] Event Type Distribution:');
        Object.entries(metrics.eventTypes).forEach(([type, count]) => {
          console.log(`  - ${type}: ${count}`);
        });
        if (metrics.toolInvocations.length > 0) {
          console.log('[PHASE 5.4] Tool Invocation Details:');
          metrics.toolInvocations.forEach((tool, i) => {
            console.log(`  ${i + 1}. ${tool.subagent} (${tool.name}) at ${((tool.time - metrics.startTime) / 1000).toFixed(1)}s`);
          });
        }
        if (metrics.artifacts.length > 0) {
          console.log('[PHASE 5.4] Artifact Details:');
          metrics.artifacts.forEach((artifact, i) => {
            console.log(`  ${i + 1}. ${artifact.fileName} (${(artifact.size / 1024).toFixed(1)} KB) at ${((artifact.time - metrics.startTime) / 1000).toFixed(1)}s`);
          });
        }
        console.log('═══════════════════════════════════════════════════════');

        // ═══════════════════════════════════════════════════════════════
        // PHASE 11.5: DIAGNOSTIC - Final extraction summary
        // Shows what was extracted vs what was skipped/missed
        // ═══════════════════════════════════════════════════════════════
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('[PHASE 11.5 DIAGNOSTIC] STREAM PROCESSING COMPLETE');
        console.log('╠═══════════════════════════════════════════════════════════╣');
        console.log('[PHASE 11.5] Total Events Received:', metrics.totalEvents);
        console.log('[PHASE 11.5] Unique Message IDs:', metrics.uniqueMessageIds.size);
        console.log('[PHASE 11.5] AI Messages Processed:', metrics.aiMessages);
        console.log('[PHASE 11.5] Human Messages Skipped:', metrics.humanMessages);
        console.log('[PHASE 11.5] Tool Use Messages:', metrics.toolUseMessages);
        console.log('[PHASE 11.5] Tool Result Messages:', metrics.toolResultMessages);
        console.log('[PHASE 11.5] Extraction Ratio:',
          `${((metrics.aiMessages / Math.max(metrics.totalEvents, 1)) * 100).toFixed(1)}% of events extracted`);
        console.log('╚═══════════════════════════════════════════════════════════╝');

        // ═══════════════════════════════════════════════════════════════
        // THREAD STATE RETRIEVAL: Fetch complete results after stream ends
        // LangSmith Architecture:
        // - SSE Stream: Real-time status, tool launches, AI thinking
        // - Thread State API: Complete results including tool outputs
        // ═══════════════════════════════════════════════════════════════
        // REVISED: Fetch state if we have a threadId AND either:
        // 1. Tools were detected in the stream, OR
        // 2. Stream had zero meaningful events (agent may have worked but not streamed)
        const streamWasEmpty = metrics.totalEvents === 0;
        const needsThreadState = returnedThreadId && (metrics.toolInvocations.length > 0 || streamWasEmpty);

        if (needsThreadState) {
          console.log('═══════════════════════════════════════════════════════');
          console.log('[Thread State] 🔄 RETRIEVING COMPLETE RESULTS');
          if (streamWasEmpty) {
            console.log('[Thread State] Reason: Stream was empty (0 events) - checking for un-streamed work');
          } else {
            console.log('[Thread State] Reason: Tool invocations detected, fetching outputs');
          }
          console.log('[Thread State] Tool count:', metrics.toolInvocations.length);
          console.log('[Thread State] Thread ID:', returnedThreadId);
          console.log('═══════════════════════════════════════════════════════');

          try {
            // Fetch complete thread state with tool outputs and files
            const stateResponse = await fetch('/api/agents/talent-demand/state', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ threadId: returnedThreadId }),
            });

            if (stateResponse.ok) {
              const { toolOutputs, files, messageCount } = await stateResponse.json();

              console.log('[Thread State] ✅ Retrieved complete state:');
              console.log('[Thread State] Messages:', messageCount);
              console.log('[Thread State] Tool Outputs:', toolOutputs?.length || 0);
              console.log('[Thread State] Files:', files?.length || 0);

              // Send tool outputs as tool_result chunks
              if (toolOutputs && toolOutputs.length > 0) {
                for (const output of toolOutputs) {
                  console.log('[Thread State] 📊 Sending tool output:', {
                    toolName: output.toolName,
                    contentLength: typeof output.output === 'string'
                      ? output.output.length
                      : JSON.stringify(output.output).length
                  });

                  onChunk({
                    type: 'tool_result',
                    toolCallId: output.toolUseId,
                    toolResult: output.output,
                    contentBlocks: [{
                      type: 'tool_result',
                      tool_use_id: output.toolUseId,
                      content: output.output
                    }]
                  });
                }
              }

              // Send file artifacts as tool_use chunks (for artifact download UI)
              if (files && files.length > 0) {
                for (const file of files) {
                  console.log('[Thread State] 📄 Sending file artifact:', {
                    fileName: file.fileName,
                    contentLength: file.content.length
                  });

                  onChunk({
                    type: 'tool_use',
                    toolName: 'write_file',
                    toolInput: {
                      file_path: file.filePath,
                      content: file.content,
                      subagent_type: 'write_file'
                    },
                    contentBlocks: [{
                      type: 'tool_use',
                      id: file.toolUseId,
                      name: 'write_file',
                      input: {
                        file_path: file.filePath,
                        content: file.content
                      }
                    }]
                  });
                }
              }

              console.log('[Thread State] ✅ All results dispatched to UI');
            } else {
              const errorText = await stateResponse.text();
              console.error('[Thread State] ❌ Failed to retrieve state:', stateResponse.status, errorText);

              onChunk({
                type: 'message',
                content: '\n\n⚠️ *Note: Tool outputs could not be retrieved. Please try again.*\n'
              });
            }
          } catch (error) {
            console.error('[Thread State] ❌ Error fetching state:', error);

            onChunk({
              type: 'message',
              content: '\n\n⚠️ *Note: An error occurred while retrieving complete results.*\n'
            });
          }
        } else if (!returnedThreadId && (metrics.toolInvocations.length > 0 || streamWasEmpty)) {
          console.warn('[Thread State] ⚠️  Cannot retrieve state: No thread ID available');
        } else {
          console.log('[Thread State] ℹ️  No state retrieval needed (no thread ID and stream had events)');
        }

        // PHASE 2: Return thread ID on stream end
        onChunk({
          type: 'end',
          threadId: returnedThreadId || undefined,
        });
        break;
      }

      // PHASE 8: LOG EVERY CHUNK RECEIVED
      chunkNumber++;
      const now = Date.now();
      const timeSinceLastChunk = now - lastChunkTime;
      lastChunkTime = now;

      const text = decoder.decode(value, { stream: true });

      // PHASE 8: DEEP DEBUGGING - Log raw chunk data
      console.log('═══════════════════════════════════════════════════════');
      console.log(`[PHASE 8 CHUNK ${chunkNumber}] Received after ${timeSinceLastChunk}ms`);
      console.log(`[PHASE 8] Byte size: ${value.byteLength}`);
      console.log(`[PHASE 8] Text length: ${text.length}`);
      console.log(`[PHASE 8] Contains "data:": ${text.includes('data:')}`);
      console.log(`[PHASE 8] Contains "event:": ${text.includes('event:')}`);
      console.log(`[PHASE 8] Contains "heartbeat": ${text.includes('heartbeat')}`);
      console.log(`[PHASE 8] Line count: ${text.split('\n').length}`);
      console.log(`[PHASE 8] First 500 chars:`, text.substring(0, 500));
      if (text.length > 500) {
        console.log(`[PHASE 8] Last 200 chars:`, text.substring(text.length - 200));
      }
      console.log('═══════════════════════════════════════════════════════');

      buffer += text;

      // Process complete lines from the buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();

        // ═══════════════════════════════════════════════════════════════
        // LOG EVERY RAW LINE (this is critical for understanding format)
        // ═══════════════════════════════════════════════════════════════
        if (trimmed) {
          console.log('[RAW LINE]', trimmed);
        }

        // Track event type
        if (trimmed.startsWith('event:')) {
          currentEventType = trimmed.slice(6).trim();
          console.log('[EVENT TYPE]', currentEventType);

          // PHASE 5.4: Track event type distribution
          metrics.eventTypes[currentEventType] = (metrics.eventTypes[currentEventType] || 0) + 1;

          // PHASE 4.1: Track ALL event types (not just 'values')
          if (currentEventType !== 'values') {
            console.log('[PHASE 4.1] 🔔 NON-VALUES EVENT DETECTED:', currentEventType);
          }
          continue;
        }

        if (!trimmed) continue;

        // Handle different LangGraph stream event formats
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            eventCount++;
            metrics.totalEvents++;

            // ═══════════════════════════════════════════════════════════════
            // PHASE 11.0: DIAGNOSTIC - Log EVERY event with full structure
            // This allows comparison with backend logs to see what's being received
            // ═══════════════════════════════════════════════════════════════
            console.log('╔═══════════════════════════════════════════════════════════╗');
            console.log(`[PHASE 11.0 DIAGNOSTIC] FRONTEND RECEIVED EVENT #${eventCount}`);
            console.log('╠═══════════════════════════════════════════════════════════╣');
            console.log(`[PHASE 11.0] Event Type: ${currentEventType || 'unknown'}`);
            console.log('[PHASE 11.0] Data Type:', typeof data);
            console.log('[PHASE 11.0] Is Array:', Array.isArray(data));
            console.log('[PHASE 11.0] Data Keys:', Array.isArray(data) ? `[array length ${data.length}]` : Object.keys(data));
            console.log('[PHASE 11.0] Full Data (truncated to 500 chars):', JSON.stringify(data).substring(0, 500));
            console.log('╚═══════════════════════════════════════════════════════════╝');

            // ═══════════════════════════════════════════════════════════════
            // PHASE 3: FIXED EXTRACTION LOGIC - Only extract AI messages
            // ═══════════════════════════════════════════════════════════════

            // Check for error events
            if (data.error) {
              console.error('[DIAGNOSTIC] Error event detected:', data);
              onChunk({ type: 'error', error: data.message || data.error });
              continue;
            }

            // PHASE 3: Extract ONLY AI-generated messages (ignore user messages and agent_memory)
            let contentExtracted = false;

            // ═══════════════════════════════════════════════════════════════
            // PHASE 11: FORMAT-AGNOSTIC MESSAGE PARSER
            // Handle both wrapped and unwrapped message formats from LangSmith:
            // 1. Initial/thread requests: { messages: [{...}] }
            // 2. Streaming chunks: [{...}] (array directly)
            // ═══════════════════════════════════════════════════════════════
            let messagesToProcess: any[] = [];

            if (data.messages && Array.isArray(data.messages)) {
              // Format 1: Wrapped in messages property
              messagesToProcess = data.messages;
              console.log('[PHASE 11] Found wrapped messages array with', data.messages.length, 'items');
            } else if (Array.isArray(data)) {
              // Format 2: Direct array of message chunks
              messagesToProcess = data;
              console.log('[PHASE 11] Found direct message array with', data.length, 'items');
            } else {
              console.log('[PHASE 11] Unrecognized data format:', typeof data);
            }

            if (messagesToProcess.length > 0) {
              for (const msg of messagesToProcess) {
                // ═══════════════════════════════════════════════════════════════
                // PHASE 11.1: DIAGNOSTIC - Log ALL messages before filtering
                // Captures EVERY message type LangSmith sends to identify what we're missing
                // ═══════════════════════════════════════════════════════════════
                console.log('╔═══════════════════════════════════════════════════════════╗');
                console.log('[PHASE 11.1 DIAGNOSTIC] INCOMING MESSAGE (BEFORE FILTER)');
                console.log('╠═══════════════════════════════════════════════════════════╣');
                console.log('[PHASE 11.1] Message Type:', msg.type || 'UNDEFINED');
                console.log('[PHASE 11.1] Message ID:', msg.id || 'NO ID');
                console.log('[PHASE 11.1] Has Content:', !!msg.content);
                console.log('[PHASE 11.1] Content Type:', typeof msg.content);
                console.log('[PHASE 11.1] Is Array:', Array.isArray(msg.content));
                console.log('[PHASE 11.1] Content Length:',
                  Array.isArray(msg.content) ? msg.content.length :
                  typeof msg.content === 'string' ? msg.content.length : 'N/A'
                );

                // Show content preview based on type
                if (typeof msg.content === 'string') {
                  console.log('[PHASE 11.1] String Preview:', msg.content.substring(0, 200));
                } else if (Array.isArray(msg.content)) {
                  console.log('[PHASE 11.1] Array Block Types:', msg.content.map((b: any) => b.type || 'unknown'));
                  console.log('[PHASE 11.1] Array Block Count:', msg.content.length);

                  // Show first block detail
                  if (msg.content.length > 0) {
                    const firstBlock = msg.content[0];
                    console.log('[PHASE 11.1] First Block Detail:', {
                      type: firstBlock.type,
                      hasText: !!firstBlock.text,
                      hasContent: !!firstBlock.content,
                      hasName: !!firstBlock.name,
                      hasId: !!firstBlock.id,
                      keys: Object.keys(firstBlock)
                    });
                  }
                } else if (msg.content) {
                  console.log('[PHASE 11.1] Object Keys:', Object.keys(msg.content));
                }

                // Check for other important fields
                console.log('[PHASE 11.1] Other Fields:', {
                  hasName: !!msg.name,
                  hasStatus: !!msg.status,
                  hasRole: !!msg.role,
                  hasToolUseId: !!msg.tool_use_id,
                  allKeys: Object.keys(msg)
                });
                console.log('╚═══════════════════════════════════════════════════════════╝');

                // ═══════════════════════════════════════════════════════════════
                // CRITICAL FIX: Only extract NEW AI messages (not from history)
                // 1. Must have type === "ai" (not user messages)
                // 2. Must have an ID we haven't seen before (not from conversation history)
                // This prevents both user message repetition AND historical AI message repetition
                // ═══════════════════════════════════════════════════════════════
                if (msg.type === 'ai' && msg.content && msg.id) {
                  // PHASE 5.4: Track unique message IDs
                  metrics.uniqueMessageIds.add(msg.id);
                  metrics.aiMessages++;

                  // Check if we've already displayed this message
                  if (messageIdTracker.has(msg.id)) {
                    console.log('[PHASE 3.7] ⏭️  Skipping AI message (already displayed):', msg.id);
                  } else {
                    // ═══════════════════════════════════════════════════════════════
                    // PHASE 4.1: ENHANCED DIAGNOSTIC - Capture FULL content structure
                    // This shows us EVERYTHING LangSmith sends (before filtering)
                    // ═══════════════════════════════════════════════════════════════
                    if (Array.isArray(msg.content)) {
                      console.log('[PHASE 4.1] 📦 FULL CONTENT STRUCTURE (BEFORE FILTERING):');
                      console.log('[PHASE 4.1] Content blocks:', JSON.stringify(msg.content, null, 2));
                      console.log('[PHASE 4.1] Block types present:', msg.content.map((b: any) => b.type));
                      console.log('[PHASE 4.1] Total blocks:', msg.content.length);

                      // Count each block type
                      const blockTypeCounts: Record<string, number> = {};
                      msg.content.forEach((block: any) => {
                        const type = block.type || 'unknown';
                        blockTypeCounts[type] = (blockTypeCounts[type] || 0) + 1;
                      });
                      console.log('[PHASE 4.1] Block type distribution:', blockTypeCounts);
                    }

                    // ═══════════════════════════════════════════════════════════════
                    // PHASE 4.2: Parse ALL content blocks (not just text)
                    // ═══════════════════════════════════════════════════════════════
                    if (typeof msg.content === 'string') {
                      // Simple string content
                      const preview = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '');
                      console.log('[PHASE 4.2] ✅ Extracting string message:', msg.id, '→', preview);

                      // ═══════════════════════════════════════════════════════════════
                      // PHASE 11.4: DIAGNOSTIC - Log AI string content extraction
                      // ═══════════════════════════════════════════════════════════════
                      console.log('[PHASE 11.4 DIAGNOSTIC] AI STRING CONTENT BEING EXTRACTED:');
                      console.log('[PHASE 11.4] Full text length:', msg.content.length);
                      console.log('[PHASE 11.4] Has newlines:', msg.content.includes('\n'));
                      console.log('[PHASE 11.4] Has markdown bullets (-):', msg.content.includes('- '));
                      console.log('[PHASE 11.4] Has markdown bullets (*):', msg.content.includes('* '));
                      console.log('[PHASE 11.4] Has markdown headers (#):', msg.content.includes('# '));
                      console.log('[PHASE 11.4] First 300 chars:', msg.content.substring(0, 300));

                      messageIdTracker.add(msg.id);
                      onChunk({ type: 'message', content: msg.content });
                      contentExtracted = true;
                    } else if (Array.isArray(msg.content)) {
                      // Structured content with multiple blocks
                      console.log('[PHASE 4.2] 📦 Processing', msg.content.length, 'content blocks');

                      // Process each block in order
                      for (const block of msg.content) {
                        // ═══════════════════════════════════════════════════════════════
                        // PHASE 11.2: DIAGNOSTIC - Log EACH content block before processing
                        // ═══════════════════════════════════════════════════════════════
                        console.log('┌───────────────────────────────────────────────────────┐');
                        console.log('[PHASE 11.2 DIAGNOSTIC] CONTENT BLOCK (BEFORE PROCESS)');
                        console.log('├───────────────────────────────────────────────────────┤');
                        console.log('[PHASE 11.2] Block Type:', block.type || 'UNDEFINED');
                        console.log('[PHASE 11.2] Has Text:', !!block.text);
                        console.log('[PHASE 11.2] Has Content:', !!block.content);
                        console.log('[PHASE 11.2] Has Name:', !!block.name);
                        console.log('[PHASE 11.2] Has ID:', !!block.id);
                        console.log('[PHASE 11.2] Has Tool Use ID:', !!block.tool_use_id);
                        console.log('[PHASE 11.2] All Keys:', Object.keys(block));

                        // Log content preview based on what's available
                        if (block.text) {
                          console.log('[PHASE 11.2] Text Length:', block.text.length);
                          console.log('[PHASE 11.2] Text Preview:', block.text.substring(0, 150));
                        }
                        if (block.content) {
                          const contentType = typeof block.content;
                          console.log('[PHASE 11.2] Content Type:', contentType);
                          if (contentType === 'string') {
                            console.log('[PHASE 11.2] Content Length:', block.content.length);
                            console.log('[PHASE 11.2] Content Preview:', block.content.substring(0, 150));
                          } else if (Array.isArray(block.content)) {
                            console.log('[PHASE 11.2] Content Array Length:', block.content.length);
                          } else {
                            console.log('[PHASE 11.2] Content Keys:', Object.keys(block.content));
                          }
                        }
                        if (block.name) {
                          console.log('[PHASE 11.2] Tool Name:', block.name);
                        }
                        console.log('└───────────────────────────────────────────────────────┘');

                        if (block.type === 'text' && block.text) {
                          // Text block - display as message
                          const preview = block.text.substring(0, 100) + (block.text.length > 100 ? '...' : '');
                          console.log('[PHASE 4.2] ✅ Extracting text block:', preview);

                          // ═══════════════════════════════════════════════════════════════
                          // PHASE 11.4: DIAGNOSTIC - Log EXACT content being sent to onChunk
                          // This shows if formatting is preserved during extraction
                          // ═══════════════════════════════════════════════════════════════
                          console.log('[PHASE 11.4 DIAGNOSTIC] TEXT CONTENT BEING EXTRACTED:');
                          console.log('[PHASE 11.4] Full text length:', block.text.length);
                          console.log('[PHASE 11.4] Has newlines:', block.text.includes('\n'));
                          console.log('[PHASE 11.4] Has markdown bullets (-):', block.text.includes('- '));
                          console.log('[PHASE 11.4] Has markdown bullets (*):', block.text.includes('* '));
                          console.log('[PHASE 11.4] Has markdown headers (#):', block.text.includes('# '));
                          console.log('[PHASE 11.4] Is cancellation message:', block.text.includes('was cancelled'));
                          console.log('[PHASE 11.4] Is tool call message:', block.text.includes('Tool call task'));
                          console.log('[PHASE 11.4] First 300 chars:', block.text.substring(0, 300));

                          onChunk({ type: 'message', content: block.text });
                          contentExtracted = true;
                        } else if (block.type === 'tool_use') {
                          // Tool invocation block - display as tool use
                          console.log('[PHASE 4.2] 🔧 Extracting tool_use:', block.name);

                          // PHASE 5.4: Track tool invocations
                          metrics.toolUseMessages++;
                          metrics.toolInvocations.push({
                            name: block.name,
                            subagent: block.input?.subagent_type || 'unknown',
                            time: Date.now()
                          });

                          onChunk({
                            type: 'tool_use',
                            toolName: block.name,
                            toolInput: block.input,
                            contentBlocks: [block]
                          });
                          contentExtracted = true;
                        } else if (block.type === 'tool_result') {
                          // PHASE 4.3: Tool result block - display results from tool execution
                          console.log('[PHASE 4.3] 📊 Extracting tool_result');

                          // PHASE 5.4: Track tool results
                          metrics.toolResultMessages++;

                          onChunk({
                            type: 'tool_result',
                            toolCallId: block.tool_use_id || block.id,
                            toolResult: block.content,
                            contentBlocks: [block]
                          });
                          contentExtracted = true;
                        } else {
                          // ═══════════════════════════════════════════════════════════════
                          // PHASE 11.7: DIAGNOSTIC - Detect files/attachments in unknown blocks
                          // LangSmith may send file data in unknown block types that we're missing
                          // ═══════════════════════════════════════════════════════════════
                          console.log('╔═══════════════════════════════════════════════════════════╗');
                          console.log('[PHASE 11.7 DIAGNOSTIC] UNKNOWN BLOCK TYPE - POTENTIAL FILE?');
                          console.log('╠═══════════════════════════════════════════════════════════╣');
                          console.log('[PHASE 11.7] Block Type:', block.type || 'UNDEFINED');
                          console.log('[PHASE 11.7] All Keys:', Object.keys(block));

                          // Check for file/attachment indicators
                          const possibleFileFields = ['url', 'file', 'filename', 'data', 'content_type', 'mime_type',
                                                       'download', 'attachment', 'artifact', 'binary', 'base64'];
                          const foundFileFields = possibleFileFields.filter(field => block[field] !== undefined);

                          if (foundFileFields.length > 0) {
                            console.log('[PHASE 11.7] ⚠️  POSSIBLE FILE/ATTACHMENT DETECTED!');
                            console.log('[PHASE 11.7] File-related fields found:', foundFileFields);
                            foundFileFields.forEach(field => {
                              const value = block[field];
                              const valueType = typeof value;
                              const valuePreview = valueType === 'string' ? value.substring(0, 100) : JSON.stringify(value).substring(0, 100);
                              console.log(`[PHASE 11.7] ${field} (${valueType}):`, valuePreview);
                            });
                          } else {
                            console.log('[PHASE 11.7] No obvious file fields detected');
                          }

                          console.log('[PHASE 11.7] Full block:', JSON.stringify(block, null, 2));
                          console.log('╚═══════════════════════════════════════════════════════════╝');
                        }
                      }

                      messageIdTracker.add(msg.id);
                    }

                    if (!contentExtracted) {
                      console.log('[PHASE 4.2] ⏭️  No extractable content in message:', msg.id);
                    }
                  }
                } else if (msg.type === 'human') {
                  metrics.humanMessages++;
                  console.log('┌───────────────────────────────────────────────────────┐');
                  console.log('[PHASE 11.3 DIAGNOSTIC] SKIPPED - HUMAN MESSAGE');
                  console.log('[PHASE 11.3] Message ID:', msg.id);
                  console.log('[PHASE 11.3] Reason: User messages already displayed in UI');
                  console.log('└───────────────────────────────────────────────────────┘');
                } else if (msg.type === 'tool') {
                  // ═══════════════════════════════════════════════════════════════
                  // PHASE 5.3: ENHANCED TOOL RESULT MONITORING
                  // Track tool message flow to understand if results are streaming
                  // ═══════════════════════════════════════════════════════════════
                  console.log('═══════════════════════════════════════════════════════');
                  console.log('[PHASE 5.3 TOOL MESSAGE] Processing tool message');
                  console.log('[PHASE 5.3] Message ID:', msg.id);
                  console.log('[PHASE 5.3] Message Type:', msg.type);
                  console.log('[PHASE 5.3] Has content:', !!msg.content);
                  console.log('[PHASE 5.3] Content type:', typeof msg.content);
                  console.log('[PHASE 5.3] Is array:', Array.isArray(msg.content));

                  if (Array.isArray(msg.content)) {
                    console.log('[PHASE 5.3] Block count:', msg.content.length);
                    msg.content.forEach((block: any, i: number) => {
                      console.log(`[PHASE 5.3] Block ${i}:`, {
                        type: block.type,
                        hasToolUseId: !!block.tool_use_id,
                        hasId: !!block.id,
                        hasContent: !!block.content,
                        contentType: typeof block.content,
                        contentLength: typeof block.content === 'string'
                          ? block.content.length
                          : JSON.stringify(block.content || {}).length,
                        contentPreview: typeof block.content === 'string'
                          ? block.content.substring(0, 100)
                          : JSON.stringify(block.content).substring(0, 100)
                      });
                    });

                    for (const block of msg.content) {
                      if (block.type === 'tool_result') {
                        console.log('[PHASE 5.3] ✅ TOOL RESULT FOUND!');
                        console.log('[PHASE 5.3] Tool Use ID:', block.tool_use_id || block.id);
                        console.log('[PHASE 5.3] Result Type:', typeof block.content);
                        console.log('[PHASE 5.3] Result Length:',
                          typeof block.content === 'string'
                            ? block.content.length
                            : JSON.stringify(block.content).length
                        );
                        onChunk({
                          type: 'tool_result',
                          toolCallId: block.tool_use_id || block.id,
                          toolResult: block.content,
                          contentBlocks: [block]
                        });
                      } else {
                        console.log('[PHASE 5.3] Block type is:', block.type, '(not tool_result)');
                      }
                    }
                  } else {
                    // ═══════════════════════════════════════════════════════════════
                    // PHASE 11.6: FIX + DIAGNOSTIC - Extract tool message STRING content to UI
                    // Tool messages contain sub-agent research findings that MUST be displayed
                    // ═══════════════════════════════════════════════════════════════
                    console.log('╔═══════════════════════════════════════════════════════════╗');
                    console.log('[PHASE 11.6 DIAGNOSTIC] TOOL MESSAGE STRING CONTENT');
                    console.log('╠═══════════════════════════════════════════════════════════╣');
                    console.log('[PHASE 11.6] Content type:', typeof msg.content);
                    console.log('[PHASE 11.6] Content length:', typeof msg.content === 'string' ? msg.content.length : 'N/A');
                    console.log('[PHASE 11.6] Message ID:', msg.id);

                    if (typeof msg.content === 'string' && msg.content.length > 0) {
                      console.log('[PHASE 11.6] Content Preview:', msg.content.substring(0, 300));
                      console.log('[PHASE 11.6] Has markdown headers:', msg.content.includes('# '));
                      console.log('[PHASE 11.6] Has markdown bullets:', msg.content.includes('- ') || msg.content.includes('* '));
                      console.log('[PHASE 11.6] Has newlines:', msg.content.includes('\n'));
                      console.log('[PHASE 11.6] ✅ EXTRACTING TO UI as type: message');

                      // CRITICAL FIX: Send tool content as MESSAGE type so it displays as text
                      // Tool results contain research findings, not just metadata

                      // ═══════════════════════════════════════════════════════════════
                      // PHASE 12: DIAGNOSTIC - Log EXACT onChunk() call with timestamp
                      // ═══════════════════════════════════════════════════════════════
                      const timestamp = new Date().toISOString();
                      console.log('[PHASE 12] 🚀 CALLING onChunk() NOW!');
                      console.log('[PHASE 12] Timestamp:', timestamp);
                      console.log('[PHASE 12] Chunk type:', 'message');
                      console.log('[PHASE 12] Content length:', msg.content.length);
                      console.log('[PHASE 12] Content first 200 chars:', msg.content.substring(0, 200));

                      onChunk({
                        type: 'message',
                        content: msg.content
                      });

                      console.log('[PHASE 12] ✅ onChunk() call COMPLETED');
                      metrics.toolResultMessages++;
                      contentExtracted = true;
                    } else {
                      console.log('[PHASE 11.6] ❌ Content is not a non-empty string:', msg.content);
                    }
                    console.log('╚═══════════════════════════════════════════════════════════╝');
                  }
                  console.log('═══════════════════════════════════════════════════════');
                } else if (msg.type) {
                  // ═══════════════════════════════════════════════════════════════
                  // PHASE 11.3: DIAGNOSTIC - Log UNKNOWN message types we're skipping
                  // This catches any message types LangSmith sends that we don't handle
                  // ═══════════════════════════════════════════════════════════════
                  console.log('╔═══════════════════════════════════════════════════════╗');
                  console.log('[PHASE 11.3 DIAGNOSTIC] SKIPPED - UNKNOWN MESSAGE TYPE');
                  console.log('╠═══════════════════════════════════════════════════════╣');
                  console.log('[PHASE 11.3] Message Type:', msg.type);
                  console.log('[PHASE 11.3] Message ID:', msg.id || 'NO ID');
                  console.log('[PHASE 11.3] Has Content:', !!msg.content);
                  console.log('[PHASE 11.3] Content Type:', typeof msg.content);
                  console.log('[PHASE 11.3] All Keys:', Object.keys(msg));
                  console.log('[PHASE 11.3] Full Message:', JSON.stringify(msg, null, 2));
                  console.log('╚═══════════════════════════════════════════════════════╝');
                } else {
                  // ═══════════════════════════════════════════════════════════════
                  // PHASE 11.3: DIAGNOSTIC - Messages with NO TYPE at all
                  // ═══════════════════════════════════════════════════════════════
                  console.log('╔═══════════════════════════════════════════════════════╗');
                  console.log('[PHASE 11.3 DIAGNOSTIC] SKIPPED - NO MESSAGE TYPE');
                  console.log('╠═══════════════════════════════════════════════════════╣');
                  console.log('[PHASE 11.3] Message has no type property!');
                  console.log('[PHASE 11.3] All Keys:', Object.keys(msg));
                  console.log('[PHASE 11.3] Full Message:', JSON.stringify(msg, null, 2));
                  console.log('╚═══════════════════════════════════════════════════════╝');
                }
              }
            } else if (messagesToProcess.length === 0) {
              console.log('[PHASE 11] ℹ️  No messages to process in this chunk');
            }

            // Ignore agent_memory field (12,391 token system prompt - not for display)
            if (data.agent_memory && !contentExtracted) {
              console.log('[PHASE 3] ⏭️  Ignoring agent_memory field (system prompt)');
            }

            if (!contentExtracted && !data.agent_memory && messagesToProcess.length > 0) {
              console.warn('[PHASE 3] ⚠️  No AI content extracted from event (unexpected format)');
            }
          } catch (parseError) {
            console.error('[DIAGNOSTIC] Parse error:', parseError);
            console.error('[DIAGNOSTIC] Failed line:', trimmed);
          }
        }
      }
    }
  } catch (error) {
    console.error('[DIAGNOSTIC] Stream error:', error);
    onChunk({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
    throw error;
  }
}

/**
 * Generate a unique thread ID for a new conversation
 */
export function generateThreadId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
