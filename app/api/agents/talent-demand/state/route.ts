/**
 * Thread State Retrieval API
 * Fetches complete conversation state including tool outputs from LangSmith
 *
 * This endpoint is called AFTER the SSE stream completes to retrieve:
 * 1. Tool execution results (sub-agent research findings)
 * 2. Generated file artifacts
 * 3. Final conversation state
 *
 * LangSmith Architecture:
 * - SSE Stream: Real-time status updates, tool launches, AI thinking
 * - Thread State API: Complete results after execution
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const AGENT_DEPLOYMENT_URL = process.env.LANGSMITH_AGENT_URL || 'https://prod-deepagents-agent-build-d4c1479ed8ce53fbb8c3eefc91f0aa7d.us.langgraph.app';

interface ToolOutput {
  toolUseId: string;
  output: any;
  toolName: string;
  timestamp?: string;
}

interface FileArtifact {
  filePath: string;
  content: string;
  fileName: string;
  toolUseId: string;
}

interface ThreadStateResponse {
  toolOutputs: ToolOutput[];
  files: FileArtifact[];
  messageCount: number;
  success: boolean;
}

/**
 * Extract tool name from tool_use block by matching tool_use_id
 */
function findToolNameForResult(toolUseId: string, messages: any[]): string {
  for (const msg of messages) {
    if (msg.type === 'ai' && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'tool_use' && block.id === toolUseId) {
          return block.name || 'unknown';
        }
      }
    }
  }
  return 'unknown';
}

/**
 * Extract tool outputs from thread state messages
 * Tool outputs are in messages with type='tool' containing tool_result blocks
 */
function extractToolOutputs(messages: any[]): ToolOutput[] {
  const outputs: ToolOutput[] = [];

  console.log('[Thread State] Extracting tool outputs from', messages.length, 'messages');

  for (const msg of messages) {
    if (msg.type === 'tool') {
      console.log('[Thread State] Found tool message:', {
        id: msg.id,
        hasContent: !!msg.content,
        contentType: typeof msg.content,
        isArray: Array.isArray(msg.content)
      });

      // Tool messages can have content as string OR array of blocks
      if (typeof msg.content === 'string' && msg.content.trim().length > 0) {
        // String content - this is the tool output directly
        // FIX: Use tool_call_id (matches original tool_use block) instead of msg.id (message UUID)
        const toolCallId = msg.tool_call_id || msg.id || 'unknown';
        outputs.push({
          toolUseId: toolCallId,
          output: msg.content,
          toolName: findToolNameForResult(toolCallId, messages),
          timestamp: msg.created_at
        });

        console.log('[Thread State] Extracted string tool output:', {
          toolUseId: toolCallId,
          msgId: msg.id,
          tool_call_id: msg.tool_call_id,
          contentLength: msg.content.length,
          preview: msg.content.substring(0, 100)
        });
      } else if (Array.isArray(msg.content)) {
        // Array of content blocks - extract tool_result blocks
        for (const block of msg.content) {
          if (block.type === 'tool_result') {
            outputs.push({
              toolUseId: block.tool_use_id || block.id,
              output: block.content,
              toolName: findToolNameForResult(block.tool_use_id, messages),
              timestamp: msg.created_at
            });

            console.log('[Thread State] Extracted tool_result block:', {
              toolUseId: block.tool_use_id,
              hasContent: !!block.content,
              contentType: typeof block.content
            });
          }
        }
      }
    }
  }

  console.log('[Thread State] Total tool outputs extracted:', outputs.length);
  return outputs;
}

/**
 * Extract file artifacts from write_file tool invocations AND tool results
 * LangSmith may store files in tool results rather than tool_use blocks
 */
function extractFileArtifacts(messages: any[], threadState?: any): FileArtifact[] {
  const files: FileArtifact[] = [];

  console.log('[Thread State API] 🔍 Extracting file artifacts from', messages.length, 'messages');
  console.log('[Thread State API] 🔍 Message types:', messages.map(m => m.type).join(', '));

  for (const msg of messages) {
    // Check AI messages with tool_use blocks
    if (msg.type === 'ai' && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'tool_use') {
          const toolName = block.name?.toLowerCase() || '';
          const input = block.input || {};

          console.log('[Thread State API] 🔍 Checking tool_use block:', {
            toolName,
            hasFilePath: !!input.file_path,
            hasContent: !!input.content,
            inputKeys: Object.keys(input)
          });

          // Check for write_file tool invocations
          const isWriteFile = toolName === 'write_file' ||
                             toolName.includes('file') ||
                             input.subagent_type === 'write_file' ||
                             (input.file_path && input.content);

          if (isWriteFile && input.file_path && input.content) {
            const fileName = input.file_path.split('/').pop() || 'artifact.md';

            files.push({
              filePath: input.file_path,
              content: input.content,
              fileName: fileName,
              toolUseId: block.id
            });

            console.log('[Thread State API] ✅ Extracted file from tool_use:', {
              fileName,
              contentLength: input.content.length,
              toolUseId: block.id
            });
          }
        }
      }
    }

    // ALSO check tool messages for file content in results
    // NOTE: String content in tool messages are sub-agent conversational responses,
    // NOT files. They are handled by extractToolOutputs() for inline display.
    // Only check array content for explicit file artifacts with file_path/filename.
    if (msg.type === 'tool') {
      console.log('[Thread State API] 🔍 Checking tool result message for files');

      if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          // Check if result contains file data
          if (block.type === 'tool_result' && block.content) {
            const content = block.content;

            // Check if content looks like a file (has path/name indicators)
            if (typeof content === 'object' && (content.file_path || content.filename || content.path)) {
              const fileName = content.file_path?.split('/').pop() || content.filename || 'artifact.md';
              const fileContent = content.content || content.data || JSON.stringify(content);

              files.push({
                filePath: content.file_path || content.path || fileName,
                content: fileContent,
                fileName: fileName,
                toolUseId: block.tool_use_id || block.id
              });

              console.log('[Thread State API] ✅ Extracted file from tool_result:', {
                fileName,
                contentLength: fileContent.length
              });
            }
          }
        }
      }
    }
  }

  console.log('[Thread State API] 📊 Total file artifacts extracted:', files.length);
  if (files.length === 0) {
    console.warn('[Thread State API] ⚠️  NO FILES FOUND in messages - Checking threadState for diagnosis');

    // Check if files exist at thread state root level
    if (threadState?.values?.files) {
      console.log('[Thread State API] 🔍 FOUND files array at root level:', {
        fileCount: Array.isArray(threadState.values.files) ? threadState.values.files.length : 'not array',
        fileData: JSON.stringify(threadState.values.files).substring(0, 1000)
      });
    }

    // Check if artifacts exist
    if (threadState?.values?.artifacts) {
      console.log('[Thread State API] 🔍 FOUND artifacts array:', {
        artifactCount: Array.isArray(threadState.values.artifacts) ? threadState.values.artifacts.length : 'not array',
        artifactData: JSON.stringify(threadState.values.artifacts).substring(0, 1000)
      });
    }

    // Dump message types and content block structures
    console.log('[Thread State API] 🔍 Message type breakdown:');
    const messageTypes = messages.map((m, i) => ({
      index: i,
      type: m.type,
      hasContent: !!m.content,
      contentType: Array.isArray(m.content) ? 'array' : typeof m.content,
      contentLength: Array.isArray(m.content) ? m.content.length : typeof m.content === 'string' ? m.content.length : 0,
      firstBlockType: Array.isArray(m.content) && m.content.length > 0 ? m.content[0].type : 'n/a'
    }));
    console.log(JSON.stringify(messageTypes, null, 2));

    // Dump last AI message (likely contains file reference)
    const lastAiMessage = messages.filter(m => m.type === 'ai').pop();
    if (lastAiMessage) {
      console.log('[Thread State API] 🔍 Last AI message structure:');
      console.log(JSON.stringify(lastAiMessage, null, 2).substring(0, 2000));
    }
  }

  return files;
}

/**
 * POST /api/agents/talent-demand/state
 * Retrieve complete thread state with tool outputs and files
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

    console.log('═══════════════════════════════════════════════════════');
    console.log('[Thread State API] Retrieving complete state for thread:', threadId);
    console.log('═══════════════════════════════════════════════════════');

    // Get API credentials
    const apiKey = process.env.LANGSMITH_API_KEY;

    if (!apiKey) {
      console.error('[Thread State API] Missing LANGSMITH_API_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // FIX: Use /state endpoint (not /history)
    // /state returns CURRENT checkpoint with in-progress sub-agent results
    // /history returns stale data during execution
    // Verified with live data: /state had 4-5 msgs while /history had 2
    // ═══════════════════════════════════════════════════════════════
    const stateUrl = `${AGENT_DEPLOYMENT_URL}/threads/${threadId}/state`;
    console.log('[Thread State API] Fetching from:', stateUrl);
    console.log('[Thread State API] ⚡ Using /state endpoint to get current checkpoint');

    const response = await fetch(stateUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'X-Auth-Scheme': 'langsmith-api-key',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Thread State API] Failed to fetch state:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to retrieve thread state: ${response.statusText}` },
        { status: response.status }
      );
    }

    // /state returns a single object with current checkpoint
    const stateData = await response.json();

    console.log('[Thread State API] 📋 State response type:', typeof stateData);
    console.log('[Thread State API] 📋 State keys:', stateData ? Object.keys(stateData) : 'N/A');

    // /state returns the current checkpoint directly as an object
    let threadState: any;
    if (typeof stateData === 'object' && stateData !== null) {
      threadState = stateData;
      console.log('[Thread State API] ✅ Using current state checkpoint');
      console.log('[Thread State API] 📋 State has values:', !!threadState.values);
      console.log('[Thread State API] 📋 Message count:', threadState.values?.messages?.length || 0);
    } else {
      console.error('[Thread State API] ❌ Unexpected state format:', typeof stateData);
      return NextResponse.json(
        { error: 'Unexpected state response format' },
        { status: 500 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // UNCONDITIONAL DEBUG LOGGING - WILL ALWAYS EXECUTE
    // ═══════════════════════════════════════════════════════════════
    console.log('[DISCOVERY] ============= RAW THREAD STATE =============');
    console.log('[DISCOVERY] Type:', typeof threadState);
    console.log('[DISCOVERY] Is null:', threadState === null);
    console.log('[DISCOVERY] Root keys:', threadState ? Object.keys(threadState) : 'N/A');

    if (threadState) {
      console.log('[DISCOVERY] Full structure (first 3000 chars):',
        JSON.stringify(threadState, null, 2).substring(0, 3000)
      );
    }

    if (threadState?.values) {
      console.log('[DISCOVERY] values keys:', Object.keys(threadState.values));
      console.log('[DISCOVERY] values.messages exists:', !!threadState.values.messages);
      console.log('[DISCOVERY] values.messages length:', threadState.values.messages?.length);
      console.log('[DISCOVERY] values.files exists:', !!threadState.values.files);
      console.log('[DISCOVERY] values.artifacts exists:', !!threadState.values.artifacts);
    }

    // ═══════════════════════════════════════════════════════════════
    // ENHANCED FILE STRUCTURE DIAGNOSTICS
    // ═══════════════════════════════════════════════════════════════
    if (threadState?.values?.files) {
      console.log('[DISCOVERY] 📁 FILES STRUCTURE ANALYSIS:');
      console.log('[DISCOVERY] files type:', typeof threadState.values.files);
      console.log('[DISCOVERY] files isArray:', Array.isArray(threadState.values.files));

      if (Array.isArray(threadState.values.files)) {
        console.log('[DISCOVERY] files count (array):', threadState.values.files.length);
      } else if (typeof threadState.values.files === 'object') {
        const fileKeys = Object.keys(threadState.values.files);
        console.log('[DISCOVERY] files keys (object):', fileKeys.slice(0, 10).join(', ') + (fileKeys.length > 10 ? '...' : ''));
        console.log('[DISCOVERY] files count (object keys):', fileKeys.length);

        // Sample one file's structure
        const firstKey = fileKeys.find(k => !k.startsWith('/tools/'));
        if (firstKey) {
          const firstFile = threadState.values.files[firstKey];
          console.log('[DISCOVERY] 📄 Sample file structure:', {
            path: firstKey,
            hasContent: !!firstFile?.content,
            contentType: Array.isArray(firstFile?.content) ? 'array' : typeof firstFile?.content,
            contentLength: Array.isArray(firstFile?.content)
              ? firstFile.content.length + ' array items'
              : typeof firstFile?.content === 'string'
                ? firstFile.content.length + ' chars'
                : 'unknown',
            hasCreatedAt: !!firstFile?.created_at,
            hasModifiedAt: !!firstFile?.modified_at
          });
        }
      }
    } else {
      console.log('[DISCOVERY] ⚠️ No files found in threadState.values');
    }

    console.log('[DISCOVERY] ============= END RAW STATE =============');

    // Extract messages from thread state
    // LangSmith returns: { values: { messages: [...] } }
    const messages = threadState.values?.messages || [];

    if (messages.length === 0) {
      console.warn('[Thread State API] No messages in thread state');
      return NextResponse.json({
        toolOutputs: [],
        files: [],
        messageCount: 0,
        success: true
      } as ThreadStateResponse);
    }

    // Extract tool outputs and file artifacts
    const toolOutputs = extractToolOutputs(messages);
    const files = extractFileArtifacts(messages, threadState);

    // ═══════════════════════════════════════════════════════════════
    // FIX #1: DIRECT EXTRACTION FROM THREAD STATE ROOT
    // PRIORITY 1: Handle files as OBJECT/DICTIONARY (LangSmith's actual structure)
    // LangSmith returns: { values: { files: { "/path/file.md": { content: [...], created_at, modified_at } } } }
    // ═══════════════════════════════════════════════════════════════
    if (threadState?.values?.files &&
        typeof threadState.values.files === 'object' &&
        !Array.isArray(threadState.values.files)) {
      console.log('[Thread State API] 🔍 Extracting files from OBJECT structure');
      const fileEntries = Object.entries(threadState.values.files as Record<string, any>);
      console.log('[Thread State API] File entries found:', fileEntries.length);

      for (const [filePath, fileData] of fileEntries) {
        try {
          // Skip tool documentation files (they have paths like /tools/*)
          if (filePath.startsWith('/tools/')) {
            continue;
          }

          const fileName = filePath.split('/').pop() || 'artifact.md';

          // LangSmith stores content as array of strings - join them
          let content = '';
          if (Array.isArray(fileData?.content)) {
            content = fileData.content.join('');
          } else if (typeof fileData?.content === 'string') {
            content = fileData.content;
          }

          // Only add if has content and not already extracted
          if (content && content.length > 0 && !files.some(f => f.fileName === fileName)) {
            files.push({
              filePath: filePath,
              content: content,
              fileName: fileName,
              toolUseId: 'thread-state-file'
            });
            console.log(`[Thread State API] ✅ Extracted file: ${fileName} (${content.length} chars)`);
          }
        } catch (fileError) {
          console.error(`[Thread State API] ❌ Error extracting file ${filePath}:`, fileError);
        }
      }
    }

    // FALLBACK: Handle files as array (keep for potential future API changes)
    if (threadState?.values?.files && Array.isArray(threadState.values.files)) {
      console.log('[Thread State API] 🔍 Checking threadState.values.files for additional files (array format)');
      for (const file of threadState.values.files) {
        const fileName = file.name || file.fileName || file.file_name || 'artifact.md';
        const content = file.content || file.data || file.text || '';

        // Only add if not already extracted and has content
        if (content && content.length > 0 && !files.some(f => f.fileName === fileName)) {
          files.push({
            filePath: file.path || file.filePath || file.file_path || `tmp/${fileName}`,
            content: content,
            fileName: fileName,
            toolUseId: file.id || 'thread-state-file'
          });
          console.log('[Thread State API] ✅ Extracted file from threadState.values.files (array):', {
            fileName,
            contentLength: content.length
          });
        }
      }
    }

    // Check artifacts array as well
    if (threadState?.values?.artifacts && Array.isArray(threadState.values.artifacts)) {
      console.log('[Thread State API] 🔍 Checking threadState.values.artifacts for additional files');
      for (const artifact of threadState.values.artifacts) {
        const fileName = artifact.name || artifact.fileName || artifact.file_name || 'artifact.md';
        const content = artifact.content || artifact.data || artifact.text || '';

        if (content && !files.some(f => f.fileName === fileName)) {
          files.push({
            filePath: artifact.path || artifact.filePath || artifact.file_path || `tmp/${fileName}`,
            content: content,
            fileName: fileName,
            toolUseId: artifact.id || 'thread-state-artifact'
          });
          console.log('[Thread State API] ✅ Extracted file from threadState.values.artifacts:', {
            fileName,
            contentLength: content.length
          });
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('[Thread State API] Extraction Summary:');
    console.log('[Thread State API] Total Messages:', messages.length);
    console.log('[Thread State API] Tool Outputs:', toolOutputs.length);
    console.log('[Thread State API] File Artifacts:', files.length);

    if (toolOutputs.length > 0) {
      console.log('[Thread State API] Tool Output Details:');
      toolOutputs.forEach((output, i) => {
        const contentLength = typeof output.output === 'string'
          ? output.output.length
          : JSON.stringify(output.output).length;
        console.log(`  ${i + 1}. ${output.toolName} - ${contentLength} characters`);
      });
    }

    if (files.length > 0) {
      console.log('[Thread State API] File Artifact Details:');
      files.forEach((file, i) => {
        console.log(`  ${i + 1}. ${file.fileName} - ${(file.content.length / 1024).toFixed(1)} KB`);
      });
    }
    console.log('═══════════════════════════════════════════════════════');

    return NextResponse.json({
      toolOutputs,
      files,
      messageCount: messages.length,
      success: true
    } as ThreadStateResponse);

  } catch (error) {
    console.error('[Thread State API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retrieve thread state',
        success: false
      },
      { status: 500 }
    );
  }
}
