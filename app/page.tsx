/**
 * Talent Demand Analyst UI
 * AI-powered talent demand trend analysis agent
 * 
 * ARCHITECTURE: Typed Chunk Rendering
 * - Chunks arrive with types: 'message' | 'tool_use' | 'tool_result'
 * - Each type renders with its own component
 * - No text parsing required - we use the structure directly
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamAgentResponse, generateThreadId } from '@/lib/talent-demand-agent';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface Message {
  id?: string;  // Optional ID for tracking/updating specific messages
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  // NEW: Store structured chunks for agent messages to preserve formatting
  chunks?: DisplayChunk[];
}

interface Artifact {
  filePath: string;
  content: string;
  fileName: string;
}

// NEW: Typed chunk for display - preserves structure from backend
interface DisplayChunk {
  id: string;
  type: 'message' | 'tool_use' | 'tool_result' | 'agent_question';
  content?: string;
  toolName?: string;
  workerName?: string;
  toolInput?: any;
  toolResult?: any;
  toolCallId?: string;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// AGENT QUESTION DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Detects if content is an agent-to-agent question (not meant for user action)
 * These are sub-agents asking the lead agent for clarification
 */
function isAgentToAgentQuestion(content: string): boolean {
  if (!content || content.length < 20) return false;
  
  const patterns = [
    /would you like me to[:\s]/i,
    /how can i help you further/i,
    /what would be most valuable/i,
    /shall i proceed with/i,
    /do you want me to/i,
    /should i focus on/i,
    /let me know if you'd like/i,
    /i can also[:\s]/i,
    // Lettered or bulleted options at start of lines
    /^[A-E]\)\s/m,
    /^[-•]\s*(search|pull|research|dive|analyze|focus)/im,
  ];
  
  return patterns.some(pattern => pattern.test(content));
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM MARKDOWN COMPONENTS - Force bullet rendering with inline styles
// ═══════════════════════════════════════════════════════════════
const markdownComponents = {
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
      {children}
    </li>
  ),
};

// ═══════════════════════════════════════════════════════════════
// PHASE 2: POLLING HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Parse todo list to detect pending work
 * Extracts task status from write_todos tool output
 */
function parseAgentTodos(content: string): { completed: number; inProgress: number; pending: number } {
  const todos = { completed: 0, inProgress: 0, pending: 0 };

  // Match status values from Python dict format: 'status': 'completed'
  const statusMatches = content.matchAll(/'status':\s*'(\w+)'/g);
  for (const match of statusMatches) {
    const status = match[1];
    if (status === 'completed') todos.completed++;
    else if (status === 'in_progress') todos.inProgress++;
    else if (status === 'pending') todos.pending++;
  }

  return todos;
}

/**
 * Check if agent has pending work using multiple signals
 *
 * WAVE 1 PHASE A: Multi-Signal Detection
 *
 * Detection Signals:
 * 1. Worker questions: Agent asking for clarification (e.g., "What Would You Like Next?")
 * 2. Unfinished tools: tool_use chunks without corresponding tool_result chunks
 * 3. Todo lists: Traditional write_todos status checking (backward compatibility)
 *
 * Returns true if ANY signal indicates pending work
 *
 * EXPERT REFINEMENT: Uses both exact string matching and regex patterns for robust detection
 */
function hasAgentPendingWork(chunks: DisplayChunk[]): boolean {
  console.log('[Pending Work Check] Analyzing', chunks.length, 'chunks for pending work signals');

  // SIGNAL 1: Check for worker questions
  // Combines exact phrases (fast) with regex patterns (catches variations)
  const questionPatterns = [
    // Exact phrases
    'What Would You Like Next?',
    'Would you like me to',
    'Should I proceed',
    'Which option would you prefer',
    'What additional information',
    // Regex patterns (case insensitive, catches variations)
    /\?\s*$/m,                          // Ends with question mark
    /would you like/i,
    /let me know/i,
    /how would you/i,
    /what (specific|format|aspect)/i,
  ];

  const hasWorkerQuestion = chunks.some(c => {
    const content = c.content || c.toolResult || '';
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    return questionPatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return contentStr.includes(pattern);
      }
      return pattern.test(contentStr);
    });
  });

  if (hasWorkerQuestion) {
    console.log('[Pending Work Check] ✅ Signal 1: Worker question detected');
    return true;
  }

  // SIGNAL 2: Check for unfinished tool invocations
  const toolUseChunks = chunks.filter(c => c.type === 'tool_use');
  const toolResultChunks = chunks.filter(c => c.type === 'tool_result');

  console.log('[Pending Work Check] Tool invocations:', {
    tool_use: toolUseChunks.length,
    tool_result: toolResultChunks.length
  });

  if (toolUseChunks.length > toolResultChunks.length) {
    const pendingTools = toolUseChunks.length - toolResultChunks.length;
    console.log(`[Pending Work Check] ✅ Signal 2: ${pendingTools} unfinished tool invocation(s)`);
    return true;
  }

  // SIGNAL 3: Check for pending todos (backward compatibility)
  const todoChunks = chunks.filter(c => {
    const content = c.content || c.toolResult || '';
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return contentStr.includes("Updated todo list") || contentStr.includes("'status':");
  });

  if (todoChunks.length > 0) {
    const lastTodo = todoChunks[todoChunks.length - 1];
    const content = lastTodo.content || lastTodo.toolResult || '';
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    const todos = parseAgentTodos(contentStr);
    console.log('[Pending Work Check] Signal 3: Todo status:', todos);

    if (todos.pending > 0 || todos.inProgress > 0) {
      console.log('[Pending Work Check] ✅ Signal 3: Pending todos detected');
      return true;
    }
  }

  console.log('[Pending Work Check] ❌ No pending work signals detected');
  return false;
}

// ═══════════════════════════════════════════════════════════════
// CHUNK RENDERER COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * AgentCoordinationCard - Renders agent-to-agent questions
 * Shows internal coordination without requiring user action
 */
function AgentCoordinationCard({ chunk }: { chunk: DisplayChunk }) {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div className="bg-violet-50 border-l-4 border-violet-300 rounded-r my-3">
      {/* Badge Header */}
      <div className="bg-violet-100 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🤖</span>
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
            Agent Coordination
          </span>
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-violet-400 hover:text-violet-600 px-1"
        >
          {collapsed ? '▶' : '▼'}
        </button>
      </div>
      
      {/* Info Banner */}
      <div className="px-3 py-1.5 bg-violet-50 border-b border-violet-200">
        <span className="text-xs text-violet-500 italic">
          ℹ️ Internal agent discussion — no action needed from you
        </span>
      </div>
      
      {/* Content */}
      {!collapsed && (
        <div className="px-3 py-2">
          <div className="text-sm text-violet-700 prose prose-sm max-w-none prose-violet
                        prose-p:my-1 
                        prose-ul:list-disc prose-ul:pl-5 prose-ul:my-1
                        prose-ol:list-decimal prose-ol:pl-5
                        prose-li:my-0.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {chunk.content || ''}
            </ReactMarkdown>
          </div>
        </div>
      )}
      
      {collapsed && (
        <div className="px-3 py-2 text-xs text-violet-400 italic">
          Agent coordination hidden • Click ▶ to expand
        </div>
      )}
    </div>
  );
}

/**
 * AgentMissionCard - Renders tool_use chunks (task assignments)
 * Shows Lead Agent delegating work to specialized workers
 */
function AgentMissionCard({ chunk }: { chunk: DisplayChunk }) {
  const [collapsed, setCollapsed] = useState(false);
  const description = chunk.content || chunk.toolInput?.description || '';
  const isLongContent = description.length > 500;
  
  return (
    <div className="bg-slate-50 border-l-4 border-slate-400 rounded-r my-3">
      {/* Badge Header */}
      <div className="bg-slate-200 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🔄</span>
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Agent Task
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {new Date(chunk.timestamp).toLocaleTimeString()}
          </span>
          {isLongContent && (
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="text-xs text-slate-500 hover:text-slate-700 px-1"
            >
              {collapsed ? '▶' : '▼'}
            </button>
          )}
        </div>
      </div>
      
      {/* Agent Assignment Header */}
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-100/50">
        <span className="text-sm font-medium text-slate-700">
          👤 Lead Agent → 🔍 {chunk.workerName || 'worker'}
        </span>
      </div>
      
      {/* Task Content */}
      {!collapsed && (
        <div className="px-3 py-2">
          <div className="text-sm text-slate-600 prose prose-sm max-w-none prose-slate
                        prose-p:my-1 prose-p:leading-relaxed
                        prose-ul:list-disc prose-ul:pl-5 prose-ul:my-1
                        prose-ol:list-decimal prose-ol:pl-5
                        prose-li:my-0.5
                        prose-headings:text-slate-700 prose-headings:font-semibold
                        prose-strong:text-slate-700
                        prose-code:text-xs prose-code:bg-slate-200 prose-code:px-1 prose-code:rounded">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {description}
            </ReactMarkdown>
          </div>
        </div>
      )}
      
      {collapsed && (
        <div className="px-3 py-2 text-xs text-slate-400 italic">
          Task details hidden • Click ▶ to expand
        </div>
      )}
    </div>
  );
}

/**
 * AgentFindingsCard - Renders tool_result chunks (research findings)
 * Shows worker completing task and reporting back - PROMINENT styling
 */
function AgentFindingsCard({ chunk }: { chunk: DisplayChunk }) {
  const [collapsed, setCollapsed] = useState(false);
  const result = chunk.toolResult;
  
  // Convert result to displayable string
  let contentString = '';
  if (typeof result === 'string') {
    contentString = result;
  } else if (Array.isArray(result)) {
    contentString = result
      .map(block => {
        if (typeof block === 'string') return block;
        if (block.type === 'text' && block.text) return block.text;
        if (block.content) return typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2);
        return JSON.stringify(block, null, 2);
      })
      .join('\n\n');
  } else if (result && typeof result === 'object') {
    if ('text' in result) contentString = result.text;
    else if ('content' in result) contentString = typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);
    else contentString = JSON.stringify(result, null, 2);
  }
  
  const isLongContent = contentString.length > 2000;
  
  return (
    <div className="bg-white border-l-4 border-emerald-500 rounded-r my-3 shadow-sm">
      {/* Badge Header */}
      <div className="bg-emerald-50 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">✅</span>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
            Research Complete
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {new Date(chunk.timestamp).toLocaleTimeString()}
          </span>
          {isLongContent && (
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="text-xs text-slate-500 hover:text-slate-700 px-1"
            >
              {collapsed ? '▶' : '▼'}
            </button>
          )}
        </div>
      </div>
      
      {/* Attribution Header */}
      <div className="px-3 py-2 border-b border-slate-100 bg-emerald-50/30">
        <span className="text-sm font-medium text-slate-700">
          🔍 Worker → 👤 Lead Agent
        </span>
      </div>
      
      {/* Findings Content - PROMINENT */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div className="prose prose-sm max-w-none
                        prose-headings:text-gray-900 prose-headings:font-semibold
                        prose-h1:text-lg prose-h1:mt-4 prose-h1:mb-2
                        prose-h2:text-base prose-h2:mt-3 prose-h2:mb-1.5
                        prose-h3:text-sm prose-h3:mt-2 prose-h3:mb-1
                        prose-p:my-2 prose-p:leading-relaxed
                        prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
                        prose-ol:list-decimal prose-ol:pl-5
                        prose-li:my-0.5
                        prose-strong:text-gray-900
                        prose-code:text-xs prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
                        prose-pre:bg-gray-50 prose-pre:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {contentString}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="px-3 py-2 text-xs text-slate-400 italic">
          {contentString.length.toLocaleString()} characters • Click ▶ to expand
        </div>
      )}
    </div>
  );
}

/**
 * MessageBlock - Renders message chunks (AI explanations)
 * Standard prose styling, no special framing
 */
function MessageBlock({ chunk }: { chunk: DisplayChunk }) {
  return (
    <div className="prose prose-sm max-w-none my-2
                  prose-headings:text-gray-900 prose-headings:font-semibold
                  prose-h1:text-lg prose-h1:mt-4 prose-h1:mb-2
                  prose-h2:text-base prose-h2:mt-3 prose-h2:mb-1.5
                  prose-p:my-2 prose-p:leading-relaxed
                  prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2 
                  prose-ol:list-decimal prose-ol:pl-5
                  prose-li:my-0.5
                  prose-strong:text-gray-900
                  prose-code:text-xs prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {chunk.content || ''}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Convert DisplayChunks to a text string for message storage
 * Called when streaming ends to save the conversation history
 */
function chunksToText(chunks: DisplayChunk[]): string {
  return chunks.map(chunk => {
    switch (chunk.type) {
      case 'tool_use':
        const workerName = chunk.workerName || 'worker';
        const description = chunk.content || chunk.toolInput?.description || '';
        return `👤 **Lead Agent → 🔍 ${workerName}**\n\n${description}`;
      
      case 'tool_result':
        const result = chunk.toolResult;
        let resultText = '';
        if (typeof result === 'string') {
          resultText = result;
        } else if (result?.text) {
          resultText = result.text;
        } else if (result?.content) {
          resultText = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
        } else {
          resultText = JSON.stringify(result);
        }
        return `✅ **Worker → 👤 Lead Agent**\n\n${resultText}`;
      
      case 'agent_question':
        return `🤖 **Agent Coordination**\n\n${chunk.content || ''}`;
      
      case 'message':
        return chunk.content || '';
      
      default:
        return '';
    }
  }).filter(Boolean).join('\n\n');
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function TalentDemandPage() {
  // Existing state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content: "Hello! I'm your Talent Demand Analyst. I can help you understand workforce trends, skills requirements, and talent demand patterns across industries and roles.\n\nTry asking me about:\n- Demand for specific skills or roles\n- Industry workforce trends\n- Skills emergence and evolution\n- Compensation benchmarks\n- Geographic talent distribution",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  // Thread management
  const threadIdRef = useRef<string>(generateThreadId());
  const [conversationStarted, setConversationStarted] = useState(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  // NEW: Typed chunk state (replaces streamingContent string)
  const [streamingChunks, setStreamingChunks] = useState<DisplayChunk[]>([]);
  
  // NEW: Deduplication for tool results
  const seenToolCallIdsRef = useRef<Set<string>>(new Set());

  // FIX #2: Track current agent message ID for updating chunks after polling
  const currentAgentMessageIdRef = useRef<string | null>(null);

  // PHASE 2: Polling state for delayed file retrieval
  const [isPollingForCompletion, setIsPollingForCompletion] = useState(false);
  const [pollingMessage, setPollingMessage] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingChunks]);

  // Focus input after agent responds
  useEffect(() => {
    if (!isProcessing) {
      inputRef.current?.focus();
    }
  }, [isProcessing]);

  async function sendMessage() {
    const userMessage = inputValue.trim();
    if (!userMessage || isProcessing) return;

    // Add user message to chat
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsProcessing(true);
    
    // Reset streaming state
    setStreamingChunks([]);
    // Don't reset seenToolCallIds - we want to dedupe across the whole conversation

    try {
      console.log('[Frontend] 📤 Sending message with thread ID:', threadIdRef.current);
      
      await streamAgentResponse(
        userMessage,
        threadIdRef.current,
        (chunk) => {
          console.log('[UI] 📥 Chunk received:', {
            type: chunk.type,
            hasContent: !!chunk.content,
            hasToolResult: !!chunk.toolResult,
            toolCallId: chunk.toolCallId,
            timestamp: new Date().toISOString()
          });

          if (chunk.type === 'message' && chunk.content) {
            // ═══════════════════════════════════════════════════════════════
            // MESSAGE CHUNK: AI explanations and text
            // FIXED: Don't re-evaluate type - keep original type once set
            // Also scan for file artifact mentions
            // ═══════════════════════════════════════════════════════════════
            
            // FIX: Scan message content for file save mentions
            const fileSavePattern = /(?:saved|written|created|generated)\s+(?:to|at|as)\s+[/\\]?([^\s\n]+\.(?:md|txt|json|csv|pdf|docx))/gi;
            const matches = (chunk.content || '').matchAll(fileSavePattern);
            for (const match of matches) {
              const fileName = match[1].split('/').pop() || match[1];
              console.log('[UI] 📄 File reference detected in message:', fileName);
              setArtifacts(prev => {
                if (prev.some(a => a.fileName === fileName)) return prev;
                return [...prev, {
                  filePath: match[1],
                  content: `File generated by agent: ${fileName}\n\n(Full content available in LangSmith)`,
                  fileName: fileName
                }];
              });
            }
            
            setStreamingChunks(prev => {
              const last = prev[prev.length - 1];
              
              // If last chunk was a message type, append to it - KEEP ORIGINAL TYPE
              if (last && (last.type === 'message' || last.type === 'agent_question')) {
                const newContent = (last.content || '') + chunk.content;
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: newContent }  // Don't change type!
                ];
              }
              
              // New chunk - evaluate type ONCE at creation
              const isAgentQuestion = isAgentToAgentQuestion(chunk.content || '');
              const chunkType = isAgentQuestion ? 'agent_question' : 'message';
              
              return [...prev, {
                id: `${chunkType}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                type: chunkType,
                content: chunk.content,
                timestamp: Date.now()
              }];
            });
            
          } else if (chunk.type === 'tool_use') {
            // ═══════════════════════════════════════════════════════════════
            // TOOL_USE CHUNK: Task assignments to workers
            // Extract metadata and store as typed chunk
            // ═══════════════════════════════════════════════════════════════
            const toolInput = chunk.toolInput || {};
            const subagentType = toolInput.subagent_type || chunk.toolName || 'worker';
            const workerName = subagentType.replace(/[-_]/g, ' ');
            const description = toolInput.description || '';

            console.log('[UI] 🔧 Tool invocation:', {
              toolName: chunk.toolName,
              subagentType,
              workerName,
              hasDescription: !!description,
              descriptionLength: description.length,
              hasFilePath: !!toolInput.file_path,
              hasFileContent: !!toolInput.content,
              filePathValue: toolInput.file_path || 'none'
            });

            // Check for file artifacts
            const isWriteFile = chunk.toolName === 'write_file' ||
                                toolInput.subagent_type === 'write_file' ||
                                toolInput.subagent_type === 'Write File';
            
            console.log('[UI] 📄 File check:', {
              isWriteFile,
              toolNameMatch: chunk.toolName === 'write_file',
              subagentMatch: toolInput.subagent_type === 'write_file',
              hasRequiredFields: !!(toolInput.file_path && toolInput.content)
            });

            if (isWriteFile && toolInput.file_path && toolInput.content) {
              console.log('[UI] ✅ FILE ARTIFACT DETECTED:', toolInput.file_path);
              const fileName = toolInput.file_path.split('/').pop() || 'report.md';
              // FIXED: Check for duplicate before adding
              setArtifacts(prev => {
                if (prev.some(a => a.fileName === fileName)) {
                  console.log('[UI] ⏭️ Skipping duplicate file:', fileName);
                  return prev;
                }
                return [...prev, {
                  filePath: toolInput.file_path,
                  content: toolInput.content,
                  fileName: fileName
                }];
              });
            }

            // Store as typed chunk
            setStreamingChunks(prev => [...prev, {
              id: `tool_use_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              type: 'tool_use',
              toolName: chunk.toolName,
              workerName: workerName,
              toolInput: toolInput,
              content: description,
              timestamp: Date.now()
            }]);
            
          } else if (chunk.type === 'tool_result') {
            // ═══════════════════════════════════════════════════════════════
            // TOOL_RESULT CHUNK: Research findings from workers
            // DEDUPLICATION: Skip if we've seen this toolCallId before
            // Also scan for file artifact mentions in content
            // ═══════════════════════════════════════════════════════════════
            const toolCallId = chunk.toolCallId;
            
            if (toolCallId && seenToolCallIdsRef.current.has(toolCallId)) {
              console.log('[UI] ⏭️ Skipping duplicate tool result:', toolCallId);
              return;
            }
            
            if (toolCallId) {
              seenToolCallIdsRef.current.add(toolCallId);
            }

            console.log('[UI] ✅ Tool result:', {
              toolCallId,
              resultType: typeof chunk.toolResult,
              resultLength: typeof chunk.toolResult === 'string' 
                ? chunk.toolResult.length 
                : JSON.stringify(chunk.toolResult || {}).length
            });

            // FIX: Scan tool result content for file save mentions
            // Agent says "saved to /filename.md" but doesn't use write_file tool
            const resultStr = typeof chunk.toolResult === 'string' 
              ? chunk.toolResult 
              : JSON.stringify(chunk.toolResult || '');
            
            const fileSavePattern = /(?:saved|written|created|generated)\s+(?:to|at|as)\s+[/\\]?([^\s\n]+\.(?:md|txt|json|csv|pdf|docx))/gi;
            const matches = resultStr.matchAll(fileSavePattern);
            for (const match of matches) {
              const fileName = match[1].split('/').pop() || match[1];
              console.log('[UI] 📄 File reference detected in result:', fileName);
              // Add as artifact reference (content not available via stream)
              setArtifacts(prev => {
                if (prev.some(a => a.fileName === fileName)) return prev;
                return [...prev, {
                  filePath: match[1],
                  content: `File generated by agent: ${fileName}\n\n(Full content available in LangSmith)`,
                  fileName: fileName
                }];
              });
            }

            // Store as typed chunk
            setStreamingChunks(prev => [...prev, {
              id: `tool_result_${toolCallId || Date.now()}`,
              type: 'tool_result',
              toolCallId: toolCallId,
              toolResult: chunk.toolResult,
              timestamp: Date.now()
            }]);
            
          } else if (chunk.type === 'error') {
            // ═══════════════════════════════════════════════════════════════
            // ERROR CHUNK: Handle errors
            // ═══════════════════════════════════════════════════════════════
            let errorContent = chunk.error || 'An unknown error occurred';

            // Handle token limit errors specifically
            if (errorContent.includes('prompt is too long') || errorContent.includes('tokens >')) {
              const match = errorContent.match(/(\d+)\s+tokens\s+>\s+(\d+)/);
              if (match) {
                const [_, used, limit] = match;
                errorContent = `⚠️ **Query Too Complex**\n\nThis query requires ${parseInt(used).toLocaleString()} tokens but the limit is ${parseInt(limit).toLocaleString()} tokens.\n\n**Suggestions:**\n- Break this into smaller, more focused queries\n- Ask about specific aspects rather than comprehensive reports\n- Try a narrower scope or time range`;
              } else {
                errorContent = '⚠️ **Query Too Complex**\n\nThis query exceeded the token limit. Please try a more focused question or break it into smaller queries.';
              }
            }

            const errorMessage: Message = {
              role: 'system',
              content: errorContent,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            
          } else if (chunk.type === 'end') {
            // ═══════════════════════════════════════════════════════════════
            // END CHUNK: Stream complete
            // FIXED: Save chunks WITH message to preserve card formatting
            // ═══════════════════════════════════════════════════════════════
            if (chunk.threadId) {
              console.log('[Frontend] 💾 Storing thread ID for multi-turn:', chunk.threadId);
              threadIdRef.current = chunk.threadId;
              setConversationStarted(true);
            }

            // Save chunks WITH the message to preserve formatting
            setStreamingChunks(currentChunks => {
              if (currentChunks.length > 0) {
                // DEBUG: Log chunk breakdown for diagnosis
                const chunkTypes = currentChunks.reduce((acc, c) => {
                  acc[c.type] = (acc[c.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                console.log('[END] 📊 CHUNK BREAKDOWN:', {
                  total: currentChunks.length,
                  types: chunkTypes,
                  tool_use_count: chunkTypes['tool_use'] || 0,
                  tool_result_count: chunkTypes['tool_result'] || 0,
                  message_count: chunkTypes['message'] || 0
                });

                const fullResponse = chunksToText(currentChunks);
                if (fullResponse.trim()) {
                  // FIX #2: Generate stable ID for tracking/updating this message
                  const messageId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  currentAgentMessageIdRef.current = messageId;

                  const agentMessage: Message = {
                    id: messageId,
                    role: 'agent',
                    content: fullResponse,
                    timestamp: new Date(),
                    chunks: [...currentChunks],  // PRESERVE CHUNKS!
                  };
                  console.log('[END] 💾 SAVING MESSAGE with', currentChunks.length, 'chunks including', chunkTypes['tool_result'] || 0, 'tool_results');
                  console.log('[END] 📝 Message ID for updates:', messageId);
                  setMessages((prev) => [...prev, agentMessage]);
                }

                // ═══════════════════════════════════════════════════════════════
                // PHASE 2.5: TRIGGER POLLING IF AGENT HAS PENDING WORK
                // WAVE 1 PHASE C: SAFETY NET + ENHANCED LOGGING
                // ═══════════════════════════════════════════════════════════════

                // Check if agent has pending work (multi-signal detection)
                const hasPendingWork = hasAgentPendingWork(currentChunks);

                // SAFETY NET: Check if ANY tools were invoked
                const toolsInvoked = currentChunks.some(c => c.type === 'tool_use');

                console.log('[END] Stream ended:', {
                  threadId: chunk.threadId,
                  chunksProcessed: currentChunks.length,
                  artifactsCollected: artifacts.length,
                  hasPendingWork,
                  toolsInvoked  // NEW: Track tool invocation status
                });

                // ENHANCED LOGIC: Poll if pending work detected OR tools were invoked
                const shouldPoll = hasPendingWork || toolsInvoked;

                // EXPERT REFINEMENT: Clear polling decision log
                console.log('[END] 🎯 POLLING DECISION:', {
                  shouldPoll,
                  reason: hasPendingWork ? 'pending work detected' :
                          toolsInvoked ? 'safety net (tools invoked)' : 'no polling needed'
                });

                // If agent has pending work OR tools were invoked, start polling
                if (shouldPoll && chunk.threadId) {
                  if (hasPendingWork) {
                    console.log('[END] 🔄 Pending work detected - starting polling mechanism');
                  } else if (toolsInvoked) {
                    console.log('[END] 🔄 Safety net: Tools invoked - starting polling to ensure file retrieval');
                  }

                  // Start polling in the background (don't await)
                  pollForCompletion(chunk.threadId, artifacts.length).catch(error => {
                    console.error('[END] ❌ Polling failed:', error);
                  });
                } else if (!shouldPoll) {
                  console.log('[END] ✅ No pending work detected - agent completed all tasks');
                } else {
                  console.log('[END] ⚠️ No thread ID available for polling');
                }
              }
              return []; // Clear streaming chunks
            });
          }
        },
        seenMessageIdsRef.current
      );
    } catch (error) {
      const errorMessage: Message = {
        role: 'system',
        content: `Connection error: ${error instanceof Error ? error.message : 'Failed to communicate with agent'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2.3: POLLING FUNCTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Helper function to get run status from LangSmith /runs endpoint
   * Returns: 'pending', 'running', 'success', 'error', or 'unknown'
   * This is the RELIABLE way to detect when agent is truly complete
   */
  async function getRunStatus(threadId: string): Promise<string> {
    try {
      const response = await fetch('/api/agents/talent-demand/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId }),
      });

      if (!response.ok) {
        console.error('[getRunStatus] API error:', response.status);
        return 'unknown';
      }

      const { latestRun } = await response.json();
      return latestRun?.status || 'unknown';
    } catch (error) {
      console.error('[getRunStatus] Error:', error);
      return 'unknown';
    }
  }

  /**
   * Poll Thread State API for completion
   * Called when stream ends with pending work detected
   *
   * FIX APPLIED: Use /runs endpoint status for reliable completion detection
   * - Previous check used write_todos which this agent doesn't use
   * - Now checks status === 'success' from /runs endpoint
   */
  async function pollForCompletion(
    threadId: string,
    currentArtifactCount: number,
    maxAttempts: number = 50
  ): Promise<void> {
    console.log('[Polling] 🔄 Starting polling for completion', {
      threadId,
      currentArtifactCount,
      maxAttempts
    });

    setIsPollingForCompletion(true);

    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    let totalWaitTime = 0;
    let allFilesCollected: { filePath: string; content: string; fileName: string }[] = [];

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Exponential backoff capped at 30s
      const waitTime = Math.min(5000 + (attempt * 5000), 30000);

      try {
        // Wait before polling (except first attempt)
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          totalWaitTime += waitTime;
        }

        // Get run status FIRST - this is the reliable completion signal
        const runStatus = await getRunStatus(threadId);
        const isRunComplete = runStatus === 'success' || runStatus === 'error';

        setPollingMessage(
          `Agent is ${runStatus === 'running' ? 'still working' : runStatus}... (${Math.floor(totalWaitTime / 1000)}s elapsed)`
        );

        console.log(`[Polling] Attempt ${attempt + 1}/${maxAttempts} | Run status: ${runStatus} | Waited: ${Math.floor(totalWaitTime / 1000)}s`);

        // Call Thread State API to get files
        const response = await fetch('/api/agents/talent-demand/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId }),
        });

        if (!response.ok) {
          console.error('[Polling] ❌ State API error:', response.status);
          consecutiveErrors++;
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error('[Polling] ❌ Max consecutive errors reached, stopping polling');
            break;
          }
          continue;
        }

        // Reset error counter on success
        consecutiveErrors = 0;

        const { toolOutputs, files, messageCount } = await response.json();

        console.log('[Polling] 📊 State retrieved:', {
          fileCount: files?.length || 0,
          toolOutputCount: toolOutputs?.length || 0,
          messageCount,
          runStatus
        });

        // Check for new files
        const newFiles = (files || []).filter((file: any) => {
          return !artifacts.some(a => a.fileName === file.fileName) &&
                 !allFilesCollected.some(f => f.fileName === file.fileName);
        });

        if (newFiles.length > 0) {
          console.log(`[Polling] 📄 Found ${newFiles.length} new file(s)!`);

          // Accumulate files
          allFilesCollected = [...allFilesCollected, ...newFiles];

          // Add new files to artifacts
          setArtifacts(prev => {
            const updated = [...prev];
            for (const file of newFiles) {
              if (!updated.some(a => a.fileName === file.fileName)) {
                updated.push({
                  filePath: file.filePath,
                  content: file.content,
                  fileName: file.fileName
                });
                console.log('[Polling] ➕ Added new file:', file.fileName);
              }
            }
            return updated;
          });

          setPollingMessage(`✅ Found ${allFilesCollected.length} file(s) total. ${isRunComplete ? 'Complete!' : 'Checking for more...'}`);
        }

        // Display tool outputs as tool_result chunks
        if (toolOutputs && toolOutputs.length > 0) {
          console.log(`[Polling] 📊 Found ${toolOutputs.length} tool output(s) - adding to display`);
          for (const output of toolOutputs) {
            const toolUseId = output.toolUseId || `poll_${Date.now()}_${Math.random()}`;

            // Skip if we've already seen this tool result
            if (seenToolCallIdsRef.current.has(toolUseId)) {
              console.log('[Polling] ⏭️ Skipping duplicate tool output:', toolUseId);
              continue;
            }
            seenToolCallIdsRef.current.add(toolUseId);

            console.log('[Polling] 📊 Adding tool output to display:', {
              toolUseId,
              toolName: output.toolName,
              outputLength: typeof output.output === 'string' ? output.output.length : 'object'
            });

            // Add as tool_result chunk for display
            const newChunk: DisplayChunk = {
              id: `tool_result_${toolUseId}`,
              type: 'tool_result',
              toolCallId: toolUseId,
              toolResult: output.output,
              timestamp: Date.now()
            };
            setStreamingChunks(prev => [...prev, newChunk]);

            // FIX #2: Also update the saved message chunks
            updateMessageChunks(newChunk);
          }
        }

        // EXIT CONDITION: Run is complete (success or error)
        // Only stop when LangSmith says the run is TRULY done
        if (isRunComplete) {
          console.log(`[Polling] ✅ Run status is "${runStatus}" - LangSmith agent is done`);

          // Do one final fetch to ensure we have all files
          if (runStatus === 'success') {
            const finalResponse = await fetch('/api/agents/talent-demand/state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ threadId }),
            });

            if (finalResponse.ok) {
              const { toolOutputs: finalToolOutputs, files: finalFiles } = await finalResponse.json();

              // Add any final tool outputs
              if (finalToolOutputs && finalToolOutputs.length > 0) {
                console.log(`[Polling] 📊 Final fetch found ${finalToolOutputs.length} tool output(s)`);
                for (const output of finalToolOutputs) {
                  const toolUseId = output.toolUseId || `final_${Date.now()}_${Math.random()}`;
                  if (!seenToolCallIdsRef.current.has(toolUseId)) {
                    seenToolCallIdsRef.current.add(toolUseId);
                    const finalChunk: DisplayChunk = {
                      id: `tool_result_${toolUseId}`,
                      type: 'tool_result',
                      toolCallId: toolUseId,
                      toolResult: output.output,
                      timestamp: Date.now()
                    };
                    setStreamingChunks(prev => [...prev, finalChunk]);

                    // FIX #2: Also update the saved message chunks
                    updateMessageChunks(finalChunk);
                  }
                }
              }

              const additionalFiles = (finalFiles || []).filter((file: any) => {
                return !artifacts.some(a => a.fileName === file.fileName) &&
                       !allFilesCollected.some(f => f.fileName === file.fileName);
              });

              if (additionalFiles.length > 0) {
                console.log(`[Polling] 📄 Final fetch found ${additionalFiles.length} more file(s)`);
                setArtifacts(prev => {
                  const updated = [...prev];
                  for (const file of additionalFiles) {
                    if (!updated.some(a => a.fileName === file.fileName)) {
                      updated.push({
                        filePath: file.filePath,
                        content: file.content,
                        fileName: file.fileName
                      });
                    }
                  }
                  return updated;
                });
              }
            }
          }

          const totalFiles = allFilesCollected.length;
          setPollingMessage(`✅ Complete! Retrieved ${totalFiles} file(s).`);

          // ═══════════════════════════════════════════════════════════════
          // FIX #3: FINAL STATE SYNC ON POLLING SUCCESS
          // Sync all current streamingChunks to the saved message
          // This ensures the message history has all tool_results collected during polling
          // ═══════════════════════════════════════════════════════════════
          const messageId = currentAgentMessageIdRef.current;
          if (messageId) {
            console.log('[Polling] 🔄 Final state sync - updating saved message with all chunks');
            setMessages(prev => prev.map(msg => {
              if (msg.id === messageId) {
                // Get current streaming chunks for final sync
                // Note: We use a callback to access latest streamingChunks state
                return msg; // Will be updated below with fresh state
              }
              return msg;
            }));

            // Use a separate state update to ensure we get latest streamingChunks
            setMessages(prev => {
              const updatedMessages = [...prev];
              const msgIndex = updatedMessages.findIndex(m => m.id === messageId);
              if (msgIndex !== -1) {
                const existingChunks = updatedMessages[msgIndex].chunks || [];
                const existingIds = new Set(existingChunks.map(c => c.id));

                // Get fresh chunks from streamingChunks ref
                // Filter to only add chunks that don't already exist
                const newChunks = streamingChunks.filter(c => !existingIds.has(c.id));

                if (newChunks.length > 0) {
                  console.log(`[Polling] 📝 Final sync: Adding ${newChunks.length} new chunks to message`);
                  updatedMessages[msgIndex] = {
                    ...updatedMessages[msgIndex],
                    chunks: [...existingChunks, ...newChunks]
                  };
                } else {
                  console.log('[Polling] ✅ Final sync: Message already has all chunks');
                }
              }
              return updatedMessages;
            });
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
          setPollingMessage('');
          setIsPollingForCompletion(false);
          return;
        }

        // Continue polling - run not yet complete
        console.log(`[Polling] ⏳ Run status: ${runStatus} - continuing to poll...`);

      } catch (error) {
        console.error('[Polling] ❌ Error during polling:', error);
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('[Polling] ❌ Max consecutive errors reached, stopping polling');
          break;
        }
      }
    }

    // Polling ended without completion
    console.log('[Polling] ⏱️ Polling ended after max attempts');
    setPollingMessage('⚠️ Polling timeout - use manual refresh if files are still missing');
    setIsPollingForCompletion(false);
  }

  // ═══════════════════════════════════════════════════════════════
  // FIX #2: HELPER TO UPDATE SAVED MESSAGE CHUNKS
  // Called when polling discovers new tool_results after message was saved
  // ═══════════════════════════════════════════════════════════════
  function updateMessageChunks(newChunk: DisplayChunk) {
    const messageId = currentAgentMessageIdRef.current;
    if (!messageId) {
      console.log('[Message Update] ⚠️ No message ID to update');
      return;
    }

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingIds = new Set(msg.chunks?.map(c => c.id) || []);
        if (existingIds.has(newChunk.id)) {
          console.log(`[Message Update] ⏭️ Chunk ${newChunk.id} already exists in message`);
          return msg;
        }
        console.log(`[Message Update] ➕ Adding chunk ${newChunk.id} to message ${messageId}`);
        return {
          ...msg,
          chunks: [...(msg.chunks || []), newChunk]
        };
      }
      return msg;
    }));
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2.4: MANUAL REFRESH FUNCTION
  // ═══════════════════════════════════════════════════════════════

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Download artifact handler
  function downloadArtifact(artifact: Artifact) {
    const blob = new Blob([artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - V2 Purple Gradient */}
      <header className="bg-gradient-to-r from-[#4A148C] to-[#6A1B9A] border-b border-[#4A148C]/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="https://hub.skillbridgetalent.ai"
                className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Hub
              </Link>
              <div className="h-6 w-px bg-white/20"></div>
              <img
                src="/images/sbtlogotransparentwhite.png"
                alt="Skill Bridge Talent"
                className="h-8 w-auto"
              />
              <div className="h-6 w-px bg-white/20"></div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/80 font-semibold">
                  Skill Bridge Talent
                </p>
                <h1 className="text-lg font-bold text-white -mt-0.5">
                  Talent Demand Analyst
                </h1>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4">
              {/* Files ready indicator */}
              {artifacts.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-white bg-white/20 px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{artifacts.length} file{artifacts.length > 1 ? 's' : ''} ready</span>
                </div>
              )}

              {/* Multi-turn active */}
              {conversationStarted && !isProcessing && (
                <div className="flex items-center gap-2 text-xs text-white bg-white/20 px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Multi-turn active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Render saved messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-5 py-4 break-words ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : message.role === 'system'
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                } ${message.role === 'agent' && message.chunks ? 'w-full' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold">
                    {message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'Talent Analyst'}
                  </span>
                </div>
                
                {/* FIXED: If agent message has chunks, render with cards */}
                {message.role === 'agent' && message.chunks && message.chunks.length > 0 ? (
                  <div>
                    {/* DEBUG: Log chunk rendering */}
                    {(() => {
                      const types = message.chunks.reduce((acc, c) => {
                        acc[c.type] = (acc[c.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);
                      console.log('[RENDER] 🎨 Rendering message with chunks:', types);
                      return null;
                    })()}
                    {message.chunks.map((chunk) => {
                      switch (chunk.type) {
                        case 'tool_use':
                          return <AgentMissionCard key={chunk.id} chunk={chunk} />;
                        case 'tool_result':
                          console.log('[RENDER] 🟢 Rendering tool_result chunk:', chunk.id, 'content length:', typeof chunk.toolResult === 'string' ? chunk.toolResult.length : 'object');
                          return <AgentFindingsCard key={chunk.id} chunk={chunk} />;
                        case 'agent_question':
                          return <AgentCoordinationCard key={chunk.id} chunk={chunk} />;
                        case 'message':
                          return <MessageBlock key={chunk.id} chunk={chunk} />;
                        default:
                          return null;
                      }
                    })}
                  </div>
                ) : (
                  <div className={`prose prose-sm max-w-none 
                    prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5
                    prose-li:my-1 ${
                    message.role === 'user' ? 'prose-invert' : ''
                  }`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Render streaming chunks with typed components */}
          {streamingChunks.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-3xl rounded-lg px-5 py-4 bg-white border border-purple-200 text-gray-900 shadow-sm w-full">
                {/* Header with animated dots */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold">Talent Analyst</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
                
                {/* Render each chunk by type */}
                {streamingChunks.map((chunk) => {
                  switch (chunk.type) {
                    case 'tool_use':
                      return <AgentMissionCard key={chunk.id} chunk={chunk} />;
                    case 'tool_result':
                      return <AgentFindingsCard key={chunk.id} chunk={chunk} />;
                    case 'agent_question':
                      return <AgentCoordinationCard key={chunk.id} chunk={chunk} />;
                    case 'message':
                      return <MessageBlock key={chunk.id} chunk={chunk} />;
                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          )}

          {/* Artifacts Download Section */}
          {artifacts.length > 0 && !isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-3xl w-full">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📁</span>
                      <span className="text-sm font-semibold text-amber-800">Generated Reports</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {artifacts.map((artifact, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{artifact.fileName}</div>
                            <div className="text-xs text-gray-500">{(artifact.content.length / 1024).toFixed(1)} KB</div>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadArtifact(artifact)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Working Indicator */}
        {(isProcessing || isPollingForCompletion) && (
          <div className="sticky bottom-4 flex justify-center">
            <div className="bg-white border border-purple-200 shadow-lg rounded-full px-4 py-2.5 flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-sm font-medium text-purple-700">Working</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about talent demand trends, skills requirements, workforce planning..."
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isProcessing}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {(isProcessing || isPollingForCompletion) ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing
                </span>
              ) : (
                'Send'
              )}
            </button>
          </div>

          {/* Example Queries */}
          {messages.length === 1 && !isProcessing && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'What skills are most in demand for AI engineers?',
                  'Analyze workforce trends in cybersecurity',
                  'What are the talent demand drivers in fintech?',
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(example)}
                    className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-100 hover:border-gray-300 transition-colors text-gray-700"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
