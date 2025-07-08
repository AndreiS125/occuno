'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Brain, 
  Zap, 
  ChevronDown, 
  ChevronRight,
  ChevronUp,
  Wrench,
  MessageCircle,
  Clock,
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
  History,
  Plus,
  Trash2,
  Archive,
  Search,
  Target,
  Calendar,
  Save,
  Sparkles,
  Database,
  List,
  Move,
  Edit,
  X
} from 'lucide-react';

// Inline Badge component
const Badge = ({ children, variant = 'default', className = '', ...props }: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  [key: string]: any;
}) => {
  const variantClasses = {
    default: "border-transparent bg-blue-500 text-white hover:bg-blue-600",
    secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
    outline: "text-gray-900 border-gray-300 bg-transparent hover:bg-gray-50",
  };

  return (
    <div 
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Inline ScrollArea component
const ScrollArea = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; [key: string]: any }>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-auto ${className}`}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e0 #f7fafc' }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';

// Inline Tabs components
const Tabs = ({ defaultValue, children, className = '', ...props }: {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className={`w-full ${className}`} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, className = '', activeTab, setActiveTab, ...props }: {
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
  [key: string]: any;
}) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className}`} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({ value, children, className = '', activeTab, setActiveTab, ...props }: {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
  [key: string]: any;
}) => {
  const isActive = activeTab === value;
  
  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
      onClick={() => setActiveTab?.(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, className = '', activeTab, ...props }: {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  [key: string]: any;
}) => {
  if (activeTab !== value) return null;
  
  return (
    <div className={`mt-2 ${className}`} {...props}>
      {children}
    </div>
  );
};

interface StreamingEvent {
  type: string;
  timestamp: string;
  execution_id: string;
  agent?: string;
  content?: string;
  thinking_id?: string;
  tool_name?: string;
  tool_id?: string;
  tool_args?: Record<string, any>;
  tool_call_id?: string;
  tool_result_id?: string;
  result?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  response?: string;
  thread_id?: string;
  user_input?: string;
  error?: string;
  [key: string]: any;
}

interface ThinkingEvent {
  type: 'thinking';
  agent: 'planning' | 'executor';
  content: string;
  thinking_id: string;
  timestamp: string;
}

interface ToolCallEvent {
  type: 'tool_call';
  agent: 'planning' | 'executor';
  tool_name: string;
  tool_id: string;
  tool_args: Record<string, any>;
  tool_call_id: string;
  timestamp: string;
}

interface ToolResultEvent {
  type: 'tool_result';
  agent: 'planning' | 'executor';
  tool_name: string;
  tool_call_id: string;
  result: string;
  tool_result_id: string;
  timestamp: string;
}

interface TokenUsageEvent {
  type: 'token_usage';
  agent: 'planning' | 'executor';
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  timestamp: string;
}

interface AgentResponseEvent {
  type: 'agent_response';
  agent: 'planning' | 'executor';
  content: string;
  timestamp: string;
}

interface ExecutionData {
  id: string;
  userMessage: string;
  finalResponse?: string;
  isComplete: boolean;
  isError: boolean;
  startTime: string;
  endTime?: string;
  threadId?: string;
  
  // Organized events (kept for compatibility)
  thoughts: ThinkingEvent[];
  toolCalls: ToolCallEvent[];
  toolResults: ToolResultEvent[];
  tokenUsage: TokenUsageEvent[];
  agentResponses: AgentResponseEvent[];
  
  // Chronological events for proper ordering
  chronologicalEvents: Array<ThinkingEvent | ToolCallEvent | ToolResultEvent | TokenUsageEvent | AgentResponseEvent>;
  
  // Metrics
  totalTokens: number;
  totalCost: number;
  executionTime?: number;
  
  // Status
  currentAgent?: 'planning' | 'executor' | 'system';
  currentPhase?: string;
}

interface ConversationThread {
  id: string;
  title: string;
  lastMessage: string;
  lastUpdated: string;
  messageCount: number;
  isActive: boolean;
}

interface EnhancedToolCallEvent extends ToolCallEvent {
  tool_results?: ToolResultEvent[];
}

// Tool display configuration
const TOOL_DISPLAY_CONFIG: Record<string, { name: string; icon: React.ElementType; color: string; formatter?: (args: any) => string }> = {
  // Planning tools
  retrieve_objective_by_id: {
    name: "Get Objective Details",
    icon: Target,
    color: "text-blue-600 bg-blue-50",
    formatter: (args) => `Looking up objective: ${args.objective_id?.slice(0, 8)}...`
  },
  retrieve_objective_by_name: {
    name: "Search Objectives",
    icon: Search,
    color: "text-purple-600 bg-purple-50",
    formatter: (args) => `Searching for: "${args.name}"`
  },
  retrieve_full_objective_tree: {
    name: "Get Objective Hierarchy",
    icon: List,
    color: "text-green-600 bg-green-50",
    formatter: (args) => `Loading full hierarchy from objective ${args.objective_id?.slice(0, 8)}...`
  },
  retrieve_objectives_by_time_period: {
    name: "Check Schedule",
    icon: Calendar,
    color: "text-indigo-600 bg-indigo-50",
    formatter: (args) => {
      const start = new Date(args.start_date).toLocaleDateString();
      const end = new Date(args.end_date).toLocaleDateString();
      return `Checking schedule from ${start} to ${end}`;
    }
  },
  retrieve_all_objectives: {
    name: "Get All Objectives",
    icon: Database,
    color: "text-cyan-600 bg-cyan-50",
    formatter: () => "Loading all objectives..."
  },
  save_user_memory: {
    name: "Save Memory",
    icon: Save,
    color: "text-amber-600 bg-amber-50",
    formatter: (args) => `Remembering: "${args.memory_text?.slice(0, 50)}..."`
  },
  
  // Executor tools
  create_objective: {
    name: "Create Objective",
    icon: Plus,
    color: "text-emerald-600 bg-emerald-50",
    formatter: (args) => {
      const data = JSON.parse(args.objective_data || '{}');
      return `Creating: "${data.title}"`;
    }
  },
  update_objective: {
    name: "Update Objective",
    icon: Edit,
    color: "text-orange-600 bg-orange-50",
    formatter: (args) => `Updating objective ${args.objective_id?.slice(0, 8)}...`
  },
  delete_objective: {
    name: "Delete Objective",
    icon: Trash2,
    color: "text-red-600 bg-red-50",
    formatter: (args) => `Deleting objective ${args.objective_id?.slice(0, 8)}...`
  },
  move_objective_parent: {
    name: "Move Objective",
    icon: Move,
    color: "text-teal-600 bg-teal-50",
    formatter: (args) => `Moving objective to ${args.new_parent_id ? 'new parent' : 'root level'}`
  },
  get_gamification_stats: {
    name: "Check Stats",
    icon: Activity,
    color: "text-pink-600 bg-pink-50",
    formatter: () => "Checking user statistics..."
  },
  update_gamification_stats: {
    name: "Update Stats",
    icon: Sparkles,
    color: "text-violet-600 bg-violet-50",
    formatter: (args) => `Updating ${args.stat_type} by ${args.value}`
  },
  plan: {
    name: "Create Plan",
    icon: Brain,
    color: "text-slate-600 bg-slate-50",
    formatter: () => "Creating execution plan..."
  },
  final_response: {
    name: "Planning Complete",
    icon: CheckCircle,
    color: "text-green-600 bg-green-50",
    formatter: () => "Planning analysis complete"
  },
  final_response_to_user: {
    name: "Task Complete",
    icon: CheckCircle,
    color: "text-blue-600 bg-blue-50",
    formatter: () => "Finalizing response..."
  }
};

const ChatPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [showExecutionDetails, setShowExecutionDetails] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [conversationThreads, setConversationThreads] = useState<ConversationThread[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll to bottom when new content arrives (but only if user is already at bottom)
  useEffect(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      // Only auto-scroll if user is already near the bottom
      if (isAtBottom) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }
  }, [executions]);

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
  }, []);

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const loadConversationHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      console.log('🔄 Loading conversation threads from backend...');
      
      const response = await fetch('http://localhost:8000/api/v1/agent/conversations');
      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📚 Loaded conversations data:', data);
      
      if (data.success && data.threads) {
        const threads: ConversationThread[] = data.threads.map((thread: any) => ({
          id: thread.id,
          title: thread.title,
          lastMessage: thread.latest_message || 'No messages',
          lastUpdated: thread.last_updated,
          messageCount: thread.message_count,
          isActive: false
        }));
        
        setConversationThreads(threads);
        console.log(`✅ Loaded ${threads.length} conversation threads`);
      } else {
        console.log('📭 No conversation threads found');
        setConversationThreads([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading conversation history:', error);
      setConversationThreads([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setCurrentThreadId(null);
    setExecutions([]);
    setShowExecutionDetails({});
    setExpandedItems({});
    
    // Update threads to mark all as inactive
    setConversationThreads(prev => prev.map(thread => ({
      ...thread,
      isActive: false
    })));
  }, []);

  const switchToThread = useCallback(async (threadId: string) => {
    setCurrentThreadId(threadId);
    
    // Mark thread as active
    setConversationThreads(prev => prev.map(thread => ({
      ...thread,
      isActive: thread.id === threadId
    })));
    
    // Load thread history from backend
    try {
      console.log(`🔄 Loading conversation history for thread: ${threadId}`);
      
      const response = await fetch(`http://localhost:8000/api/v1/agent/conversation/${threadId}`);
      if (!response.ok) {
        throw new Error(`Failed to load conversation: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📚 Loaded conversation data:', data);
      
      // Transform backend conversation history to frontend execution format
      const loadedExecutions = await transformConversationToExecutions(data);
      
      // Set the loaded executions
      setExecutions(loadedExecutions);
      setShowExecutionDetails({});
      setExpandedItems({});
      
      console.log(`✅ Loaded ${loadedExecutions.length} exchanges from conversation history`);
      
    } catch (error) {
      console.error('❌ Error loading thread history:', error);
      // Fallback to clearing executions if loading fails
      setExecutions([]);
      setShowExecutionDetails({});
      setExpandedItems({});
    }
  }, []);

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      // This would call the backend API to delete the thread
      setConversationThreads(prev => prev.filter(thread => thread.id !== threadId));
      
      // If deleting current thread, start new conversation
      if (currentThreadId === threadId) {
        startNewConversation();
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  }, [currentThreadId, startNewConversation]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isStreaming) return;

    const executionId = `exec_${Date.now()}`;
    const newExecution: ExecutionData = {
      id: executionId,
      userMessage: message.trim(),
      isComplete: false,
      isError: false,
      startTime: new Date().toISOString(),
      thoughts: [],
      toolCalls: [],
      toolResults: [],
      tokenUsage: [],
      agentResponses: [],
      chronologicalEvents: [],
      totalTokens: 0,
      totalCost: 0
    };

    setExecutions(prev => [...prev, newExecution]);
    setMessage('');
    setIsStreaming(true);
    setShowExecutionDetails(prev => ({ ...prev, [executionId]: true }));

    try {
      // Create streaming request
      const response = await fetch('http://localhost:8000/api/v1/agent/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newExecution.userMessage,
          thread_id: currentThreadId,
          include_thoughts: true,
          include_tool_details: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error Response:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      console.log('✅ SSE connection established, response headers:', response.headers);
      console.log('Response status:', response.status);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const eventData = line.slice(6);
            if (eventData.trim()) {
              try {
                const event: StreamingEvent = JSON.parse(eventData);
                console.log('📡 Received SSE event:', event.type, event);
                updateExecutionWithEvent(executionId, event);
              } catch (e) {
                console.error('Error parsing event:', e);
                console.error('Raw event data:', eventData);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streaming:', error);
      setExecutions(prev => prev.map(exec => 
        exec.id === executionId 
          ? { ...exec, isError: true, isComplete: true, endTime: new Date().toISOString() }
          : exec
      ));
    } finally {
      setIsStreaming(false);
    }
  }, [message, currentThreadId, isStreaming]);

  const updateExecutionWithEvent = useCallback((executionId: string, event: StreamingEvent) => {
    setExecutions(prev => prev.map(exec => {
      if (exec.id !== executionId) return exec;

      const updated = { ...exec };

      switch (event.type) {
        case 'execution_start':
          updated.currentPhase = 'Starting';
          break;

        case 'initialization':
          updated.currentPhase = 'Initializing';
          if (event.thread_id) {
            updated.threadId = event.thread_id;
            if (!currentThreadId) {
              setCurrentThreadId(event.thread_id);
              
              // Update conversation threads to include this new thread
              setConversationThreads(prev => {
                const existingThread = prev.find(t => t.id === event.thread_id);
                if (existingThread) {
                  return prev.map(t => ({
                    ...t,
                    isActive: t.id === event.thread_id,
                    lastUpdated: new Date().toISOString()
                  }));
                } else if (event.thread_id) {
                  return [...prev, {
                    id: event.thread_id,
                    title: exec.userMessage.slice(0, 50) + '...',
                    lastMessage: exec.userMessage,
                    lastUpdated: new Date().toISOString(),
                    messageCount: 1,
                    isActive: true
                  }];
                } else {
                  return prev;
                }
              });
            }
          }
          break;

        case 'node_start':
          updated.currentAgent = event.agent as 'planning' | 'executor' | 'system';
          updated.currentPhase = `${event.agent} Agent - ${event.node}`;
          break;

        case 'thinking':
          if (event.agent && event.content && event.thinking_id) {
            // Check if this thinking event already exists to prevent duplicates
            const existingThought = updated.thoughts.find(t => t.thinking_id === event.thinking_id);
            if (!existingThought) {
              console.log('💭 Adding thinking event:', event.agent, event.content.slice(0, 100));
              const thinkingEvent = {
                type: 'thinking' as const,
                agent: event.agent as 'planning' | 'executor',
                content: event.content,
                thinking_id: event.thinking_id,
                timestamp: event.timestamp
              };
              updated.thoughts.push(thinkingEvent);
              updated.chronologicalEvents.push(thinkingEvent);
              updated.currentPhase = `${event.agent} Agent - Thinking`;
            } else {
              console.log('⚠️ Duplicate thinking event prevented:', event.thinking_id);
            }
          }
          break;

        case 'agent_response':
          if (event.agent && event.content) {
            // Don't add final responses to agent responses (they should be the main response)
            const isFinalResponse = event.content.includes('final_response_to_user') || 
                                  event.content.includes('Task completed successfully') ||
                                  event.content.startsWith('Great!') ||
                                  event.content.startsWith('Perfect!') ||
                                  event.content.includes('I\'ve set up') ||
                                  event.content.includes('I\'ve created');
            if (!isFinalResponse) {
              // Check for duplicates
              const existingResponse = updated.agentResponses.find(ar => 
                ar.agent === event.agent && ar.content === event.content
              );
              if (!existingResponse) {
                console.log('💬 Adding agent response:', event.agent, event.content.slice(0, 100));
                const agentResponseEvent = {
                  type: 'agent_response' as const,
                  agent: event.agent as 'planning' | 'executor',
                  content: event.content,
                  timestamp: event.timestamp
                };
                updated.agentResponses.push(agentResponseEvent);
                updated.chronologicalEvents.push(agentResponseEvent);
                updated.currentPhase = `${event.agent} Agent - Responding`;
              } else {
                console.log('⚠️ Duplicate agent response prevented');
              }
                          } else {
                console.log('🚫 Skipped agent response (is final response):', event.content.slice(0, 100));
              }
          }
          break;

        case 'tool_call':
          if (event.agent && event.tool_name && event.tool_id && event.tool_call_id) {
            // Check if this tool call already exists to prevent duplicates
            const existingToolCall = updated.toolCalls.find(tc => tc.tool_call_id === event.tool_call_id);
            if (!existingToolCall) {
              console.log('🔧 Adding tool call:', event.agent, event.tool_name, event.tool_call_id);
              const toolCallEvent = {
                type: 'tool_call' as const,
                agent: event.agent as 'planning' | 'executor',
                tool_name: event.tool_name,
                tool_id: event.tool_id,
                tool_args: event.tool_args || {},
                tool_call_id: event.tool_call_id,
                timestamp: event.timestamp
              };
              updated.toolCalls.push(toolCallEvent);
              updated.chronologicalEvents.push(toolCallEvent);
              updated.currentPhase = `${event.agent} Agent - Tool: ${event.tool_name}`;
            } else {
              console.log('⚠️ Duplicate tool call prevented:', event.tool_call_id);
            }
          }
          break;

        case 'tool_result':
          if (event.agent && event.tool_name && event.tool_call_id && event.result && event.tool_result_id) {
            // Check if this tool result already exists to prevent duplicates
            const existingResult = updated.toolResults.find(tr => tr.tool_result_id === event.tool_result_id);
            if (!existingResult) {
              const toolResultEvent = {
                type: 'tool_result' as const,
                agent: event.agent as 'planning' | 'executor',
                tool_name: event.tool_name,
                tool_call_id: event.tool_call_id,
                result: event.result,
                tool_result_id: event.tool_result_id,
                timestamp: event.timestamp
              };
              updated.toolResults.push(toolResultEvent);
              updated.chronologicalEvents.push(toolResultEvent);
            }
          }
          break;

        case 'token_usage':
          if (event.agent && typeof event.input_tokens === 'number' && typeof event.output_tokens === 'number' && typeof event.total_tokens === 'number') {
            const tokenUsageEvent = {
              type: 'token_usage' as const,
              agent: event.agent as 'planning' | 'executor',
              input_tokens: event.input_tokens,
              output_tokens: event.output_tokens,
              total_tokens: event.total_tokens,
              timestamp: event.timestamp
            };
            updated.tokenUsage.push(tokenUsageEvent);
            updated.chronologicalEvents.push(tokenUsageEvent);
            updated.totalTokens += event.total_tokens;
            // Calculate cost for Gemini 2.5 Flash
            const inputCost = (event.input_tokens / 1_000_000) * 0.30;
            const outputCost = (event.output_tokens / 1_000_000) * 2.50;
            updated.totalCost += inputCost + outputCost;
          }
          break;

        case 'final_response':
          // Only update if we don't already have a final response, or if this one is not generic
          if (!updated.finalResponse || 
              updated.finalResponse.includes('Task completed successfully') ||
              (event.response && !event.response.includes('Task completed successfully'))) {
            updated.finalResponse = event.response;
            updated.currentPhase = 'Complete';
            console.log('✅ Set final response:', event.response?.slice(0, 100));
          }
          break;

        case 'execution_complete':
          updated.isComplete = true;
          updated.endTime = new Date().toISOString();
          updated.executionTime = new Date(updated.endTime).getTime() - new Date(updated.startTime).getTime();
          updated.currentPhase = 'Complete';
          
          // Update conversation thread with final response
          if (updated.threadId) {
            setConversationThreads(prev => prev.map(thread => 
              thread.id === updated.threadId 
                ? {
                    ...thread,
                    lastMessage: updated.finalResponse || updated.userMessage,
                    lastUpdated: new Date().toISOString(),
                    messageCount: thread.messageCount + 1
                  }
                : thread
            ));
          }
          break;

        case 'execution_error':
          updated.isError = true;
          updated.isComplete = true;
          updated.endTime = new Date().toISOString();
          updated.currentPhase = 'Error';
          break;
      }

      return updated;
    }));
  }, [currentThreadId]);

  const toggleExecutionDetails = (executionId: string) => {
    setShowExecutionDetails(prev => ({
      ...prev,
      [executionId]: !prev[executionId]
    }));
  };

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatCost = (cost: number) => {
    return cost >= 0.001 ? `$${cost.toFixed(4)}` : '< $0.001';
  };

  const transformConversationToExecutions = async (conversationData: any): Promise<ExecutionData[]> => {
    console.log('🔍 Transforming conversation data:', conversationData);
    
    if (!conversationData.success || !conversationData.conversation_history) {
      console.warn('⚠️ Conversation data not successful or missing history:', conversationData);
      return [];
    }

    const exchanges = conversationData.conversation_history.exchanges || [];
    const threadId = conversationData.thread_id;
    
    if (exchanges.length === 0) {
      console.log('📭 No exchanges found in conversation history');
      return [];
    }

    // Transform each exchange to ExecutionData format
    const executions: ExecutionData[] = exchanges.map((exchange: any, index: number) => {
      const executionId = `history_${exchange.id || index}`;
      
      // Use executor summary as primary response, fallback to planner summary
      const finalResponse = exchange.executor_summary || exchange.planner_summary || 'Task completed successfully.';
      
      const execution: ExecutionData = {
        id: executionId,
        userMessage: exchange.user_message || 'No message',
        finalResponse: finalResponse,
        isComplete: true,
        isError: false,
        startTime: exchange.timestamp || new Date().toISOString(),
        endTime: exchange.timestamp || new Date().toISOString(),
        threadId: threadId,
        
        // Empty arrays for event data (history doesn't include detailed streaming events)
        thoughts: [],
        toolCalls: [],
        toolResults: [],
        tokenUsage: [],
        agentResponses: [],
        chronologicalEvents: [],
        
        // Mock metrics (not available in history)
        totalTokens: 0,
        totalCost: 0,
        executionTime: 0,
        
        // Status
        currentAgent: 'system',
        currentPhase: 'Complete'
      };

      return execution;
    });

    console.log(`✅ Transformed ${executions.length} executions from ${exchanges.length} exchanges`);
    return executions;
  };

  // Helper function to format tool names and arguments
  const formatToolCall = (toolCall: ToolCallEvent) => {
    const config = TOOL_DISPLAY_CONFIG[toolCall.tool_name];
    
    // Enhanced descriptions with more context
    const getEnhancedDescription = (toolName: string, args: any) => {
      switch (toolName) {
        case 'retrieve_objectives_by_time_period':
          const start = new Date(args.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const end = new Date(args.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `Checking schedule from ${start} to ${end}`;
          
        case 'retrieve_objective_by_name':
          return `Searching for: "${args.name}"`;
          
        case 'retrieve_objective_by_id':
          return `Looking up objective ${args.objective_id?.slice(0, 8)}...`;
          
        case 'create_objective':
          try {
            const data = JSON.parse(args.objective_data || '{}');
            return `Creating "${data.title}" (${data.objective_type?.replace(/_/g, ' ') || 'objective'})`;
          } catch {
            return 'Creating new objective...';
          }
          
        case 'update_objective':
          try {
            const updates = JSON.parse(args.updates || '{}');
            const updateTypes = Object.keys(updates).filter(k => k !== 'id').slice(0, 2);
            return `Updating ${args.objective_id?.slice(0, 8)}... (${updateTypes.join(', ')})`;
          } catch {
            return `Updating objective ${args.objective_id?.slice(0, 8)}...`;
          }
          
        case 'delete_objective':
          return `Deleting objective ${args.objective_id?.slice(0, 8)}... (cascading)`;
          
        case 'save_user_memory':
          return `Remembering: "${args.memory_text?.slice(0, 50)}${args.memory_text?.length > 50 ? '...' : ''}"`;
          
        case 'get_gamification_stats':
          return 'Checking your current score and achievements';
          
        case 'update_gamification_stats':
          return `Updating ${args.stat_type}: ${args.value > 0 ? '+' : ''}${args.value}`;
          
        case 'plan':
          const planPreview = args.plan_details ? 
            args.plan_details.substring(0, 100) + '...' : 
            'Formulating strategic execution plan';
          return `Creating execution plan: ${planPreview}`;
          
        case 'final_response':
          const analysisPreview = args.analysis ? 
            args.analysis.substring(0, 80) + '...' : 
            'Completing planning analysis';
          return `Planning analysis: ${analysisPreview}`;
          
        case 'final_response_to_user':
          const responsePreview = args.response_content ? 
            args.response_content.substring(0, 80) + '...' : 
            'Preparing final response';
          return `Final response: ${responsePreview}`;
          
        default:
          return config?.formatter ? config.formatter(args) : 'Executing...';
      }
    };
    
    if (!config) {
      return {
        name: toolCall.tool_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icon: Wrench,
        color: "text-gray-600 bg-gray-50",
        description: getEnhancedDescription(toolCall.tool_name, toolCall.tool_args)
      };
    }
    
    return {
      name: config.name,
      icon: config.icon,
      color: config.color,
      description: getEnhancedDescription(toolCall.tool_name, toolCall.tool_args)
    };
  };

  // Helper function to format tool results in a completely user-friendly way
  const formatToolResult = (result: string, toolName: string, toolArgs?: any): React.ReactNode => {
    try {
      const parsed = JSON.parse(result);
      
      // Custom formatting for each tool type
      switch (toolName) {
        case 'final_response':
          // This is the planning analysis - show it properly
          // Try to get content from both parsed result and tool args
          const analysisFromResult = parsed.analysis_content;
          const summaryFromResult = parsed.summary_content;
          const analysisFromArgs = toolArgs?.analysis;  // Tool argument name is 'analysis'
          const summaryFromArgs = toolArgs?.summary;    // Tool argument name is 'summary'
          
          const finalAnalysis = analysisFromResult || analysisFromArgs;
          const finalSummary = summaryFromResult || summaryFromArgs;
          
          console.log('🔍 FINAL_RESPONSE DEBUG:', {
            analysisFromResult: analysisFromResult ? `${analysisFromResult.length} chars` : 'none',
            summaryFromResult: summaryFromResult ? `${summaryFromResult.length} chars` : 'none', 
            analysisFromArgs: analysisFromArgs ? `${analysisFromArgs.length} chars` : 'none',
            summaryFromArgs: summaryFromArgs ? `${summaryFromArgs.length} chars` : 'none',
            finalAnalysis: finalAnalysis ? `${finalAnalysis.length} chars` : 'none',
            finalSummary: finalSummary ? `${finalSummary.length} chars` : 'none'
          });
          
          if (finalAnalysis || finalSummary) {
    return (
              <div className="bg-blue-50 rounded p-3 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800">🧠 Planning Analysis Complete</p>
                    <p className="text-gray-600 mt-1">Strategic recommendations ready for execution</p>
                  </div>
                </div>
                
                {finalAnalysis && (
                  <div className="bg-white rounded border p-3">
                    <p className="text-xs font-semibold text-gray-800 mb-2">📋 Strategic Analysis</p>
                    <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {finalAnalysis}
                    </div>
                  </div>
                )}
                
                {finalSummary && (
                  <div className="bg-blue-100 rounded p-3">
                    <p className="text-xs font-semibold text-blue-800 mb-2">📝 Summary</p>
                    <p className="text-xs text-blue-700 leading-relaxed whitespace-pre-wrap">{finalSummary}</p>
                  </div>
                )}
              </div>
            );
          }
          return (
            <div className="bg-blue-50 rounded p-3 text-xs">
          <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <p className="font-medium text-blue-800">Planning analysis complete</p>
              </div>
              <p className="text-gray-600 mt-1">Ready to proceed with execution</p>
            </div>
          );
          
        case 'retrieve_objectives_by_time_period':
          const timeRange = parsed.period ? 
            `${new Date(parsed.period.start).toLocaleDateString()} - ${new Date(parsed.period.end).toLocaleDateString()}` : 
            'Selected period';
          
          if (parsed.objectives && Array.isArray(parsed.objectives)) {
            if (parsed.objectives.length === 0) {
              return (
                <div className="bg-gray-50 rounded p-3 text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <p className="font-medium text-gray-700">Schedule Check: {timeRange}</p>
                  </div>
                  <p className="text-gray-500 italic">No objectives found in this time period - schedule is clear!</p>
                </div>
              );
            }
            
            const statusCounts = parsed.objectives.reduce((acc: any, obj: any) => {
              const status = obj.status || 'not_started';
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {});
            
            return (
              <div className="bg-gray-50 rounded p-3 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <p className="font-medium text-gray-800">Schedule: {timeRange}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                    {parsed.objectives.length} objectives
            </span>
          </div>
                
                {/* Status summary */}
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <span key={status} className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      status === 'completed' ? 'bg-green-100 text-green-700' :
                      status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      status === 'blocked' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    )}>
                      {count as number} {status.replace(/_/g, ' ')}
                    </span>
                  ))}
        </div>
        
                {/* Objectives list */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {parsed.objectives.map((obj: any, idx: number) => (
                    <div key={idx} className="bg-white rounded p-2 border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{obj.title || 'Untitled'}</p>
                          {obj.description && (
                            <p className="text-gray-600 mt-0.5 text-xs line-clamp-2">{obj.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {obj.due_date && (
                              <span>📅 {new Date(obj.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            )}
                            {obj.priority_score && (
                              <span>⭐ {Math.round(obj.priority_score * 100)}%</span>
                            )}
                            {obj.objective_type && (
                              <span>🏷️ {obj.objective_type.replace(/_/g, ' ')}</span>
                            )}
            </div>
          </div>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium flex-shrink-0",
                          obj.status === 'completed' ? 'bg-green-100 text-green-700' :
                          obj.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          obj.status === 'blocked' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {obj.status?.replace(/_/g, ' ') || 'not started'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          break;
          
        case 'retrieve_objective_by_id':
        case 'retrieve_objective_by_name':
          const searchQuery = toolName === 'retrieve_objective_by_name' ? 
            parsed.query || 'Unknown search' : 
            `ID: ${parsed.objective_id || 'Unknown'}`;
          
          if (parsed.title || (parsed.matches && parsed.matches.length > 0)) {
            const objectives = parsed.matches || [parsed];
            return (
              <div className="bg-gray-50 rounded p-3 text-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <p className="font-medium text-gray-800">
                    {toolName === 'retrieve_objective_by_name' ? 'Search Results' : 'Objective Details'}
                  </p>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                    {objectives.length} found
                  </span>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {objectives.map((obj: any, idx: number) => (
                    <div key={idx} className="bg-white rounded p-3 border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{obj.title}</p>
                          {obj.description && (
                            <p className="text-gray-600 mt-1 text-xs leading-relaxed">{obj.description}</p>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {obj.objective_type && (
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {obj.objective_type.replace(/_/g, ' ')}
                              </span>
                            )}
                            {obj.priority_score !== undefined && (
                              <span>⭐ {Math.round(obj.priority_score * 100)}% priority</span>
                            )}
                            {obj.complexity_score !== undefined && (
                              <span>🧩 {Math.round(obj.complexity_score * 100)}% complex</span>
                            )}
                          </div>
                          
                          {obj.due_date && (
                            <p className="text-gray-500 mt-1 text-xs">
                              📅 Due: {new Date(obj.due_date).toLocaleDateString('en-US', { 
                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                              })}
                            </p>
                          )}
                          
                          {obj.parent_id && (
                            <p className="text-gray-500 mt-1 text-xs">🔗 Has parent objective</p>
                          )}
                          
                          {obj.children && obj.children.length > 0 && (
                            <p className="text-gray-500 mt-1 text-xs">
                              📋 {obj.children.length} child objective{obj.children.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          obj.status === 'completed' ? 'bg-green-100 text-green-700' :
                          obj.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          obj.status === 'blocked' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {obj.status?.replace(/_/g, ' ') || 'not started'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
      </div>
    );
          } else {
            return (
              <div className="bg-gray-50 rounded p-3 text-xs">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-600" />
                  <p className="font-medium text-gray-700">Search: {searchQuery}</p>
                </div>
                <p className="text-gray-500 mt-1 italic">No objectives found matching the criteria</p>
              </div>
            );
          }
          break;
          
        case 'save_user_memory':
          if (parsed.success && parsed.memory) {
            return (
              <div className="bg-amber-50 rounded p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Save className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">💾 Memory Saved</p>
                    <p className="text-gray-600 mt-1">Added to your personal knowledge base</p>
                  </div>
                </div>
                
                <div className="bg-white rounded border p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💭</span>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium italic leading-relaxed">
                        "{parsed.memory.text}"
                      </p>
                      {parsed.memory.category && (
                        <div className="mt-2">
                          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">
                            {parsed.memory.category}
                          </span>
                        </div>
                      )}
                      <p className="text-gray-500 mt-2 text-xs">
                        🕒 Saved on {new Date().toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else if (parsed.success === false) {
    return (
              <div className="bg-yellow-50 rounded p-3 text-xs">
          <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="font-medium text-yellow-800">Memory not saved</p>
                </div>
                <p className="text-yellow-700 mt-1">
                  {parsed.message || 'This information was already known or not significant enough to store'}
                </p>
              </div>
            );
          }
          break;
          
        case 'create_objective':
          if (parsed.success && parsed.objective) {
            const obj = parsed.objective;
            return (
              <div className="bg-green-50 rounded p-3 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">✨ Created New Objective</p>
                    <p className="text-gray-600 mt-1">Successfully added to your objective system</p>
                  </div>
                </div>
                
                <div className="bg-white rounded border p-3">
                  <h4 className="font-semibold text-gray-800 mb-2">{obj.title}</h4>
                  {obj.description && (
                    <p className="text-gray-700 text-xs leading-relaxed mb-3">{obj.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 font-medium">Type</p>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {obj.objective_type?.replace(/_/g, ' ') || 'objective'}
            </span>
                    </div>
                    
                    {obj.priority_score !== undefined && (
                      <div>
                        <p className="text-gray-500 font-medium">Priority</p>
                        <span className={cn(
                          "px-2 py-1 rounded font-medium",
                          obj.priority_score >= 0.7 ? 'bg-red-100 text-red-700' :
                          obj.priority_score >= 0.4 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {Math.round(obj.priority_score * 100)}% {
                            obj.priority_score >= 0.7 ? 'High' :
                            obj.priority_score >= 0.4 ? 'Medium' : 'Low'
                          }
                        </span>
                      </div>
                    )}
                    
                    {obj.complexity_score !== undefined && (
                      <div>
                        <p className="text-gray-500 font-medium">Complexity</p>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {Math.round(obj.complexity_score * 100)}%
                        </span>
          </div>
                    )}
                    
                    {obj.energy_requirement && (
                      <div>
                        <p className="text-gray-500 font-medium">Energy</p>
                        <span className={cn(
                          "px-2 py-1 rounded",
                          obj.energy_requirement === 'high' ? 'bg-red-100 text-red-700' :
                          obj.energy_requirement === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {obj.energy_requirement}
                        </span>
                      </div>
                    )}
        </div>
        
                  {(obj.due_date || obj.start_date) && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-gray-500 font-medium mb-1">Timeline</p>
                      <div className="flex gap-3 text-xs text-gray-600">
                        {obj.start_date && (
                          <span>📅 Starts: {new Date(obj.start_date).toLocaleDateString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric' 
                          })}</span>
                        )}
                        {obj.due_date && (
                          <span>🎯 Due: {new Date(obj.due_date).toLocaleDateString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric' 
                          })}</span>
                        )}
              </div>
            </div>
                  )}
                  
                  {obj.points_awarded_for_completion && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-yellow-600" />
                        <span className="text-xs text-gray-600">
                          Rewards {obj.points_awarded_for_completion} points upon completion
                        </span>
                </div>
              </div>
            )}
          </div>
              </div>
            );
          } else {
            return (
              <div className="bg-red-50 rounded p-3 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="font-medium text-red-800">Failed to create objective</p>
                </div>
                {parsed.error && (
                  <p className="text-red-700 mt-1">{parsed.error}</p>
        )}
      </div>
    );
          }
          break;
          
        case 'update_objective':
          if (parsed.success && parsed.objective) {
            return (
              <div className="bg-blue-50 rounded p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Edit className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800">📝 Objective Updated</p>
                    <p className="text-gray-600 mt-1">Changes saved successfully</p>
                  </div>
                </div>
                
                <div className="bg-white rounded border p-2">
                  <p className="font-medium text-gray-800">{parsed.objective.title}</p>
                  <p className="text-gray-600 mt-1 text-xs">{parsed.message}</p>
                </div>
              </div>
            );
          }
          break;
          
        case 'delete_objective':
          if (parsed.success) {
    return (
              <div className="bg-red-50 rounded p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Trash2 className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">🗑️ Objective Deleted</p>
                    <p className="text-gray-600 mt-1">
                      {parsed.cascading_delete ? 'Cascading deletion completed' : 'Objective removed'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded border p-2">
                  <p className="text-gray-800 font-medium">{parsed.message}</p>
                  {parsed.deleted_count > 1 && (
                    <div className="mt-2 text-xs">
                      <p className="text-red-700 font-medium">
                        ⚠️ Removed {parsed.deleted_count} total objectives (including children)
                      </p>
                      {parsed.deleted_objectives && parsed.deleted_objectives.length > 0 && (
                        <div className="mt-1 text-gray-600">
                          <p className="font-medium">Deleted objectives:</p>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            {parsed.deleted_objectives.slice(0, 5).map((title: string, idx: number) => (
                              <li key={idx}>{title}</li>
                            ))}
                            {parsed.deleted_objectives.length > 5 && (
                              <li>+ {parsed.deleted_objectives.length - 5} more...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          break;
          
        case 'get_gamification_stats':
          if (parsed.overall_score !== undefined) {
            return (
              <div className="bg-purple-50 rounded p-3 text-xs space-y-3">
          <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <p className="font-medium text-purple-800">📊 Your Progress</p>
                </div>
                
                <div className="bg-white rounded border p-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-1">
                        <span className="text-purple-700 font-bold text-sm">{parsed.overall_score}</span>
                      </div>
                      <p className="text-gray-600 font-medium">Total Score</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-1">
                        <span className="text-orange-700 font-bold text-sm">{parsed.current_streak_days}</span>
                      </div>
                      <p className="text-gray-600 font-medium">Day Streak</p>
                    </div>
                  </div>
                  
                  {parsed.achievements && parsed.achievements.length > 0 && (
                    <div className="mt-3 pt-3 border-t text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-3 h-3 text-yellow-600" />
                        <span className="text-gray-700 font-medium">
                          {parsed.achievements.length} achievement{parsed.achievements.length > 1 ? 's' : ''} unlocked
            </span>
          </div>
        </div>
                  )}
                </div>
              </div>
            );
          }
          break;
          
        case 'update_gamification_stats':
          if (parsed.success) {
            const isPoints = parsed.points_added !== undefined;
            const isStreak = parsed.new_streak !== undefined;
            
            return (
              <div className="bg-emerald-50 rounded p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-800">
                      {isPoints ? '🎉 Points Awarded!' : isStreak ? '🔥 Streak Updated!' : '📊 Stats Updated!'}
                    </p>
                    <p className="text-gray-600 mt-1">Your progress has been recorded</p>
                  </div>
                </div>
                
                <div className="bg-white rounded border p-3">
                  {isPoints && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-xs">Score Change</p>
                        <p className="font-bold text-emerald-700">
                          {parsed.old_score} → {parsed.new_score}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="bg-emerald-100 rounded-full px-3 py-1">
                          <span className="text-emerald-700 font-bold">
                            +{parsed.points_added}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">points</p>
            </div>
          </div>
        )}
                  
                  {isStreak && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-xs">Streak Progress</p>
                        <p className="font-bold text-orange-700">
                          {parsed.old_streak} → {parsed.new_streak} days
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="bg-orange-100 rounded-full px-3 py-1">
                          <span className="text-orange-700 font-bold">
                            {parsed.new_streak}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">day streak</p>
                      </div>
                    </div>
                  )}
                  
                  {parsed.message && (
                    <p className="text-gray-700 mt-2 text-xs italic">{parsed.message}</p>
                  )}
                </div>
      </div>
    );
          }
          break;
          
        case 'plan':
          // The plan tool now returns JSON with plan details - get from both tool args and result
          const planDetailsFromArgs = toolArgs?.plan_details;
          const planDetailsFromResult = parsed.plan_content;
          const planDetails = planDetailsFromResult || planDetailsFromArgs;
          
          return (
            <div className="bg-blue-50 rounded p-3 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <p className="font-medium text-blue-800">🎯 Execution Strategy Created</p>
              </div>
              
              <div className="bg-white rounded border p-3">
                <p className="text-xs font-semibold text-gray-800 mb-2">📋 Strategic Plan</p>
                {planDetails && planDetails.trim() && planDetails !== 'Continue' ? (
                  <div className="text-xs text-gray-700 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {planDetails}
                  </div>
                ) : (
                  <div className="text-xs text-gray-700 leading-relaxed">
                    <p className="mb-2 font-medium text-amber-700">⚠️ Plan details not captured</p>
                    <p>The executor agent created a strategic plan, but the specific details weren't captured properly. The plan was formulated based on the planning analysis and the executor is proceeding with implementation.</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-3 h-3" />
                <p className="text-xs font-medium">Ready to execute actions</p>
              </div>
            </div>
          );
          
        case 'final_response_to_user':
          const responseContent = toolArgs?.response_content;
          const actionSummary = toolArgs?.action_summary;
          
          return (
            <div className="bg-green-50 rounded p-3 text-xs space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="font-medium text-green-800">🎯 Task Completed Successfully</p>
              </div>
              
              {responseContent && responseContent.trim() && (
                <div className="bg-white rounded border p-3">
                  <p className="text-xs font-semibold text-gray-800 mb-2">📝 Final Response</p>
                                     <div className="text-xs text-gray-700 leading-relaxed max-h-48 overflow-y-auto prose prose-xs max-w-none">
                     <ReactMarkdown
                       remarkPlugins={[remarkGfm]}
                       rehypePlugins={[rehypeSanitize]}
                     >
                       {responseContent}
                     </ReactMarkdown>
                   </div>
                </div>
              )}
              
              {actionSummary && actionSummary.trim() && (
                <div className="bg-blue-50 rounded border p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-2">⚙️ Actions Taken</p>
                  <div className="text-xs text-blue-700 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {actionSummary}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-green-600">
                <Sparkles className="w-3 h-3" />
                <p className="text-xs font-medium">Response delivered to user</p>
              </div>
            </div>
          );
      }
      
      // Fallback for other successful operations
      if (parsed.success === true) {
        return (
          <div className="bg-green-50 rounded p-2 text-xs">
            <p className="text-green-800">✓ Operation completed successfully</p>
            {parsed.message && <p className="text-gray-600 mt-1">{parsed.message}</p>}
          </div>
        );
      } else if (parsed.success === false || parsed.error) {
        return (
          <div className="bg-red-50 rounded p-2 text-xs">
            <p className="text-red-800">✗ Operation failed</p>
            {parsed.error && <p className="text-gray-600 mt-1">{parsed.error}</p>}
          </div>
        );
      }
      
      // Last resort: show a simple summary
      return <p className="text-xs text-gray-600">Operation completed</p>;
      
    } catch {
      // If not JSON, just show completion message
      return <p className="text-xs text-gray-600">✓ Completed</p>;
    }
  };

  const renderExecutionDetails = (execution: ExecutionData) => {
    if (!showExecutionDetails[execution.id]) return null;

    // Show all events in chronological order, but filter out events that happen after terminal tools
    const allEvents = [...execution.chronologicalEvents].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Find the index of the last terminal tool (final_response or final_response_to_user)
    let lastTerminalIndex = -1;
    for (let i = allEvents.length - 1; i >= 0; i--) {
      const event = allEvents[i];
      if (event.type === 'tool_call' && 
          ((event as ToolCallEvent).tool_name === 'final_response' || (event as ToolCallEvent).tool_name === 'final_response_to_user')) {
        lastTerminalIndex = i;
        break;
      }
    }
    
    // Only show events up to and including the last terminal tool (or all events if not complete yet)
    const relevantEvents = lastTerminalIndex >= 0 
      ? allEvents.slice(0, lastTerminalIndex + 1)
      : allEvents;
    
    if (relevantEvents.length === 0) return null;
    
    return (
      <div className="space-y-1.5 mb-3">
        {/* Execution summary at the top */}
        <div className="flex items-center gap-3 text-xs text-gray-500 pb-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {execution.executionTime ? `${(execution.executionTime / 1000).toFixed(1)}s` : 
             execution.isComplete ? 'Completed' : 'Processing...'}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {execution.totalTokens.toLocaleString()} tokens
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatCost(execution.totalCost)}
          </span>
          {!execution.isComplete && execution.currentPhase && (
            <span className="flex items-center gap-1 text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              {execution.currentPhase}
            </span>
          )}
        </div>

        {/* All events in chronological order */}
        <div className="space-y-1">
          {relevantEvents.map((event, idx) => {
            const key = `event-${idx}-${event.type}-${event.timestamp}`;
    const isExpanded = expandedItems[key];
            
            // Tool call event - show as compact badges by default
            if (event.type === 'tool_call') {
              const formatted = formatToolCall(event);
              const Icon = formatted.icon;
              const relatedResult = execution.toolResults.find(r => r.tool_call_id === event.tool_call_id);

    return (
                <div 
                  key={key} 
                  className={cn(
                    "rounded-md border transition-all duration-200 overflow-hidden",
                    isExpanded ? "bg-gray-50" : "bg-gray-50/50 hover:bg-gray-50"
                  )}
                >
                  <button
          onClick={() => toggleExpanded(key)}
                    className="w-full px-2.5 py-1.5 flex items-center gap-2 text-left"
                  >
                    <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", formatted.color.split(' ')[0])} />
                    <span className="text-xs font-medium flex-1">{formatted.name}</span>
                    {!isExpanded && relatedResult && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
        
        {isExpanded && (
                    <div className="px-2.5 pb-2 pt-1">
                      {relatedResult && formatToolResult(relatedResult.result, event.tool_name, event.tool_args)}
                </div>
                  )}
                </div>
              );
            }
            
            // Thinking event - very compact
            if (event.type === 'thinking') {
              if (!isExpanded) {
                return (
                  <button
                    key={key}
                    onClick={() => toggleExpanded(key)}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                  >
                    <Brain className="w-3 h-3" />
                    <span>{event.agent === 'planning' ? 'Planning' : 'Execution'} thoughts...</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                );
              }
              
              return (
                <div 
                  key={key}
                  className="rounded-md bg-purple-50/50 border border-purple-100"
                >
                  <button
                    onClick={() => toggleExpanded(key)}
                    className="w-full px-2.5 py-1.5 flex items-center gap-2 text-left"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span className="text-xs font-medium flex-1">
                      {event.agent === 'planning' ? 'Planning' : 'Execution'} Thoughts
                    </span>
                    <ChevronUp className="w-3 h-3 text-gray-400" />
                  </button>
                  
                  <div className="px-2.5 pb-3 pt-1">
                    <div className="bg-white rounded border p-3 max-h-96 overflow-y-auto">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                        <span className="text-xs font-semibold text-purple-700">
                          {event.agent === 'planning' ? '🧠 Planning Agent' : '⚡ Executor Agent'} Reasoning
                        </span>
                        <span className="text-xs text-gray-500">
                          {event.content.length.toLocaleString()} characters
                        </span>
                </div>
                      <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {event.content}
                </div>
              </div>
            </div>
          </div>
              );
            }
            
            return null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)] flex gap-4">
        {/* Conversation History Sidebar */}
        <div className={`transition-all duration-300 ${showHistory ? 'w-80' : 'w-0'} overflow-hidden`}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5" />
                Conversation History
              </CardTitle>
              <Button
                onClick={startNewConversation}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="p-4 space-y-2">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="ml-2 text-sm text-gray-500">Loading conversations...</span>
                    </div>
                  ) : conversationThreads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MessageCircle className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500 mb-1">No conversation history</p>
                      <p className="text-xs text-gray-400">Start a new conversation to begin</p>
                    </div>
                  ) : (
                    conversationThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                          thread.isActive 
                            ? 'bg-blue-100 border-blue-300 border' 
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={() => switchToThread(thread.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {thread.title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {thread.lastMessage}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {thread.messageCount} messages
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {new Date(thread.lastUpdated).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteThread(thread.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Interface */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-white to-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="hover:bg-gray-100"
                >
                  <History className="w-4 h-4 mr-2" />
                  {showHistory ? 'Hide' : 'Show'} History
                </Button>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Auxilium AI Agent
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {currentThreadId && (
                  <Badge variant="outline" className="font-mono text-xs">
                    Thread: {currentThreadId.slice(0, 8)}...
                  </Badge>
                )}
                <Badge variant={isStreaming ? "default" : "secondary"} className="flex items-center gap-1">
                  {isStreaming ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Ready
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardHeader>

            {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
                {executions.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      Start a conversation with Auxilium
                    </h3>
                    <p className="text-sm text-gray-500">
                      I can help you manage objectives, track progress, and organize your tasks.
                    </p>
                  </div>
                )}
                
                {executions.map((execution) => (
                  <div key={execution.id} className="space-y-3">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[70%] shadow-sm">
                        <p className="text-sm">{execution.userMessage}</p>
                      </div>
                    </div>

                    {/* Agent Response */}
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm max-w-[70%] shadow-sm">
                        {/* Message Header */}
                        <div className="flex items-center gap-2 px-4 pt-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="font-medium text-gray-800 text-sm">Auxilium</span>
                          {execution.currentPhase && !execution.isComplete && (
                            <Badge variant="secondary" className="text-xs animate-pulse">
                              {execution.currentPhase}
                            </Badge>
                          )}
                        </div>

                        {/* Message Content */}
                        <div className="px-4 pb-3">
                          {/* Integrated Execution Details - ABOVE the message - Show during streaming */}
                          {renderExecutionDetails(execution)}
                          
                          {/* Main message content */}
                          {execution.finalResponse ? (
                            <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-semibold prose-p:mb-2 prose-p:last:mb-0 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:font-semibold prose-strong:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-pre:bg-gray-100 prose-pre:p-2 prose-pre:rounded prose-pre:text-xs prose-pre:overflow-x-auto prose-blockquote:border-l-2 prose-blockquote:border-gray-300 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:text-gray-600 prose-a:text-blue-600 prose-a:hover:text-blue-800 prose-a:underline">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeSanitize]}
                                components={{
                                  // Customize markdown components for better styling
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-800">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-gray-800">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-gray-800">{children}</h3>,
                                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                  li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                  strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                                  em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                                  code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-800">{children}</code>,
                                  pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                                  blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-3 italic text-gray-600 mb-2">{children}</blockquote>,
                                  a: ({ children, href }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                                }}
                              >
                                {execution.finalResponse}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              <span className="text-sm text-gray-500">Processing your request...</span>
                            </div>
                        )}

                        {/* Execution Details Toggle */}
                          {(execution.toolCalls.length > 0 || execution.thoughts.length > 0 || execution.chronologicalEvents.length > 0) && (
                            <button
                          onClick={() => toggleExecutionDetails(execution.id)}
                              className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                        >
                          {showExecutionDetails[execution.id] ? (
                            <>
                                  <ChevronUp className="w-3 h-3" />
                                  Hide details
                            </>
                          ) : (
                            <>
                                  <ChevronDown className="w-3 h-3" />
                                  Show details
                            </>
                          )}
                            </button>
                          )}
                              </div>
                            </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask me anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="resize-none flex-1 min-h-[60px] max-h-[120px]"
                disabled={isStreaming}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isStreaming}
                className="self-end bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage; 