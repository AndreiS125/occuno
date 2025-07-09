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
    
    exchanges.forEach((exchange: any, exchangeIndex: number) => {
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
            <div className="bg-gray-50 rounded p-2 text-xs">
              <p className="text-gray-700">{result}</p>
            </div>
          );
        }
      }
      
      if (!parsed) {
        console.warn('No parsed data available for tool result');
        return (
          <div className="bg-gray-50 rounded p-2 text-xs">
            <p className="text-gray-600">No result data available</p>
          </div>
        );
      }
      
      console.log('📊 Parsed tool result:', parsed);
      
      switch (toolName) {
        case 'retrieve_objectives_by_time_period':
          if (parsed?.objectives && Array.isArray(parsed.objectives)) {
            const timeRange = parsed.period ? 
              `${new Date(parsed.period.start).toLocaleDateString()} - ${new Date(parsed.period.end).toLocaleDateString()}` : 
              'Selected period';
            
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
          
        case 'save_user_memory':
          if (parsed?.success && parsed?.memory) {
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
                    </div>
                  </div>
                </div>
              </div>
            );
          } else if (parsed?.success) {
            // Fallback for memory saves without detailed memory object
            return (
              <div className="bg-amber-50 rounded p-3 text-xs">
                <div className="flex items-start gap-2">
                  <Save className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">💾 Memory Saved</p>
                    <p className="text-gray-600 mt-1">Successfully saved to your knowledge base</p>
                  </div>
                </div>
                {parsed.message && (
                  <div className="bg-white rounded border p-2 mt-2">
                    <p className="text-gray-700 text-xs">{parsed.message}</p>
                  </div>
                )}
              </div>
            );
          }
          break;
          
        case 'create_objective':
          if (parsed?.success && parsed?.objective) {
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
                  </div>
                  
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
          }
          break;
          
        case 'plan':
          if (parsed?.plan_content || toolArgs?.plan_details) {
            const planContent = parsed?.plan_content || toolArgs?.plan_details;
            return (
              <div className="bg-cyan-50 rounded p-3 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-cyan-800">🧠 Execution Plan Created</p>
                    <p className="text-gray-600 mt-1">Strategic plan ready for implementation</p>
                  </div>
                </div>
                
                <div className="bg-white rounded border p-3">
                  <p className="text-xs font-semibold text-gray-800 mb-2">📋 Execution Plan</p>
                  <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {planContent}
                  </div>
                </div>
              </div>
            );
          }
          break;
          
        case 'final_response':
          if (parsed?.analysis || toolArgs?.analysis) {
            const analysis = parsed?.analysis || toolArgs?.analysis;
            const summary = parsed?.summary || toolArgs?.summary;
            
            return (
              <div className="bg-blue-50 rounded p-3 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800">🧠 Planning Analysis Complete</p>
                    <p className="text-gray-600 mt-1">Strategic recommendations ready for execution</p>
                  </div>
                </div>
                
                {analysis && (
                  <div className="bg-white rounded border p-3">
                    <p className="text-xs font-semibold text-gray-800 mb-2">📋 Strategic Analysis</p>
                    <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {analysis}
                    </div>
                  </div>
                )}
                
                {summary && (
                  <div className="bg-blue-100 rounded p-3">
                    <p className="text-xs font-semibold text-blue-800 mb-2">📝 Summary</p>
                    <p className="text-xs text-blue-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
                  </div>
                )}
              </div>
            );
          }
          break;
          
        case 'final_response_to_user':
          const responseContent = toolArgs?.response_content || parsed?.response_content;
          const actionSummary = toolArgs?.action_summary || parsed?.action_summary;
          
          if (responseContent) {
            return (
              <div className="bg-green-50 rounded p-3 text-xs space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="font-medium text-green-800">🎯 Task Completed Successfully</p>
                </div>
                
                <div className="bg-white rounded border p-3">
                  <p className="text-xs font-semibold text-gray-800 mb-2">📝 Final Response</p>
                  <div className="text-xs text-gray-700 leading-relaxed max-h-48 overflow-y-auto prose prose-xs max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {responseContent}
                    </ReactMarkdown>
                  </div>
                </div>
                
                {actionSummary && (
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
          break;
          
        default:
          // Generic success/failure handling
          if (parsed?.success === true) {
            return (
              <div className="bg-green-50 rounded p-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-green-800">✓ Operation completed successfully</p>
                </div>
                {parsed.message && <p className="text-gray-600 mt-1">{parsed.message}</p>}
              </div>
            );
          } else if (parsed?.success === false || parsed?.error) {
            return (
              <div className="bg-red-50 rounded p-2 text-xs">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-red-600" />
                  <p className="text-red-800">✗ Operation failed</p>
                </div>
                {parsed.error && <p className="text-gray-600 mt-1">{parsed.error}</p>}
              </div>
            );
          }
          
          // Fallback: show raw content if we can't parse it nicely
          if (parsed && typeof parsed === 'object') {
            return (
              <div className="bg-gray-50 rounded p-2 text-xs">
                <p className="text-gray-700 font-medium mb-1">Tool Result:</p>
                <pre className="text-gray-600 whitespace-pre-wrap text-xs overflow-x-auto max-h-32">
                  {JSON.stringify(parsed, null, 2)}
                </pre>
              </div>
            );
          }
          
          break;
      }
      
      // Default fallback - show raw result
      return (
        <div className="bg-gray-50 rounded p-2 text-xs">
          <p className="text-gray-600 font-medium mb-1">Tool completed</p>
          {result && (
            <div className="bg-white rounded border p-2 mt-1">
              <p className="text-gray-700 text-xs">{result}</p>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error formatting tool result:', error);
      return (
        <div className="bg-red-50 rounded p-2 text-xs">
          <p className="text-red-600">Error displaying result</p>
          {result && (
            <div className="bg-white rounded border p-2 mt-1">
              <p className="text-gray-700 text-xs">{result}</p>
            </div>
          )}
        </div>
      );
    }
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
        <div className="flex items-center gap-3 text-xs text-gray-500 pb-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {execution.isComplete ? 'Completed' : 'Processing...'}
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span className="text-green-600">{execution.inputTokens.toLocaleString()}</span>
            <span className="text-gray-400">+</span>
            <span className="text-blue-600">{execution.outputTokens.toLocaleString()}</span>
            <span className="text-gray-500">= {execution.totalTokens.toLocaleString()} tokens</span>
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
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  <Brain className="w-3 h-3" />
                  <span>{thinking.agent === 'planning' ? 'Planning' : 'Execution'} thoughts...</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              );
            }
            
            return (
              <div key={key} className="rounded-md bg-purple-50/50 border border-purple-100">
                <button
                  onClick={() => toggleExpanded(key)}
                  className="w-full px-2.5 py-1.5 flex items-center gap-2 text-left"
                >
                  <Brain className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span className="text-xs font-medium flex-1">
                    {thinking.agent === 'planning' ? 'Planning' : 'Execution'} Thoughts
                  </span>
                  <ChevronUp className="w-3 h-3 text-gray-400" />
                </button>
                
                <div className="px-2.5 pb-3 pt-1">
                  <div className="bg-white rounded border p-3 max-h-96 overflow-y-auto">
                    <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
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
                  {conversationThreads.length === 0 ? (
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
                                {new Date(thread.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
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
                        {/* Integrated Execution Details */}
                        {renderExecutionDetails(execution)}
                        
                        {/* Main message content */}
                        {execution.finalResponse ? (
                          <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeSanitize]}
                            >
                              {execution.finalResponse}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Processing your request...</span>
                          </div>
                        )}

                        {/* Show/Hide Details Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExecutionDetails(execution.id)}
                          className="mt-2 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {showExecutionDetails[execution.id] ? 'Hide' : 'Show'} details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t bg-white p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1"
                disabled={isStreaming}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isStreaming || !inputMessage.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage; 