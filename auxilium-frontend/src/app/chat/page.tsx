'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  CheckCircle, 
  Clock, 
  Activity, 
  DollarSign, 
  Sparkles, 
  Brain, 
  ChevronDown, 
  ChevronUp,
  ChevronRight,
  History,
  Plus,
  Calendar,
  User,
  Wrench,
  Save,
  Trash2,
  Settings,
  Search,
  Filter,
  Database,
  Target,
  Zap,
  Move,
  Edit,
  X,
  Eye
} from 'lucide-react';

// Simple Badge component
const Badge = ({ children, variant = 'default', className = '', ...props }: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 bg-white text-gray-800'
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)} {...props}>
      {children}
    </span>
    );
};

// Interfaces
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
  data?: any;
  [key: string]: any;
}

interface ThinkingEvent {
  id: string;
  agent: 'planning' | 'executor';
  content: string;
  timestamp: string;
}

interface ToolCallEvent {
  id: string;
  agent: 'planning' | 'executor';
  tool_name: string;
  tool_args: Record<string, any>;
  timestamp: string;
}

interface ToolResultEvent {
  id: string;
  agent: 'planning' | 'executor';
  tool_name: string;
  tool_call_id: string;
  result: string;
  timestamp: string;
}

interface AgentResponseEvent {
  id: string;
  agent: 'planning' | 'executor';
  content: string;
  timestamp: string;
}

interface ExecutionData {
  id: string;
  threadId: string;
  userMessage: string;
  timestamp: string;
  isComplete: boolean;
  currentPhase: string;
  finalResponse: string;
  
  // Token and cost tracking
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  
  // Tool tracking
  toolCalls: ToolCallEvent[];
  toolResults: ToolResultEvent[];
  toolCallMap: Map<string, any>;
  
  // Agent responses
  agentResponses: AgentResponseEvent[];
  
  // Thinking content
  thinkingContent: ThinkingEvent[];
}

interface ConversationThread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
  isActive: boolean;
}

// Tool display configuration
const TOOL_DISPLAY_CONFIG: Record<string, any> = {
  retrieve_objectives_by_time_period: {
    name: 'Check Schedule',
    icon: Calendar,
    color: 'text-blue-600 bg-blue-50'
  },
  retrieve_objective_by_name: {
    name: 'Find Objective',
    icon: Search,
    color: 'text-green-600 bg-green-50'
  },
  retrieve_objective_by_id: {
    name: 'Get Objective',
    icon: Target,
    color: 'text-purple-600 bg-purple-50'
  },
  create_objective: {
    name: 'Create Objective',
    icon: Plus,
    color: 'text-emerald-600 bg-emerald-50'
  },
  update_objective: {
    name: 'Update Objective',
    icon: Edit,
    color: 'text-orange-600 bg-orange-50'
  },
  delete_objective: {
    name: 'Delete Objective',
    icon: X,
    color: 'text-red-600 bg-red-50'
  },
  save_user_memory: {
    name: 'Save Memory',
    icon: Save,
    color: 'text-amber-600 bg-amber-50'
  },
  get_gamification_stats: {
    name: 'Check Stats',
    icon: Activity,
    color: 'text-indigo-600 bg-indigo-50'
  },
  update_gamification_stats: {
    name: 'Update Stats',
    icon: Zap,
    color: 'text-yellow-600 bg-yellow-50'
  },
  plan: {
    name: 'Create Plan',
    icon: Brain,
    color: 'text-cyan-600 bg-cyan-50'
  },
  final_response: {
    name: 'Planning Complete',
    icon: CheckCircle,
    color: 'text-blue-600 bg-blue-50'
  },
  final_response_to_user: {
    name: 'Final Response',
    icon: Sparkles,
    color: 'text-green-600 bg-green-50'
  }
};

const ChatPage: React.FC = () => {
  const [executions, setExecutions] = useState<ExecutionData[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState('Ready');
  const [showHistory, setShowHistory] = useState(true);
  const [conversationThreads, setConversationThreads] = useState<ConversationThread[]>([]);
  const [showExecutionDetails, setShowExecutionDetails] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load conversation history from backend
  const loadConversationHistory = useCallback(async () => {
    try {
      console.log('📚 Loading conversation history...');
      const response = await fetch('http://localhost:8000/api/v1/agent/conversations');
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to load conversation history: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log('📚 Raw conversation history data:', data);
      
      if (data.success && data.threads) {
        const threads = data.threads.map((thread: any) => ({
          id: thread.id,
          title: thread.title || 'New Conversation',
          lastMessage: thread.latest_message || '',
          timestamp: thread.last_updated || thread.created_at,
          messageCount: thread.message_count || 0,
          isActive: false
        }));
        
        setConversationThreads(threads);
        console.log(`📚 Loaded ${threads.length} conversation threads`);
      } else {
        console.log('📭 No conversation threads found or incorrect response format');
        setConversationThreads([]);
      }
    } catch (error) {
      console.error('❌ Error loading conversation history:', error);
      setConversationThreads([]);
    }
  }, []);

  // Load conversation history on component mount
  useEffect(() => {
    loadConversationHistory();
  }, [loadConversationHistory]);

  // Delete a conversation thread
  const deleteConversation = useCallback(async (threadId: string) => {
    try {
      console.log(`🗑️ Deleting conversation thread: ${threadId}`);
      
      const response = await fetch(`http://localhost:8000/api/v1/agent/conversation/${threadId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🗑️ Delete response:', data);
      
      if (data.success) {
        // Remove the thread from the UI
        setConversationThreads(prev => prev.filter(thread => thread.id !== threadId));
        
        // If the deleted thread was the current one, clear the current conversation
        if (currentThreadId === threadId) {
    setCurrentThreadId(null);
    setExecutions([]);
          setCurrentPhase('Ready');
        }
        
        console.log(`✅ Successfully deleted conversation thread: ${threadId}`);
      } else {
        throw new Error(data.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      // You might want to show a toast notification here
    }
  }, [currentThreadId]);

  // Switch to a specific conversation thread
  const switchToThread = useCallback(async (threadId: string) => {
    setCurrentThreadId(threadId);
    
    // Mark thread as active
    setConversationThreads(prev => prev.map(thread => ({
      ...thread,
      isActive: thread.id === threadId
    })));
    
    // Load detailed conversation data
    try {
      console.log(`🔄 Loading detailed conversation for thread: ${threadId}`);
      
      const response = await fetch(`http://localhost:8000/api/v1/agent/conversation/${threadId}`);
      if (!response.ok) {
        throw new Error(`Failed to load conversation: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📚 Detailed conversation data:', data);
      
      if (data.success && data.conversation_history && data.conversation_history.exchanges) {
        // Transform the stored conversation data into ExecutionData format
        const executions = transformStoredConversationToExecutions(data.conversation_history.exchanges, threadId);
        console.log('🔄 Transformed executions:', executions);
        
        setExecutions(executions);
        setIsStreaming(false);
        setCurrentPhase('Ready');
      } else {
        console.warn('⚠️ No exchanges found in conversation data');
        setExecutions([]);
      }
    } catch (error) {
      console.error('❌ Error loading detailed conversation:', error);
      setExecutions([]);
    }
  }, []);

  // Transform stored conversation data to ExecutionData format
  const transformStoredConversationToExecutions = (exchanges: any[], threadId: string): ExecutionData[] => {
    console.log('🔄 Transforming stored conversation data...');
    
    const executions: ExecutionData[] = [];
      
    // Filter out incomplete exchanges to avoid showing "Processing..." messages in history
    const completedExchanges = exchanges.filter(exchange => {
      const isComplete = exchange.is_complete;
      if (!isComplete) {
        console.log(`⏭️ Skipping incomplete exchange: ${exchange.id}`);
      }
      return isComplete;
    });
    
    console.log(`📊 Processing ${completedExchanges.length} completed exchanges (filtered from ${exchanges.length} total)`);
    
    completedExchanges.forEach((exchange: any, exchangeIndex: number) => {
      console.log(`📝 Processing exchange ${exchangeIndex + 1}:`, exchange);
      
      // Create execution data for this exchange
      const execution: ExecutionData = {
        id: `stored-${exchange.id}`,
        threadId: threadId,
        userMessage: exchange.user_message,
        timestamp: exchange.timestamp,
        isComplete: exchange.is_complete || false,
        currentPhase: exchange.is_complete ? 'Complete' : 'Processing',
        finalResponse: exchange.final_response || '',
        
        // Token and cost tracking
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
        
        // Tool tracking
        toolCalls: [],
        toolResults: [],
        toolCallMap: new Map(),
        
        // Agent responses
        agentResponses: [],
        
        // Thinking content
        thinkingContent: []
      };
      
      // Process agent messages to build tool calls, responses, and thinking
      const processedToolCalls = new Set<string>();
      
      exchange.agent_messages?.forEach((message: any, messageIndex: number) => {
        console.log(`  📨 Processing message ${messageIndex + 1}:`, message);
        
        switch (message.message_type) {
          case 'thinking':
            execution.thinkingContent.push({
              id: message.id,
              agent: message.agent,
              content: message.content,
              timestamp: message.timestamp
            });
            break;
            
          case 'response':
            if (message.content && message.content.trim()) {
              execution.agentResponses.push({
                id: message.id,
                agent: message.agent,
                content: message.content,
                timestamp: message.timestamp
              });
      }
            break;
            
          case 'tool_result':
            if (message.tool_call_id && !processedToolCalls.has(message.tool_call_id)) {
              processedToolCalls.add(message.tool_call_id);
              
              const toolCall: ToolCallEvent = {
                id: message.tool_call_id,
                tool_name: message.tool_name || 'unknown',
                tool_args: message.tool_args || {},
                timestamp: message.timestamp,
                agent: message.agent
              };
              
              const toolResult: ToolResultEvent = {
                id: message.id,
                tool_call_id: message.tool_call_id,
                result: message.content,
                timestamp: message.timestamp,
                agent: message.agent,
                tool_name: message.tool_name || 'unknown'
              };
              
              execution.toolCalls.push(toolCall);
              execution.toolResults.push(toolResult);
              execution.toolCallMap.set(message.tool_call_id, {
                tool_name: message.tool_name || 'unknown',
                tool_args: message.tool_args || {},
                tool_result_parsed: message.tool_result_parsed || null
              });
              
              console.log(`🔧 Added tool call/result: ${message.tool_name}`, {
                args: message.tool_args,
                result: message.content?.substring(0, 100),
                parsed: message.tool_result_parsed
              });
            }
            break;
        }
      });
      
      // Calculate token usage from streaming events
      exchange.streaming_events?.forEach((event: any) => {
        if (event.event_type === 'token_usage') {
          execution.inputTokens += event.metadata?.input_tokens || 0;
          execution.outputTokens += event.metadata?.output_tokens || 0;
          execution.totalTokens += event.metadata?.total_tokens || 0;
        }
      });
      
      // Calculate cost (Gemini 2.5 Flash pricing)
      execution.totalCost = (execution.inputTokens / 1_000_000) * 0.30 + (execution.outputTokens / 1_000_000) * 2.50;
      
      // Set final response if available
      if (exchange.final_response) {
        execution.finalResponse = exchange.final_response;
        execution.isComplete = true;
        execution.currentPhase = 'Complete';
      }
      
      console.log(`✅ Processed exchange ${exchangeIndex + 1}:`, {
        toolCalls: execution.toolCalls.length,
        toolResults: execution.toolResults.length,
        agentResponses: execution.agentResponses.length,
        thinkingContent: execution.thinkingContent.length,
        tokens: execution.totalTokens,
        cost: execution.totalCost,
        finalResponse: execution.finalResponse ? 'Present' : 'Missing'
      });
      
      executions.push(execution);
    });
    
    console.log(`🔄 Transformed ${executions.length} exchanges to executions`);
    return executions;
  };

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

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsStreaming(true);
    setCurrentPhase('Initializing...');

    try {
      const response = await fetch('http://localhost:8000/api/v1/agent/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          thread_id: currentThreadId,
          include_thoughts: true,
          include_tool_details: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      // Create new execution for this message
      const newExecution: ExecutionData = {
        id: `execution-${Date.now()}`,
        threadId: currentThreadId || 'new',
        userMessage,
        timestamp: new Date().toISOString(),
        isComplete: false,
        currentPhase: 'Initializing...',
        finalResponse: '',
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
        toolCalls: [],
        toolResults: [],
        toolCallMap: new Map(),
        agentResponses: [],
        thinkingContent: []
      };

      setExecutions(prev => [...prev, newExecution]);

      // Process streaming events
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              await updateExecutionWithEvent(eventData);
            } catch (error) {
              console.error('❌ Error parsing SSE event:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setCurrentPhase('Error');
    } finally {
      setIsStreaming(false);
    }
  }, [inputMessage, isStreaming, currentThreadId]);

  const updateExecutionWithEvent = useCallback(async (event: StreamingEvent) => {
    setExecutions(prev => prev.map(execution => {
      if (execution.id !== prev[prev.length - 1]?.id) return execution;

      const updated = { ...execution };

      switch (event.type) {
        case 'execution_start':
          updated.currentPhase = 'Starting...';
          if (event.thread_id) {
            updated.threadId = event.thread_id;
              setCurrentThreadId(event.thread_id);
          }
          break;

        case 'initialization':
          updated.currentPhase = 'Initializing...';
          break;

        case 'node_start':
          updated.currentPhase = `${event.agent} Agent - ${event.node}`;
          break;

        case 'thinking':
          if (event.content && event.agent && event.thinking_id) {
            // Check for duplicates by thinking_id
            const existingThinking = updated.thinkingContent.find(t => t.id === event.thinking_id);
            if (!existingThinking) {
              updated.thinkingContent.push({
                id: event.thinking_id,
                agent: event.agent as 'planning' | 'executor',
                content: event.content,
                timestamp: event.timestamp
              });
              console.log(`💭 Added thinking event: ${event.agent} - ${event.thinking_id}`);
              }
          }
          break;

        case 'tool_call':
          if (event.tool_name && event.tool_call_id) {
            // Check for duplicates by tool_call_id
            const existingToolCall = updated.toolCalls.find(tc => tc.id === event.tool_call_id);
            if (!existingToolCall) {
              updated.toolCalls.push({
                id: event.tool_call_id,
                agent: event.agent as 'planning' | 'executor',
                tool_name: event.tool_name,
                tool_args: event.tool_args || {},
                timestamp: event.timestamp
              });
              console.log(`🔧 Added tool call: ${event.tool_name} - ${event.tool_call_id}`);
            }
          }
          break;

        case 'tool_result':
          if (event.tool_call_id && event.result) {
            // Check for duplicates by tool_call_id in results
            const existingResult = updated.toolResults.find(tr => tr.tool_call_id === event.tool_call_id);
            if (!existingResult) {
              updated.toolResults.push({
                id: event.tool_result_id || Date.now().toString(),
                agent: event.agent as 'planning' | 'executor',
                tool_name: event.tool_name || 'unknown',
                tool_call_id: event.tool_call_id,
                result: event.result,
                timestamp: event.timestamp
              });

              // Store enhanced tool data
              updated.toolCallMap.set(event.tool_call_id, {
                tool_name: event.tool_name,
                tool_args: event.tool_args || {},
                tool_result_parsed: event.tool_result_parsed || null
              });
              
              console.log(`📊 Added tool result: ${event.tool_name} - ${event.tool_call_id}`, {
                result: event.result?.substring(0, 100),
                parsed: event.tool_result_parsed
              });
            }
          }
          break;

        case 'token_usage':
          updated.inputTokens += event.input_tokens || 0;
          updated.outputTokens += event.output_tokens || 0;
          updated.totalTokens += event.total_tokens || 0;
          updated.totalCost = (updated.inputTokens / 1_000_000) * 0.30 + (updated.outputTokens / 1_000_000) * 2.50;
          break;

        case 'final_response':
          updated.finalResponse = event.response || '';
          updated.isComplete = true;
            updated.currentPhase = 'Complete';
          break;

        case 'execution_complete':
          updated.isComplete = true;
          updated.currentPhase = 'Complete';
          setCurrentPhase('Ready');
          
          // Reload conversation history to include the new conversation
          if (event.thread_id) {
            setConversationThreads(prev => {
              const existingThread = prev.find(t => t.id === event.thread_id);
              if (existingThread) {
                return prev.map(thread => 
                  thread.id === event.thread_id 
                    ? { ...thread, lastMessage: updated.userMessage, timestamp: new Date().toISOString(), messageCount: thread.messageCount + 1 }
                : thread
                );
              } else {
                return [...prev, {
                  id: event.thread_id!,
                  title: updated.userMessage.substring(0, 50) + '...',
                  lastMessage: updated.userMessage,
                  timestamp: new Date().toISOString(),
                  messageCount: 1,
                  isActive: true
                }];
              }
            });
          }
          break;

        case 'execution_error':
          updated.isComplete = true;
          updated.currentPhase = 'Error';
          break;

        case 'quota_pause_start':
          if (event.data) {
            const { requests_today, pause_duration } = event.data;
            updated.currentPhase = `API Quota Management - Pausing for ${pause_duration}s (${requests_today} requests today)`;
            console.log(`⏸️ API quota pause started: ${pause_duration}s after ${requests_today} requests`);
          }
          break;

        case 'quota_pause_end':
          if (event.data) {
            const { requests_today } = event.data;
            updated.currentPhase = `API Quota Management - Resuming (${requests_today} requests today)`;
            console.log(`▶️ API quota pause ended after ${requests_today} requests`);
          }
          break;

        case 'heartbeat':
          // Just a keep-alive, no action needed
          break;
      }

      return updated;
    }));
  }, []);

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

  const formatCost = (cost: number) => {
    return cost >= 0.001 ? `$${cost.toFixed(4)}` : '< $0.001';
  };

  // Helper function to format tool names and arguments
  const formatToolCall = (toolCall: ToolCallEvent) => {
    const config = TOOL_DISPLAY_CONFIG[toolCall.tool_name];
    
    if (!config) {
      return {
        name: toolCall.tool_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icon: Wrench,
        color: "text-gray-600 bg-gray-50"
      };
    }
    
    return {
      name: config.name,
      icon: config.icon,
      color: config.color
    };
  };

  // Enhanced helper function to format tool results
  const formatToolResult = (result: string, toolName: string, toolArgs?: any, toolResultParsed?: any): React.ReactNode => {
    console.log('🔍 Formatting tool result:', { 
      toolName, 
      result: result?.substring(0, 200), 
      toolArgs, 
      toolResultParsed,
      resultType: typeof result
    });
    
    try {
      // Use parsed data if available, otherwise try to parse the result
      let parsed = toolResultParsed;
      if (!parsed && result) {
        try {
          parsed = JSON.parse(result);
        } catch (parseError) {
          console.warn('Failed to parse tool result as JSON:', parseError);
          // If it's not JSON, treat as plain text
    return (
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs">
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Tool completed</p>
              <p className="text-gray-700 dark:text-gray-300">{result}</p>
              </div>
            );
          }
      }
      
      console.log('📊 Parsed tool result:', parsed);
      
      switch (toolName) {
        case 'retrieve_objectives_by_time_period':
          if (parsed?.objectives && Array.isArray(parsed.objectives)) {
            const objectives = parsed.objectives;
            const statusCounts = objectives.reduce((acc: any, obj: any) => {
              acc[obj.status] = (acc[obj.status] || 0) + 1;
              return acc;
            }, {});
            
            return (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800 dark:text-blue-200">📅 Schedule Retrieved</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Schedule: {toolArgs?.start_date?.split('T')[0]} - {toolArgs?.end_date?.split('T')[0]} • {objectives.length} objectives
                    </p>
                  </div>
          </div>
                
                {Object.keys(statusCounts).length > 0 && (
                  <div className="bg-blue-100 dark:bg-blue-800/30 rounded p-2">
                    <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">Status Summary</p>
                    <div className="flex flex-wrap gap-1">
                  {Object.entries(statusCounts).map(([status, count]) => (
                        <span key={status} className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-700 dark:text-gray-300">
                      {count as number} {status.replace(/_/g, ' ')}
                    </span>
                  ))}
        </div>
                  </div>
                )}
                
                <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 max-h-64 overflow-y-auto">
                  <div className="p-3 space-y-2">
                    {objectives.map((obj: any, index: number) => (
                      <div key={obj.id || index} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-2 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">{obj.title}</p>
                          {obj.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 line-clamp-2">{obj.description}</p>
                          )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-500">📅 {obj.start_date?.split('T')[0]}</span>
                            {obj.priority_score && (
                                <span className="text-xs text-gray-500 dark:text-gray-500">⭐ {Math.round(obj.priority_score * 100)}%</span>
                            )}
                            {obj.objective_type && (
                                <span className="text-xs text-gray-500 dark:text-gray-500">🏷️ {obj.objective_type}</span>
                            )}
            </div>
          </div>
                          <div className="flex-shrink-0">
                        <span className={cn(
                              "px-2 py-1 rounded font-medium",
                              obj.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              obj.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                              obj.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                        )}>
                          {obj.status?.replace(/_/g, ' ') || 'not started'}
                        </span>
                          </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            );
          }
          break;
          
        case 'save_user_memory':
          if (parsed?.success) {
            return (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Save className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">💾 Memory Saved</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Information stored successfully</p>
                  </div>
                </div>
                
                {/* Show the actual memory content */}
                {(parsed.memory?.text || toolArgs?.memory_content) && (
                  <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 p-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Saved Content:</p>
                    <div className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">
                      {parsed.memory?.text || toolArgs?.memory_content}
                    </div>
                  </div>
                )}
                
                {/* Show memory category if available */}
                {(parsed.memory?.category || toolArgs?.category) && (
                  <div className="bg-amber-100 dark:bg-amber-900/30 rounded p-2">
                    <p className="text-amber-800 dark:text-amber-200 font-medium text-xs">
                      Category: {parsed.memory?.category || toolArgs?.category}
                    </p>
                    </div>
                )}
                
                {/* Show memory ID if available */}
                {parsed.memory?.id && (
                  <div className="pt-2 border-t dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <strong>Memory ID:</strong> {parsed.memory.id}
                    </p>
                  </div>
                )}
              </div>
            );
          }
          break;
          
        case 'create_objective':
          if (parsed?.success && parsed?.id) {
            // Create a component that fetches and displays the full objective details
            return <ObjectiveDetailsDisplay objectiveId={parsed.id} action="created" />;
          } else if (parsed?.success) {
            // Fallback for create_objective without detailed objective data
            return (
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200">✨ Objective Created Successfully</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{parsed.message || 'Successfully created new objective'}</p>
                  </div>
                </div>
                {parsed.id && (
                  <div className="bg-white dark:bg-gray-800 rounded border p-2 mt-2">
                    <p className="text-gray-700 dark:text-gray-300 text-xs">
                      <strong>ID:</strong> {parsed.id}
                    </p>
                        </div>
                      )}
              </div>
            );
          }
          break;
          
        case 'update_objective':
          if (parsed?.success && parsed?.id) {
            // Create a component that fetches and displays the full objective details
            return <ObjectiveDetailsDisplay objectiveId={parsed.id} action="updated" />;
          } else if (parsed?.success) {
            return (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-xs">
                <div className="flex items-start gap-2">
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800 dark:text-blue-200">📝 Objective Updated Successfully</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{parsed.message || 'Successfully updated objective'}</p>
                  </div>
                </div>
                {parsed.objective && (
                  <div className="bg-white dark:bg-gray-800 rounded border p-3 mt-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{parsed.objective.title}</h4>
                    {parsed.objective.description && (
                      <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">{parsed.objective.description}</p>
                    )}
                      </div>
        )}
      </div>
    );
          }
          break;
          
        case 'plan':
          if (parsed?.success || parsed?.plan_provided || parsed?.type === 'execution_plan_created') {
            return (
              <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-cyan-800 dark:text-cyan-200">📋 Execution Plan Created</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Step-by-step action plan ready</p>
                  </div>
                </div>
                
                {/* Show the plan content */}
                {parsed.plan_content && (
                  <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 p-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Execution Plan:</p>
                    <div className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {parsed.plan_content}
                </div>
              </div>
                )}
                
                {/* Show metadata if available */}
                {parsed.metadata && (
                  <div className="bg-cyan-50 dark:bg-cyan-900/40 rounded p-2">
                    <p className="text-cyan-700 dark:text-cyan-300 text-xs">
                      <strong>Phase:</strong> {parsed.metadata.phase} | <strong>Agent:</strong> {parsed.metadata.agent}
                    </p>
                  </div>
                )}
                
                {/* Show status if available */}
                {parsed.status && (
                  <div className="bg-cyan-100 dark:bg-cyan-900/30 rounded p-2">
                    <p className="text-cyan-700 dark:text-cyan-300 text-xs">
                      <strong>Status:</strong> {parsed.status}
                    </p>
                        </div>
                      )}
              </div>
            );
          }
          break;
          
        case 'final_response':
          if (parsed?.success || parsed?.analysis_provided || parsed?.type === 'planning_analysis_complete') {
            return (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800 dark:text-blue-200">🧠 Planning Analysis Complete</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Strategic recommendations ready for execution</p>
                  </div>
                </div>
                
                {/* Show the summary content */}
                {parsed.summary_content && (
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-2">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">Summary:</p>
                    <div className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed whitespace-pre-wrap">
                      {parsed.summary_content}
                      </div>
                    </div>
                )}
                
                {/* Show the detailed analysis */}
                {parsed.analysis_content && (
                  <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 p-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Detailed Analysis:</p>
                    <div className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {parsed.analysis_content}
                      </div>
                    </div>
                )}
                  
                {/* Show metadata if available */}
                {parsed.metadata && (
                  <div className="bg-blue-50 dark:bg-blue-900/40 rounded p-2">
                    <p className="text-blue-700 dark:text-blue-300 text-xs">
                      <strong>Phase:</strong> {parsed.metadata.phase} | <strong>Agent:</strong> {parsed.metadata.agent}
                    </p>
        </div>
                  )}
              </div>
            );
          }
          break;
          
        case 'final_response_to_user':
          if (parsed?.success || parsed?.interaction_complete || parsed?.type === 'final_response') {
            return (
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200">✅ Task Completion</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Final response delivered to user</p>
                  </div>
                </div>
                
                {/* Show the response content */}
                {(parsed.response_content || parsed.response_content_data) && (
                  <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 p-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Response:</p>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {parsed.response_content || parsed.response_content_data}
                      </ReactMarkdown>
            </div>
          </div>
        )}
                  
                {/* Show action summary if available */}
                {(parsed.action_summary || parsed.action_summary_content) && (
                  <div className="bg-green-100 dark:bg-green-900/30 rounded p-2">
                    <p className="font-medium text-green-800 dark:text-green-200 mb-2">Action Summary:</p>
                    <div className="text-green-700 dark:text-green-300 text-xs leading-relaxed">
                      {parsed.action_summary || parsed.action_summary_content}
                      </div>
                    </div>
                  )}
                  
                {/* Show metadata if available */}
                {parsed.metadata && (
                  <div className="bg-green-50 dark:bg-green-900/40 rounded p-2">
                    <p className="text-green-700 dark:text-green-300 text-xs">
                      <strong>Response Length:</strong> {parsed.metadata.response_length} characters
                      {parsed.metadata.completion_time && (
                        <span> | <strong>Completed:</strong> {new Date(parsed.metadata.completion_time).toLocaleTimeString()}</span>
                  )}
                    </p>
                </div>
                )}
      </div>
    );
          }
          break;
          
        default:
          if (parsed?.success) {
          return (
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200">✅ {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Completed</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Operation completed successfully</p>
              </div>
              </div>
            </div>
          );
          } else {
          return (
              <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 text-xs">
                <div className="flex items-start gap-2">
                  <X className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800 dark:text-red-200">❌ {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Failed</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Operation did not complete successfully</p>
              </div>
              </div>
            </div>
          );
      }
      }
    } catch (error) {
      console.error('Error formatting tool result:', error);
        return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs">
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Tool completed</p>
          <p className="text-gray-700 dark:text-gray-300">{result}</p>
          </div>
        );
    }

    // Fallback for unparsed results
        return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs">
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Tool completed</p>
        <p className="text-gray-700 dark:text-gray-300">{result}</p>
          </div>
        );
  };

  const renderExecutionDetails = (execution: ExecutionData) => {
    if (!showExecutionDetails[execution.id]) return null;

    const toolCalls = execution.toolCalls || [];
    const toolResults = execution.toolResults || [];
    const thinkingContent = execution.thinkingContent || [];
    
    if (toolCalls.length === 0 && thinkingContent.length === 0) return null;
    
    // Create a combined array of all events with proper chronological ordering
    const allEvents: Array<{
      type: 'thinking' | 'tool_call';
      timestamp: string;
      data: ThinkingEvent | ToolCallEvent;
    }> = [];
    
    // Add thinking events
    thinkingContent.forEach(thinking => {
      allEvents.push({
        type: 'thinking',
        timestamp: thinking.timestamp,
        data: thinking
      });
    });
    
    // Add tool call events
    toolCalls.forEach(toolCall => {
      allEvents.push({
        type: 'tool_call',
        timestamp: toolCall.timestamp,
        data: toolCall
      });
    });
    
    // Sort all events chronologically
    allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return (
      <div className="space-y-1.5 mb-3">
        {/* Execution summary */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pb-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {execution.isComplete ? 'Completed' : 'Processing...'}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span className="text-green-600 dark:text-green-400">{execution.inputTokens.toLocaleString()}</span>
            <span className="text-gray-400 dark:text-gray-500">+</span>
            <span className="text-blue-600 dark:text-blue-400">{execution.outputTokens.toLocaleString()}</span>
            <span className="text-gray-500 dark:text-gray-400">= {execution.totalTokens.toLocaleString()} tokens</span>
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatCost(execution.totalCost)}
          </span>
        </div>

        {/* Show all events in chronological order */}
        {allEvents.map((event, idx) => {
          const key = `${event.type}-${event.data.id}-${idx}`;
    const isExpanded = expandedItems[key];
            
            if (event.type === 'thinking') {
            const thinking = event.data as ThinkingEvent;
            
              if (!isExpanded) {
                return (
                  <button
                    key={key}
                    onClick={() => toggleExpanded(key)}
                    className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1"
                  >
                    <Brain className="w-3 h-3" />
                  <span>{thinking.agent === 'planning' ? 'Planning' : 'Execution'} thoughts...</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                );
              }
              
              return (
              <div key={key} className="rounded-md bg-purple-50/50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-700">
                  <button
                    onClick={() => toggleExpanded(key)}
                    className="w-full px-2.5 py-1.5 flex items-center gap-2 text-left"
                  >
                    <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <span className="text-xs font-medium flex-1">
                    {thinking.agent === 'planning' ? 'Planning' : 'Execution'} Thoughts
                    </span>
                    <ChevronUp className="w-3 h-3 text-gray-400" />
                  </button>
                  
                  <div className="px-2.5 pb-3 pt-1">
                    <div className="bg-white dark:bg-gray-800 rounded border p-3 max-h-96 overflow-y-auto">
                      <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {thinking.content}
                </div>
              </div>
            </div>
          </div>
              );
          } else {
            // Tool call event
            const toolCall = event.data as ToolCallEvent;
            const formatted = formatToolCall(toolCall);
              const Icon = formatted.icon;
            const relatedResult = toolResults.find(r => r.tool_call_id === toolCall.id);

    return (
                <div 
                  key={key} 
                  className={cn(
                    "rounded-md border transition-all duration-200 overflow-hidden",
                  isExpanded ? "bg-gray-50 dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                    {relatedResult && formatToolResult(
                      relatedResult.result, 
                      toolCall.tool_name, 
                      execution.toolCallMap?.get(toolCall.id)?.tool_args || toolCall.tool_args,
                      execution.toolCallMap?.get(toolCall.id)?.tool_result_parsed
                    )}
                </div>
                  )}
                </div>
              );
            }
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)] flex gap-4">
        {/* Conversation History Sidebar */}
        <div className={`transition-all duration-300 ${showHistory ? 'w-80' : 'w-0'} overflow-hidden`}>
          <Card className="h-full dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 dark:text-white">
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
            <CardContent className="flex-1 overflow-y-auto">
              {conversationThreads.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No conversation history</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Start a new conversation to begin</p>
                    </div>
                  ) : (
                <div className="space-y-2">
                  {conversationThreads.map((thread) => (
                      <div
                        key={thread.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        thread.isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      } border`}
                        onClick={() => switchToThread(thread.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {thread.title}
                            </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {thread.lastMessage}
                            </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-500">
                            <span>{thread.messageCount} messages</span>
                            <span>{new Date(thread.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                            deleteConversation(thread.id);
                            }}
                          className="ml-2 p-1 h-8 w-8 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                          >
                          <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <Card className="mb-4 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="dark:text-white dark:hover:bg-gray-700"
                >
                  <History className="w-4 h-4 mr-2" />
                  {showHistory ? 'Hide History' : 'Show History'}
                </Button>
                <CardTitle className="text-lg font-semibold dark:text-white">Auxilium AI Agent</CardTitle>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {currentThreadId && (
                  <span className="text-gray-500 dark:text-gray-400">Thread: {currentThreadId.substring(0, 8)}...</span>
                )}
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">{currentPhase}</span>
              </div>
            </div>
          </CardHeader>
          </Card>

            {/* Chat Messages */}
          <Card className="flex-1 flex flex-col dark:bg-gray-800 dark:border-gray-700">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {executions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="w-16 h-16 text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 dark:text-white">Start a conversation with Auxilium</h3>
                  <p className="text-gray-600 dark:text-gray-400">I can help you manage objectives, track progress, and organize your tasks.</p>
                  </div>
              ) : (
                <div className="space-y-6">
                  {executions.map((execution, index) => (
                    <div key={execution.id} className="space-y-4">
                    {/* User Message */}
                    <div className="flex justify-end">
                        <div className="max-w-[70%] bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium opacity-90">You</span>
                          </div>
                          <p className="text-sm leading-relaxed">{execution.userMessage}</p>
                      </div>
                    </div>

                      {/* AI Response */}
                    <div className="flex justify-start">
                        <div className="max-w-[85%] bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl rounded-bl-md shadow-sm">
                          {/* AI Header */}
                          <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-2xl">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">Auxilium</span>
                              <div className="flex items-center gap-4 mt-1">
                                {execution.isComplete ? (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                      <span className="text-xs text-green-600 dark:text-green-400">Completed</span>
                        </div>
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3 text-gray-500" />
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {execution.totalTokens.toLocaleString()} tokens • {formatCost(execution.totalCost)}
                                      </span>
                            </div>
                                  </>
                          ) : (
                                  <div className="flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                    <span className="text-xs text-blue-600 dark:text-blue-400">{execution.currentPhase}</span>
                            </div>
                        )}
                              </div>
                            </div>
                            
                            {/* Show/Hide Details Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                          onClick={() => toggleExecutionDetails(execution.id)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              <span className="text-xs">{showExecutionDetails[execution.id] ? 'Hide' : 'Details'}</span>
                            </Button>
                          </div>

                          {/* Execution Details */}
                          {showExecutionDetails[execution.id] && (
                            <div className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                              {renderExecutionDetails(execution)}
                            </div>
                          )}

                          {/* Final Response */}
                          {execution.finalResponse && (
                            <div className="p-4">
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {execution.finalResponse}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                            </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t dark:border-gray-700 p-4">
            <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything..."
                  className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isStreaming}
              />
              <Button
                onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isStreaming}
                  className="px-4"
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
    </div>
  );
};

// Component that fetches and displays full objective details
const ObjectiveDetailsDisplay: React.FC<{ objectiveId: string; action: 'created' | 'updated' }> = ({ objectiveId, action }) => {
  const [objective, setObjective] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchObjective = async () => {
      try {
        console.log(`🔍 Fetching objective details for ID: ${objectiveId}`);
        setLoading(true);
        setError(null);
        
        const response = await fetch(`http://localhost:8000/api/v1/objectives/${objectiveId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch objective: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Fetched objective data:', data);
        
        // The API returns the objective data directly, not wrapped in success/objective
        if (data && data.id) {
          setObjective(data);
        } else {
          throw new Error('Invalid objective data received');
        }
      } catch (err) {
        console.error('❌ Error fetching objective:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (objectiveId) {
      fetchObjective();
    }
  }, [objectiveId]);

  if (loading) {
    return (
      <div className={`${action === 'created' ? 'bg-green-50' : 'bg-blue-50'} rounded p-3 text-xs`}>
        <div className="flex items-center gap-2">
          <Loader2 className={`w-4 h-4 ${action === 'created' ? 'text-green-600' : 'text-blue-600'} animate-spin`} />
          <p className={`font-medium ${action === 'created' ? 'text-green-800' : 'text-blue-800'}`}>
            {action === 'created' ? '✨ Loading Created Objective...' : '📝 Loading Updated Objective...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${action === 'created' ? 'bg-green-50' : 'bg-blue-50'} rounded p-3 text-xs`}>
        <div className="flex items-start gap-2">
          <CheckCircle className={`w-4 h-4 ${action === 'created' ? 'text-green-600' : 'text-blue-600'} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <p className={`font-medium ${action === 'created' ? 'text-green-800' : 'text-blue-800'}`}>
              {action === 'created' ? '✨ Objective Created Successfully' : '📝 Objective Updated Successfully'}
            </p>
            <p className="text-gray-600 mt-1">ID: {objectiveId}</p>
            <p className="text-red-600 text-xs mt-1">Could not fetch full details: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!objective) {
    return (
      <div className={`${action === 'created' ? 'bg-green-50' : 'bg-blue-50'} rounded p-3 text-xs`}>
        <div className="flex items-start gap-2">
          <CheckCircle className={`w-4 h-4 ${action === 'created' ? 'text-green-600' : 'text-blue-600'} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <p className={`font-medium ${action === 'created' ? 'text-green-800' : 'text-blue-800'}`}>
              {action === 'created' ? '✨ Objective Created Successfully' : '📝 Objective Updated Successfully'}
            </p>
            <p className="text-gray-600 mt-1">ID: {objectiveId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${action === 'created' ? 'bg-green-50' : 'bg-blue-50'} rounded p-3 text-xs space-y-3`}>
      <div className="flex items-start gap-2">
        <CheckCircle className={`w-4 h-4 ${action === 'created' ? 'text-green-600' : 'text-blue-600'} mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`font-medium ${action === 'created' ? 'text-green-800' : 'text-blue-800'}`}>
            {action === 'created' ? '✨ Created New Objective' : '📝 Updated Objective'}
          </p>
          <p className="text-gray-600 mt-1">
            {action === 'created' ? 'Successfully added to your objective system' : 'Successfully updated in your objective system'}
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded border p-3">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{objective.title}</h4>
        {objective.description && (
          <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed mb-3">{objective.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Type</p>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
              {objective.objective_type?.replace(/_/g, ' ') || 'objective'}
            </span>
          </div>
          
          {objective.priority_score !== undefined && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Priority</p>
              <span className={cn(
                "px-2 py-1 rounded font-medium",
                objective.priority_score >= 0.7 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                objective.priority_score >= 0.4 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              )}>
                {Math.round(objective.priority_score * 100)}% {
                  objective.priority_score >= 0.7 ? 'High' :
                  objective.priority_score >= 0.4 ? 'Medium' : 'Low'
                }
              </span>
            </div>
          )}
          
          {objective.start_date && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Start Date</p>
              <span className="text-gray-700 dark:text-gray-300">
                {new Date(objective.start_date).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {objective.due_date && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Due Date</p>
              <span className="text-gray-700 dark:text-gray-300">
                {new Date(objective.due_date).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {objective.estimated_duration_minutes && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Duration</p>
              <span className="text-gray-700 dark:text-gray-300">
                {objective.estimated_duration_minutes} minutes
              </span>
            </div>
          )}
          
          {objective.status && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Status</p>
              <span className={cn(
                "px-2 py-1 rounded font-medium",
                objective.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                objective.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                objective.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
              )}>
                {objective.status?.replace(/_/g, ' ') || 'not started'}
              </span>
            </div>
          )}
        </div>
        
        {objective.points_awarded_for_completion && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-yellow-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Rewards {objective.points_awarded_for_completion} points upon completion
              </span>
            </div>
          </div>
        )}
        
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>ID:</strong> {objective.id}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 