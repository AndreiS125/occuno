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
  agent: 'planning' | 'executor' | 'single';
  content: string;
  timestamp: string;
}

interface ToolCallEvent {
  id: string;
  agent: 'planning' | 'executor' | 'single';
  tool_name: string;
  tool_args: Record<string, any>;
  timestamp: string;
}

interface ToolResultEvent {
  id: string;
  agent: 'planning' | 'executor' | 'single';
  tool_name: string;
  tool_call_id: string;
  result: string;
  timestamp: string;
}

interface AgentResponseEvent {
  id: string;
  agent: 'planning' | 'executor' | 'single';
  content: string;
  timestamp: string;
}

interface ExecutionData {
  id: string;
  threadId: string;
  exchangeId: string;
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
  const [selectedAgent, setSelectedAgent] = useState<'multi' | 'single'>('multi');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');
  
  // Stop execution state
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);

  // Edit message function
  const editMessage = useCallback(async (threadId: string, exchangeId: string, newMessage: string) => {
    try {
      console.log('✏️ Editing message:', { threadId, exchangeId, newMessage });
      
      if (!exchangeId) {
        console.error('❌ No exchange ID provided for editing');
        throw new Error('No exchange ID provided for editing');
      }
      
      const response = await fetch('http://localhost:8000/api/v1/agent/edit-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: threadId,
          exchange_id: exchangeId,
          new_message: newMessage,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to edit message: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Message edited successfully:', data);
      
      // Don't clear executions here - let the rerun handle it
      // The rerun will show the new conversation properly
      
      return data;
    } catch (error) {
      console.error('❌ Error editing message:', error);
      throw error;
    }
  }, []);

  // Re-run from message function
  const rerunFromMessage = useCallback(async (threadId: string, userMessage: string) => {
    try {
      console.log('🔄 Re-running from message:', threadId, 'with message:', userMessage);
      
      // Choose endpoint based on selected agent
      const endpoint = selectedAgent === 'single' 
        ? 'http://localhost:8000/api/v1/agent/rerun-from-message/single/stream'
        : 'http://localhost:8000/api/v1/agent/rerun-from-message/stream';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: threadId,
          include_thoughts: true,
          include_tool_details: true
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to rerun from message: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body reader available');
      }
      
      setIsStreaming(true);
      setCurrentPhase('Re-running...');
      
      // Clear executions and create new one for rerun
      setExecutions([]);
      
      // Create new execution for rerun
      const newExecution: ExecutionData = {
        id: `rerun-${Date.now()}`,
        threadId: threadId,
        exchangeId: '', // Will be set when we get the exchange_id from backend
        userMessage: userMessage,
        timestamp: new Date().toISOString(),
        isComplete: false,
        currentPhase: 'Re-running...',
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
      
      setExecutions([newExecution]);
      setCurrentExecutionId(newExecution.id);
      
      // Process streaming response
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
      
      setIsStreaming(false);
      setCurrentPhase('Ready');
      
    } catch (error) {
      console.error('❌ Error re-running from message:', error);
      setCurrentPhase('Error');
      setIsStreaming(false);
      setCurrentExecutionId(null);
      
      // If rerun fails, we should reload the conversation to show the truncated history
      window.location.reload();
    }
  }, [selectedAgent]);

  // Stop execution function
  const stopExecution = useCallback(async (executionId: string) => {
    try {
      console.log('🛑 Stopping execution:', executionId);
      
      const response = await fetch('http://localhost:8000/api/v1/agent/stop-execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          execution_id: executionId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to stop execution: ${response.status}`);
      }
      
      if (data.success) {
        console.log('✅ Execution stopped successfully:', data);
        setCurrentExecutionId(null);
        setIsStreaming(false);
        setCurrentPhase('Stopped');
      } else {
        console.log('⚠️ Execution stop failed:', data.message);
        setCurrentPhase('Stop failed');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error stopping execution:', error);
      throw error;
    }
  }, []);

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
        exchangeId: exchange.id,
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
        
        // Helper function to process tool calls from a message
        const processToolCallsFromMessage = (message: any, isToolResult: boolean = false) => {
          // Handle tool_calls array (multiple tool calls)
          if (message.tool_calls && message.tool_calls.length > 0) {
            message.tool_calls.forEach((toolCall: any) => {
              const callId = toolCall.call_id || toolCall.id;
              const toolName = toolCall.name || toolCall.tool_name;
              
              if (!callId || !toolName) {
                console.log('⚠️ Skipping tool call with missing ID or name:', toolCall);
                return;
              }
              
              if (isToolResult) {
                // Add tool result
                const toolResult: ToolResultEvent = {
                  id: message.id,
                  tool_call_id: callId,
                  result: message.content,
                  timestamp: message.timestamp,
                  agent: message.agent,
                  tool_name: toolName
                };
                
                execution.toolResults.push(toolResult);
                execution.toolCallMap.set(callId, {
                  tool_name: toolName,
                  tool_args: message.tool_args || {},
                  tool_result_parsed: message.tool_result_parsed || null
                });
                
                console.log(`📊 Added tool result: ${toolName}`, {
                  call_id: callId,
                  result: message.content?.substring(0, 100)
                });
              } else {
                // Add tool call (if not already processed)
                if (!processedToolCalls.has(callId)) {
                  processedToolCalls.add(callId);
                  
                  const toolCallEvent: ToolCallEvent = {
                    id: callId,
                    tool_name: toolName,
                    tool_args: message.tool_args || {},
                    timestamp: message.timestamp,
                    agent: message.agent
                  };
                  
                  execution.toolCalls.push(toolCallEvent);
                  console.log(`🔧 Added tool call: ${toolName}`, {
                    call_id: callId,
                    args: message.tool_args
                  });
                }
              }
            });
          }
          
          // Handle single tool call (tool_name + tool_call_id)
          if (message.tool_name && message.tool_call_id) {
            const callId = message.tool_call_id;
            const toolName = message.tool_name;
            
            if (isToolResult) {
              // Add tool result
              const toolResult: ToolResultEvent = {
                id: message.id,
                tool_call_id: callId,
                result: message.content,
                timestamp: message.timestamp,
                agent: message.agent,
                tool_name: toolName
              };
              
              execution.toolResults.push(toolResult);
              execution.toolCallMap.set(callId, {
                tool_name: toolName,
                tool_args: message.tool_args || {},
                tool_result_parsed: message.tool_result_parsed || null
              });
              
              console.log(`📊 Added single tool result: ${toolName}`, {
                call_id: callId,
                result: message.content?.substring(0, 100)
              });
            } else {
              // Add tool call (if not already processed)
              if (!processedToolCalls.has(callId)) {
                processedToolCalls.add(callId);
                
                const toolCallEvent: ToolCallEvent = {
                  id: callId,
                  tool_name: toolName,
                  tool_args: message.tool_args || {},
                  timestamp: message.timestamp,
                  agent: message.agent
                };
                
                execution.toolCalls.push(toolCallEvent);
                console.log(`🔧 Added single tool call: ${toolName}`, {
                  call_id: callId,
                  args: message.tool_args
                });
              }
            }
          }
        };
        
        switch (message.message_type) {
          case 'thinking':
            // Use thinking_content field, not content field
            if (message.thinking_content && message.thinking_content.trim()) {
              execution.thinkingContent.push({
                id: message.id,
                agent: message.agent,
                content: message.thinking_content,
                timestamp: message.timestamp
              });
              console.log(`💭 Added thinking content for ${message.agent}:`, message.thinking_content.substring(0, 100));
            }
            break;
            
          case 'response':
            // Process tool calls from response messages
            processToolCallsFromMessage(message, false);
            
            // Add response content if present
            if (message.content && message.content.trim()) {
              execution.agentResponses.push({
                id: message.id,
                agent: message.agent,
                content: message.content,
                timestamp: message.timestamp
              });
              console.log(`💬 Added agent response for ${message.agent}:`, message.content.substring(0, 100));
            }
            break;
            
          case 'tool_result':
            // Process tool results
            processToolCallsFromMessage(message, true);
            break;
            
          case 'tool_call':
            // Handle explicit tool_call message type
            processToolCallsFromMessage(message, false);
            break;
            
          default:
            console.log(`⚠️ Unknown message type: ${message.message_type}`, message);
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
      // Choose endpoint based on selected agent
      const endpoint = selectedAgent === 'single' 
        ? 'http://localhost:8000/api/v1/agent/chat/single/stream'
        : 'http://localhost:8000/api/v1/agent/chat/stream';

      const response = await fetch(endpoint, {
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
        exchangeId: '', // Will be set when we get the exchange_id from backend
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
      setCurrentExecutionId(newExecution.id);
      console.log('🎯 SET CURRENT EXECUTION ID:', newExecution.id);

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
      setCurrentExecutionId(null);
    }
  }, [inputMessage, isStreaming, currentThreadId, selectedAgent]);

  const updateExecutionWithEvent = useCallback(async (event: StreamingEvent) => {
    console.log('🔥 updateExecutionWithEvent called:', {
      eventType: event.type,
      eventExecutionId: event.execution_id,
      event: event
    });
    
    setExecutions(prev => {
      console.log('🔥 setExecutions callback - prev executions:', prev.length);
      
      if (prev.length === 0) {
        console.log('🔥 No executions to update');
        return prev;
      }
      
      // Update the most recent execution (last in array) during streaming
      return prev.map((execution, index) => {
        const isLastExecution = index === prev.length - 1;
        console.log('🔥 Checking execution:', execution.id, 'isLast:', isLastExecution);
        
        if (!isLastExecution) {
          console.log('🔥 Skipping non-last execution:', execution.id);
          return execution;
        }
        
        console.log('🔥 UPDATING LAST EXECUTION with event:', event.type);

      const updated = { ...execution };

      switch (event.type) {
        case 'execution_start':
          updated.currentPhase = 'Starting...';
          if (event.thread_id) {
            updated.threadId = event.thread_id;
              setCurrentThreadId(event.thread_id);
          }
          if (event.execution_id) {
            setCurrentExecutionId(event.execution_id);
          }
          if (event.exchange_id) {
            console.log('📝 Setting exchange ID from event:', event.exchange_id);
            updated.exchangeId = event.exchange_id;
          }
          break;

        case 'initialization':
          updated.currentPhase = 'Initializing...';
          if (event.exchange_id) {
            console.log('📝 Setting exchange ID from initialization event:', event.exchange_id);
            updated.exchangeId = event.exchange_id;
          }
          break;

        case 'node_start':
          // Handle single agent node names
          if (event.agent === 'single' || selectedAgent === 'single') {
            updated.currentPhase = `Single Agent - ${event.node}`;
          } else {
            updated.currentPhase = `${event.agent} Agent - ${event.node}`;
          }
          break;

        case 'thinking':
          if (event.content && event.agent && event.thinking_id) {
            // Check for duplicates by thinking_id
            const existingThinking = updated.thinkingContent.find(t => t.id === event.thinking_id);
            if (!existingThinking) {
              updated.thinkingContent.push({
                id: event.thinking_id,
                agent: event.agent as 'planning' | 'executor' | 'single',
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
                agent: event.agent as 'planning' | 'executor' | 'single',
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
                agent: event.agent as 'planning' | 'executor' | 'single',
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
          
          // Clear current execution ID
          setCurrentExecutionId(null);
          
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
          
        case 'execution_stopped':
          updated.isComplete = true;
          updated.currentPhase = 'Stopped by user';
          updated.finalResponse = event.partial_response || updated.finalResponse;
          setCurrentPhase('Stopped');
          
          // Clear current execution ID
          setCurrentExecutionId(null);
          break;

        case 'execution_error':
          updated.isComplete = true;
          updated.currentPhase = 'Error';
          setCurrentPhase('Error');
          
          // Clear current execution ID
          setCurrentExecutionId(null);
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
      });
    });
  }, [selectedAgent]);

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
      console.log('🔍 JSON parsing debug:', { toolName, hasResult: !!result, resultLength: result?.length, toolResultParsed });
      
      if (!parsed && result) {
        console.log('🔍 Attempting direct JSON.parse on result:', result.substring(0, 100));
        try {
          parsed = JSON.parse(result);
          console.log('✅ Direct JSON.parse succeeded:', parsed);
        } catch (parseError: any) {
          console.warn('❌ Direct JSON.parse failed:', parseError.message);
          // For known tools that should return JSON, try to handle the raw result
          if (toolName === 'retrieve_objective_by_name' || toolName === 'retrieve_objective_by_id' || 
              toolName === 'create_objective' || toolName === 'update_objective' || 
              toolName === 'delete_objective' || toolName === 'save_user_memory') {
            console.log('🔍 Attempting enhanced JSON extraction for:', toolName);
            // Try to extract JSON from the string if it's wrapped
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            console.log('🔍 JSON match found:', !!jsonMatch, jsonMatch?.[0]?.substring(0, 100));
            if (jsonMatch) {
              try {
                parsed = JSON.parse(jsonMatch[0]);
                console.log('✅ Successfully extracted JSON from result:', parsed);
              } catch (extractError: any) {
                console.warn('❌ Failed to extract JSON from result:', extractError.message);
                console.log('🔍 Raw matched JSON:', jsonMatch[0]);
              }
            } else {
              console.warn('❌ No JSON match found in result');
            }
          } else {
            console.log('🔍 Tool not in enhanced extraction list:', toolName);
          }
          
          // If still no parsed data, treat as plain text
          if (!parsed) {
            return (
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs">
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Tool completed</p>
                <p className="text-gray-700 dark:text-gray-300">{result}</p>
              </div>
            );
          }
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
          
        case 'retrieve_objective_by_name':
        case 'retrieve_objective_by_id':
          if (parsed?.matches && Array.isArray(parsed.matches)) {
            const matches = parsed.matches;
            return (
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <Search className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200">🔍 Objective Search Results</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {toolName === 'retrieve_objective_by_name' ? `Search: "${toolArgs?.name || 'unknown'}"` : `ID: ${toolArgs?.objective_id || 'unknown'}`} • {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
                    </p>
                  </div>
                </div>
                
                {matches.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 max-h-64 overflow-y-auto">
                    <div className="p-3 space-y-2">
                      {matches.map((obj: any, index: number) => (
                        <div key={obj.id || index} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-2 last:pb-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">{obj.title}</p>
                              {obj.description && (
                                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 line-clamp-2">{obj.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {obj.start_date && (
                                  <span className="text-xs text-gray-500 dark:text-gray-500">📅 {obj.start_date.split('T')[0]}</span>
                                )}
                                {obj.priority_score !== undefined && (
                                  <span className="text-xs text-gray-500 dark:text-gray-500">⭐ {Math.round(obj.priority_score * 100)}%</span>
                                )}
                                {obj.objective_type && (
                                  <span className="text-xs text-gray-500 dark:text-gray-500">🏷️ {obj.objective_type}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className={cn(
                                "px-2 py-1 rounded font-medium text-xs",
                                obj.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                obj.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                obj.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                              )}>
                                {obj.status?.replace(/_/g, ' ') || 'not started'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Show objective ID */}
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <strong>ID:</strong> {obj.id}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {matches.length === 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-xs">No objectives found matching the search criteria</p>
                  </div>
                )}
              </div>
            );
          } else if (parsed?.success === false) {
            return (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-3 text-xs">
                <div className="flex items-start gap-2">
                  <Search className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">🔍 Search Complete</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {parsed.message || 'No objectives found matching the search criteria'}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          break;
          
        case 'final_response_to_user':
          // Handle the single-agent final response tool with beautiful custom display
          if (parsed?.response_content || parsed?.response) {
            const responseContent = parsed.response_content || parsed.response;
            const actionSummary = parsed.action_summary || parsed.action_summary_content;
            const metadata = parsed.metadata || {};
            const interactionComplete = parsed.interaction_complete !== false;
            
            return (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 text-sm space-y-4 border-2 border-green-200 dark:border-green-700 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 dark:bg-green-800 rounded-full p-3">
                    <Sparkles className="w-6 h-6 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-bold text-green-800 dark:text-green-200 text-lg">
                        ✨ Task Complete
                      </h3>
                      {interactionComplete && (
                        <span className="bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                          ✓ Finished
                        </span>
                      )}
                    </div>
                    
                    {/* Beautiful response content with custom styling */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-green-100 dark:border-green-800 p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-300 font-semibold text-sm">Response</span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                        >
                          {responseContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                    
                    {/* Action summary with beautiful styling */}
                    {actionSummary && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-800 dark:text-blue-200 font-semibold text-sm">What I Did</span>
                        </div>
                        <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                          {actionSummary}
                        </p>
                      </div>
                    )}
                    
                    {/* Metadata with beautiful cards */}
                    {metadata && Object.keys(metadata).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {metadata.response_length && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-purple-700 dark:text-purple-300 font-medium text-xs">Length</span>
                            </div>
                            <p className="text-purple-800 dark:text-purple-200 font-bold text-sm mt-1">
                              {metadata.response_length} chars
                            </p>
                          </div>
                        )}
                        {metadata.completion_time && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-amber-700 dark:text-amber-300 font-medium text-xs">Completed</span>
                            </div>
                            <p className="text-amber-800 dark:text-amber-200 font-bold text-sm mt-1">
                              {new Date(metadata.completion_time).toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                        {metadata.has_action_summary !== undefined && (
                          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3 border border-cyan-200 dark:border-cyan-700">
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                              <span className="text-cyan-700 dark:text-cyan-300 font-medium text-xs">Summary</span>
                            </div>
                            <p className="text-cyan-800 dark:text-cyan-200 font-bold text-sm mt-1">
                              {metadata.has_action_summary ? '✓ Included' : '✗ None'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
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
          console.log('🎯 create_objective case matched!', { parsed, toolName });
          if (parsed?.success && parsed?.id) {
            console.log('✅ Using ObjectiveDetailsDisplay for ID:', parsed.id);
            // Create a component that fetches and displays the full objective details
            return <ObjectiveDetailsDisplay objectiveId={parsed.id} action="created" />;
          } else if (parsed?.success) {
            console.log('⚠️ Using fallback display (no ID)');
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
          } else {
            console.log('❌ create_objective case matched but conditions failed:', { success: parsed?.success, id: parsed?.id });
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
          console.log('⚠️ DEFAULT case reached for tool:', toolName, { parsed, result: result?.substring(0, 200) });
          if (parsed?.success) {
            return (
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200">✅ {toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Completed</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Operation completed successfully</p>
                    {/* Show parsed data for debugging */}
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(parsed, null, 2)}
                      </pre>
                    </details>
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

  const getAgentDisplayName = (agent: 'planning' | 'executor' | 'single') => {
    switch (agent) {
      case 'planning':
        return 'Planning';
      case 'executor':
        return 'Execution';
      case 'single':
        return 'Single Agent';
      default:
        return agent;
    }
  };

  const renderExecutionDetails = (execution: ExecutionData) => {
    if (!showExecutionDetails[execution.id]) return null;

    const allEvents: any[] = [];
    
    // Add thinking events
    execution.thinkingContent.forEach(thinking => {
      allEvents.push({
        type: 'thinking',
        timestamp: thinking.timestamp,
        data: thinking,
        agent: thinking.agent
      });
    });
    
    // Add tool call events (filter out final_response_to_user as it's shown as completion cards)
    execution.toolCalls
      .filter(toolCall => toolCall.tool_name !== 'final_response_to_user')
      .forEach(toolCall => {
        allEvents.push({
          type: 'tool_call',
          timestamp: toolCall.timestamp,
          data: toolCall,
          agent: toolCall.agent
        });
      });
    
    // Sort by timestamp
    allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return (
      <div className="space-y-2">
        {allEvents.map((event, index) => {
          const key = `${event.type}-${index}`;
          const isExpanded = expandedItems[key];
          
          if (event.type === 'thinking') {
            const thinking = event.data as ThinkingEvent;
            
            if (!isExpanded) {
              // Collapsed thinking view
              return (
                <button
                  key={key}
                  onClick={() => toggleExpanded(key)}
                  className="w-full rounded-md bg-purple-50/50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-700 px-2.5 py-1.5 flex items-center gap-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/50 transition-colors"
                >
                  <Brain className="w-3 h-3" />
                  <span>{getAgentDisplayName(thinking.agent)} thoughts...</span>
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
                      {getAgentDisplayName(thinking.agent)} Thoughts
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
            const relatedResult = execution.toolResults.find(r => r.tool_call_id === toolCall.id);

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
                <CardTitle className="text-lg font-semibold dark:text-white">
                  Auxilium AI Agent
                </CardTitle>
                
                {/* Agent Selection Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Agent:</span>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setSelectedAgent('multi')}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all duration-200",
                        selectedAgent === 'multi'
                          ? "bg-blue-500 text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      )}
                      disabled={isStreaming}
                    >
                      Multi-Agent
                    </button>
                    <button
                      onClick={() => setSelectedAgent('single')}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all duration-200",
                        selectedAgent === 'single'
                          ? "bg-green-500 text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      )}
                      disabled={isStreaming}
                    >
                      Single Agent
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {currentThreadId && (
                  <span className="text-gray-500 dark:text-gray-400">Thread: {currentThreadId.substring(0, 8)}...</span>
                )}
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">{currentPhase}</span>
                </div>
                
                {/* Stop Execution Button */}
                {isStreaming && currentExecutionId && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (currentExecutionId) {
                        stopExecution(currentExecutionId);
                      }
                    }}
                    className="h-7 px-3 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                )}
                
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {selectedAgent === 'multi' ? 'Planning + Execution' : 'Streamlined'}
                  </Badge>
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
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    I can help you manage objectives, track progress, and organize your tasks.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                      {selectedAgent === 'multi' ? '🧠 Multi-Agent System' : '⚡ Single Agent System'}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {selectedAgent === 'multi' 
                        ? 'Comprehensive planning and execution with detailed analysis'
                        : 'Streamlined, efficient responses with faster processing'
                      }
                    </p>
                  </div>
                  </div>
              ) : (
                <div className="space-y-6">
                  {executions.map((execution, index) => (
                    <div key={execution.id} className="space-y-4">
                    {/* User Message */}
                    <div className="flex justify-end">
                        <div className="max-w-[70%] bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm group relative">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium opacity-90">You</span>
                            
                            {/* Edit Button */}
                            {execution.isComplete && execution.exchangeId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  console.log('📝 Edit button clicked, execution:', { id: execution.id, exchangeId: execution.exchangeId, threadId: execution.threadId });
                                  setEditingMessageId(execution.id);
                                  setEditingMessage(execution.userMessage);
                                }}
                                className="ml-auto p-1 h-6 w-6 text-white/70 hover:text-white hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          
                          {/* Message Content or Edit Input */}
                          {editingMessageId === execution.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingMessage}
                                onChange={(e) => setEditingMessage(e.target.value)}
                                className="text-sm bg-white text-gray-900 border-0 resize-none"
                                rows={3}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    e.preventDefault();
                                    // Save and re-run
                                    const handleEditAndRerun = async () => {
                                      try {
                                        await editMessage(execution.threadId, execution.exchangeId, editingMessage);
                                        setEditingMessageId(null);
                                        setEditingMessage('');
                                        await rerunFromMessage(execution.threadId, editingMessage);
                                      } catch (error) {
                                        console.error('Error editing and re-running:', error);
                                      }
                                    };
                                    handleEditAndRerun();
                                  } else if (e.key === 'Escape') {
                                    setEditingMessageId(null);
                                    setEditingMessage('');
                                  }
                                }}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingMessageId(null);
                                    setEditingMessage('');
                                  }}
                                  className="text-white/70 hover:text-white hover:bg-blue-600 h-6 px-2 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await editMessage(execution.threadId, execution.exchangeId, editingMessage);
                                      setEditingMessageId(null);
                                      setEditingMessage('');
                                      await rerunFromMessage(execution.threadId, editingMessage);
                                    } catch (error) {
                                      console.error('Error editing and re-running:', error);
                                    }
                                  }}
                                  className="text-white/70 hover:text-white hover:bg-blue-600 h-6 px-2 text-xs"
                                >
                                  Save & Re-run
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{execution.userMessage}</p>
                          )}
                      </div>
                    </div>

                      {/* AI Response */}
                    <div className="flex justify-start">
                        <div className="max-w-[85%] bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl rounded-bl-md shadow-sm">
                          {/* AI Header */}
                          <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-2xl">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              selectedAgent === 'multi' 
                                ? "bg-blue-100 dark:bg-blue-900/40"
                                : "bg-green-100 dark:bg-green-900/40"
                            )}>
                              {selectedAgent === 'multi' ? (
                                <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                              )}
                          </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Auxilium</span>
                                <Badge variant="outline" className="text-xs">
                                  {selectedAgent === 'multi' ? 'Multi-Agent' : 'Single Agent'}
                                </Badge>
                              </div>
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
              <div className="flex gap-2 items-end">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Ask me anything... (${selectedAgent === 'multi' ? 'Multi-Agent' : 'Single Agent'} mode)`}
                  className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 min-h-[44px] max-h-[200px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isStreaming}
                  style={{
                    height: 'auto',
                    minHeight: '44px',
                    maxHeight: '200px',
                    overflowY: inputMessage.split('\n').length > 8 ? 'auto' : 'hidden'
                  }}
                  onInput={(e) => {
                    const textarea = e.target as HTMLTextAreaElement;
                    textarea.style.height = 'auto';
                    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isStreaming}
                  className="px-4 h-11"
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