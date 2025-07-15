"""
Agent API Endpoints

This module provides the FastAPI endpoints for interacting with the AI agent system.
"""

from typing import Optional, Dict, Any, AsyncGenerator
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import uuid
import json
import asyncio
from datetime import datetime

from agents.agent_graph import AgentGraph
from agents.single_agent_graph import SingleAgentGraph, StreamingSingleAgentGraph
from agents.memory_system import MemorySystem
from core.logging_config import get_logger

logger = get_logger("agent_api")
router = APIRouter(tags=["agent"])

# Global agent instances (using string annotations for forward reference)
agent_graph: Optional['StreamingAgentGraph'] = None
single_agent_graph: Optional['StreamingSingleAgentGraph'] = None


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., description="User's message to the agent")
    thread_id: Optional[str] = Field(None, description="Optional conversation thread ID")


class StreamingChatRequest(BaseModel):
    """Request model for streaming chat endpoint"""
    message: str = Field(..., description="User's message to the agent")
    thread_id: Optional[str] = Field(None, description="Optional conversation thread ID")
    include_thoughts: bool = Field(True, description="Include AI thinking process")
    include_tool_details: bool = Field(True, description="Include detailed tool information")


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str = Field(..., description="Agent's response")
    thread_id: str = Field(..., description="Conversation thread ID")
    agent_used: str = Field(..., description="Which agents were used")
    success: bool = Field(..., description="Whether the request was successful")


class ThreadResponse(BaseModel):
    """Response model for thread operations"""
    thread_id: str
    success: bool
    message: str


class EditMessageRequest(BaseModel):
    """Request model for editing messages"""
    thread_id: str = Field(..., description="Thread ID containing the message to edit")
    exchange_id: str = Field(..., description="Exchange ID of the message to edit")
    new_message: str = Field(..., description="New message content")


class EditMessageResponse(BaseModel):
    """Response model for editing messages"""
    success: bool
    message: str
    thread_id: str
    exchange_id: str


class StopExecutionRequest(BaseModel):
    """Request model for stopping execution"""
    execution_id: str = Field(..., description="Execution ID to stop")


class StopExecutionResponse(BaseModel):
    """Response model for stopping execution"""
    success: bool
    message: str
    execution_id: str


class RerunFromMessageRequest(BaseModel):
    """Request model for rerunning from message"""
    thread_id: str = Field(..., description="Thread ID to rerun from")
    include_thoughts: bool = Field(True, description="Include AI thinking process")
    include_tool_details: bool = Field(True, description="Include detailed tool information")


class StreamingAgentGraph(AgentGraph):
    """Enhanced AgentGraph with streaming capabilities"""
    
    def __init__(self):
        super().__init__()
        self.event_queue = asyncio.Queue()
        self.streaming_active = False
        self.current_execution_id = None
        self.current_thread_id = None
        self.current_exchange_id = None
        self.final_response_emitted = False
        self.original_planning_agent_method = None
        self.original_executor_agent_method = None
        
        # Store tool calls to associate with results
        self.pending_tool_calls = {}  # tool_call_id -> {tool_name, tool_args, agent}
        
        # Stop execution support
        self.stop_requested = False
        self.stop_lock = asyncio.Lock()
        self.active_executions = {}  # execution_id -> {thread_id, exchange_id, stop_event}
    
    async def emit_event(self, event: Dict[str, Any]):
        """Emit a streaming event"""
        if self.streaming_active:
            event['timestamp'] = datetime.now().isoformat()
            event['execution_id'] = self.current_execution_id
            
            # Put event in queue with immediate notification
            await self.event_queue.put(event)
            
            # Also store streaming events in memory system
            if self.current_thread_id and self.current_exchange_id:
                await self.memory_system.add_streaming_event(
                    self.current_thread_id,
                    self.current_exchange_id,
                    event.get('type', 'unknown'),
                    event.get('agent', 'system'),
                    event.get('content', ''),
                    event
                )
    
    async def request_stop(self, execution_id: str) -> bool:
        """Request to stop a specific execution"""
        async with self.stop_lock:
            if execution_id in self.active_executions:
                execution_info = self.active_executions[execution_id]
                execution_info['stop_event'].set()
                
                # Emit stop event
                await self.emit_event({
                    'type': 'execution_stop_requested',
                    'execution_id': execution_id,
                    'thread_id': execution_info['thread_id'],
                    'exchange_id': execution_info['exchange_id']
                })
                
                logger.info(f"🛑 Stop requested for execution {execution_id}")
                return True
            else:
                logger.warning(f"❌ Execution {execution_id} not found in active executions")
                return False
    
    async def check_stop_requested(self) -> bool:
        """Check if stop has been requested for current execution"""
        if self.current_execution_id in self.active_executions:
            execution_info = self.active_executions[self.current_execution_id]
            return execution_info['stop_event'].is_set()
        return False
    
    async def cleanup_execution(self, execution_id: str):
        """Clean up execution tracking"""
        async with self.stop_lock:
            if execution_id in self.active_executions:
                del self.active_executions[execution_id]
                logger.info(f"🧹 Cleaned up execution {execution_id}")
    
    async def process_user_input_streaming(self, user_input: str, thread_id: Optional[str] = None):
        """Process user input with streaming events"""
        self.streaming_active = True
        self.current_execution_id = str(uuid.uuid4())
        self.final_response_emitted = False
        self.pending_tool_calls = {}  # Reset for new execution
        
        try:
            logger.info(f"🎬 StreamingAgentGraph: Starting processing for: {user_input[:100]}...")
            
            # Create or get thread ID
            if not thread_id:
                thread_id = await self.memory_system.create_new_thread()
                logger.info(f"🆕 Created new thread: {thread_id}")
            
            self.current_thread_id = thread_id
            
            # Start new exchange
            exchange_id = await self.memory_system.start_new_exchange(thread_id, user_input)
            self.current_exchange_id = exchange_id
            
            # Register this execution for stop requests
            stop_event = asyncio.Event()
            async with self.stop_lock:
                self.active_executions[self.current_execution_id] = {
                    'thread_id': thread_id,
                    'exchange_id': exchange_id,
                    'stop_event': stop_event
                }
                logger.info(f"📝 Registered execution {self.current_execution_id} for stopping")
                logger.info(f"📝 Active executions now: {list(self.active_executions.keys())}")
            
            # Emit start event
            await self.emit_event({
                'type': 'execution_start',
                'message': user_input,
                'thread_id': thread_id,
                'exchange_id': exchange_id
            })
            
            # Emit initialization event
            await self.emit_event({
                'type': 'initialization',
                'thread_id': thread_id,
                'exchange_id': exchange_id,
                'user_input': user_input
            })
            
            # Override the node methods to capture original thinking content
            self._setup_streaming_overrides()
            
            # Start processing with streaming and stop checks
            final_response = await self._process_with_streaming(user_input, thread_id)
            
            # Check if execution was stopped
            if await self.check_stop_requested():
                logger.info("🛑 Execution was stopped by user request")
                await self.emit_event({
                    'type': 'execution_stopped',
                    'thread_id': thread_id,
                    'exchange_id': exchange_id,
                    'partial_response': final_response
                })
                # Still store partial response in memory
                await self.memory_system.set_final_response(thread_id, exchange_id, f"[EXECUTION STOPPED] {final_response}")
                return final_response
            
            logger.info(f"✅ StreamingAgentGraph: Processing complete, final response: {final_response[:100]}...")
            
            # Store final response in memory
            await self.memory_system.set_final_response(thread_id, exchange_id, final_response)
            
            # Only emit final response if we haven't already emitted a real one from final_response_to_user tool
            if not self.final_response_emitted:
                await self.emit_event({
                    'type': 'final_response',
                    'response': final_response,
                    'thread_id': thread_id,
                    'exchange_id': exchange_id
                })
                logger.info("📤 Emitted fallback final response")
            else:
                logger.info("⏭️ Skipped fallback final response (real one already emitted)")
            
            # Emit completion event
            await self.emit_event({
                'type': 'execution_complete',
                'thread_id': thread_id,
                'exchange_id': exchange_id,
                'success': True
            })
            
            logger.info(f"🏁 StreamingAgentGraph: Workflow completed successfully")
            
        except Exception as e:
            logger.error(f"❌ StreamingAgentGraph error: {e}")
            await self.emit_event({
                'type': 'execution_error',
                'error': str(e),
                'thread_id': thread_id,
                'exchange_id': self.current_exchange_id
            })
            raise
        finally:
            self.streaming_active = False
            self.pending_tool_calls = {}
            self._restore_original_methods()
            # Clean up execution tracking
            if hasattr(self, 'current_execution_id') and self.current_execution_id:
                await self.cleanup_execution(self.current_execution_id)
    
    async def _process_with_streaming(self, user_input: str, thread_id: str) -> str:
        """Process the user input with detailed streaming events"""
        from langchain_core.messages import HumanMessage
        from langchain_core.runnables import RunnableConfig
        
        # Create initial state
        initial_state = {
            "messages": [HumanMessage(content=user_input)],
            "thread_id": thread_id
        }
        
        # Configure the run
        config = RunnableConfig(
            configurable={"thread_id": thread_id},
            recursion_limit=500  # Increased limit to prevent premature stopping
        )
        
        # Stream execution with detailed events
        final_state = None
        async for chunk in self.graph.astream(initial_state, config):
            # Check if stop was requested
            if await self.check_stop_requested():
                logger.info("🛑 Stopping execution due to user request")
                await self.emit_event({
                    'type': 'execution_stopping',
                    'thread_id': thread_id,
                    'reason': 'user_request'
                })
                break
            
            await self._emit_chunk_events(chunk)
            # Keep track of the final state
            final_state = chunk
        
        # Extract final response from the streaming state
        if final_state:
            return self._extract_final_response_from_state(final_state)
        else:
            return "No response generated"
    
    async def _emit_chunk_events(self, chunk: Dict[str, Any]):
        """Emit detailed events for each chunk"""
        for node_name, node_data in chunk.items():
            agent = self._get_agent_from_node(node_name)
            
            # Emit node start
            await self.emit_event({
                'type': 'node_start',
                'node': node_name,
                'agent': agent
            })
            
            # Process messages in the chunk
            messages = node_data.get('messages', [])
            for message in messages:
                await self._emit_message_events(message, node_name)
            
            # Emit node complete
            await self.emit_event({
                'type': 'node_complete',
                'node': node_name,
                'agent': agent
            })
    
    async def _emit_message_events(self, message, node_name: str):
        """Emit events for individual messages"""
        msg_type = type(message).__name__
        agent = self._get_agent_from_node(node_name)
        
        if msg_type == 'AIMessage':
            # Handle AI message content
            content = getattr(message, 'content', '')
            tool_calls = getattr(message, 'tool_calls', [])
            usage_metadata = getattr(message, 'usage_metadata', {})
            
            logger.info(f"🔍 AI Message content type: {type(content)}")
            logger.info(f"🔍 AI Message content preview: {str(content)[:200]}")
            
            # Store agent message in memory system
            if self.current_thread_id and self.current_exchange_id:
                await self.memory_system.add_agent_message(
                    self.current_thread_id,
                    self.current_exchange_id,
                    agent,
                    str(content),
                    "response",
                    "",  # thinking content captured separately
                    tool_calls
                )
            
            # Handle content - thinking is now captured directly in agent overrides
            if isinstance(content, list):
                logger.info(f"📋 Processing structured content with {len(content)} parts")
                
                # Handle text content (thinking is captured separately)
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        text_content = part.get("text", "")
                        if text_content:
                            await self.emit_event({
                                'type': 'agent_response',
                                'agent': agent,
                                'content': text_content
                            })
            else:
                # Handle string content as regular agent response
                content_str = str(content).strip()
                if content_str:
                    await self.emit_event({
                        'type': 'agent_response',
                        'agent': agent,
                        'content': content_str
                    })
            
            # Emit token usage
            if usage_metadata:
                await self.emit_event({
                    'type': 'token_usage',
                    'agent': agent,
                    'input_tokens': usage_metadata.get('input_tokens', 0),
                    'output_tokens': usage_metadata.get('output_tokens', 0),
                    'total_tokens': usage_metadata.get('total_tokens', 0)
                })
            
            # Emit individual tool calls and store them for later association with results
            for tool_call in tool_calls:
                tool_call_id = tool_call.get('id')
                tool_name = tool_call.get('name')
                tool_args = tool_call.get('args', {})
                
                # Store tool call for later association with result
                if tool_call_id:
                    self.pending_tool_calls[tool_call_id] = {
                        'tool_name': tool_name,
                        'tool_args': tool_args,
                        'agent': agent
                    }
                
                await self.emit_event({
                    'type': 'tool_call',
                    'agent': agent,
                    'tool_name': tool_name,
                    'tool_id': tool_call_id,
                    'tool_args': tool_args,
                    'tool_call_id': tool_call_id
                })
        
        elif msg_type == 'ToolMessage':
            # Emit tool result
            tool_name = getattr(message, 'name', 'unknown')
            tool_content = getattr(message, 'content', '')
            tool_call_id = getattr(message, 'tool_call_id', 'unknown')
            
            # Get associated tool call data
            tool_call_data = self.pending_tool_calls.get(tool_call_id, {})
            tool_args = tool_call_data.get('tool_args', {})
            
            # Store enhanced tool result in memory system
            if self.current_thread_id and self.current_exchange_id:
                # Create enhanced agent message with tool args
                message_obj = await self.memory_system.add_agent_message(
                    self.current_thread_id,
                    self.current_exchange_id,
                    agent,
                    tool_content,
                    "tool_result",
                    "",
                    [{"name": tool_name, "call_id": tool_call_id}]
                )
                
                # If we got the message object back, enhance it with tool args
                if message_obj:
                    message_obj.tool_args = tool_args
                    message_obj.tool_name = tool_name
                    message_obj.tool_call_id = tool_call_id
                    
                    # Save the enhanced message
                    history = await self.memory_system.get_conversation_history(self.current_thread_id)
                    await self.memory_system.save_conversation_history(history)
            
            # Check if this is a final response tool
            if tool_name == 'final_response_to_user':
                try:
                    result_data = json.loads(tool_content)
                    final_response_content = result_data.get('response_content', '')
                    if final_response_content:
                        # Store the final response in memory
                        if self.current_thread_id and self.current_exchange_id:
                            await self.memory_system.set_final_response(
                                self.current_thread_id, 
                                self.current_exchange_id, 
                                final_response_content
                            )
                        
                        # Emit the actual final response
                        await self.emit_event({
                            'type': 'final_response',
                            'response': final_response_content,
                            'agent': agent
                        })
                        # Mark that we've emitted a real final response
                        self.final_response_emitted = True
                        logger.info(f"🏁 Emitted real final response: {final_response_content[:100]}...")
                except Exception as e:
                    logger.error(f"❌ Error parsing final_response_to_user: {e}")
            
            await self.emit_event({
                'type': 'tool_result',
                'agent': agent,
                'tool_name': tool_name,
                'tool_call_id': tool_call_id,
                'tool_args': tool_args,  # Include tool args in the event
                'result': tool_content,
                'tool_result_id': str(uuid.uuid4())
            })
            
            # Clean up the pending tool call
            if tool_call_id in self.pending_tool_calls:
                del self.pending_tool_calls[tool_call_id]
        
        elif msg_type == 'HumanMessage':
            content = getattr(message, 'content', '')
            await self.emit_event({
                'type': 'user_message',
                'content': content
            })
    
    def _get_agent_from_node(self, node_name: str) -> str:
        """Get agent type from node name"""
        if 'planning' in node_name.lower():
            return 'planning'
        elif 'executor' in node_name.lower():
            return 'executor'
        else:
            return 'system'
    
    def _extract_final_response_from_state(self, final_state: Dict[str, Any]) -> str:
        """Extract final response from the streaming state"""
        # Check each node's data for final response content
        for node_name, node_data in final_state.items():
            if node_name == 'finalize':
                final_response = node_data.get('final_response', '')
                if final_response:
                    return final_response
            
            # Check messages in any node for final response tool results
            messages = node_data.get('messages', [])
            for msg in messages:
                if hasattr(msg, 'name') and msg.name == 'final_response_to_user':
                    try:
                        result_data = json.loads(msg.content)
                        return result_data.get('response_content', 'Task completed successfully.')
                    except:
                        return msg.content
        
        return "Task completed successfully."
    
    def _setup_streaming_overrides(self):
        """Override agent methods to capture thinking content"""
        # Store original methods
        self.original_planning_agent_method = self.planning_agent.ainvoke
        self.original_executor_agent_method = self.executor_agent.ainvoke
        
        # Create quota pause callback
        async def quota_pause_callback(event_type, data):
            if self.streaming_active:
                await self.emit_event({
                    'type': event_type,
                    'agent': 'system',
                    'data': data
                })
        
        # Create wrapper methods that capture original thinking
        async def streaming_planning_agent(messages):
            logger.info("🎬 Streaming planning agent override called")
            
            # If the planning agent uses quota-aware LLM, pass the callback
            if hasattr(self.planning_llm, '_get_working_llm'):
                # This is a quota-aware LLM, pass the callback
                original_get_working_llm = self.planning_llm._get_working_llm
                self.planning_llm._get_working_llm = lambda: original_get_working_llm(quota_pause_callback)
            
            original_response = await self.original_planning_agent_method(messages)
            
            # Restore original method
            if hasattr(self.planning_llm, '_get_working_llm'):
                self.planning_llm._get_working_llm = original_get_working_llm
            
            # Capture original thinking content before filtering
            if hasattr(original_response, 'content') and isinstance(original_response.content, list):
                thoughts = [
                    part["thinking"]
                    for part in original_response.content
                    if isinstance(part, dict) and part.get("type") == "thinking" and part.get("thinking")
                ]
                
                # Store thinking in memory system and emit events
                for thought in thoughts:
                    thinking_id = str(uuid.uuid4())
                    
                    # Store in memory system
                    if self.current_thread_id and self.current_exchange_id:
                        await self.memory_system.add_agent_message(
                            self.current_thread_id,
                            self.current_exchange_id,
                            'planning',
                            thought,
                            "thinking"
                        )
                    
                    # Emit thinking event
                    await self.emit_event({
                        'type': 'thinking',
                        'agent': 'planning',
                        'content': thought,
                        'thinking_id': thinking_id
                    })
                    logger.info(f"💭 Emitted planning thinking: {thought[:100]}...")
            
            return original_response
        
        async def streaming_executor_agent(messages):
            logger.info("🎬 Streaming executor agent override called")
            
            # If the executor agent uses quota-aware LLM, pass the callback
            if hasattr(self.executor_llm, '_get_working_llm'):
                # This is a quota-aware LLM, pass the callback
                original_get_working_llm = self.executor_llm._get_working_llm
                self.executor_llm._get_working_llm = lambda: original_get_working_llm(quota_pause_callback)
            
            original_response = await self.original_executor_agent_method(messages)
            
            # Restore original method
            if hasattr(self.executor_llm, '_get_working_llm'):
                self.executor_llm._get_working_llm = original_get_working_llm
            
            # Capture original thinking content before filtering
            if hasattr(original_response, 'content') and isinstance(original_response.content, list):
                thoughts = [
                    part["thinking"]
                    for part in original_response.content
                    if isinstance(part, dict) and part.get("type") == "thinking" and part.get("thinking")
                ]
                
                # Store thinking in memory system and emit events
                for thought in thoughts:
                    thinking_id = str(uuid.uuid4())
                    
                    # Store in memory system
                    if self.current_thread_id and self.current_exchange_id:
                        await self.memory_system.add_agent_message(
                            self.current_thread_id,
                            self.current_exchange_id,
                            'executor',
                            thought,
                            "thinking"
                        )
                    
                    # Emit thinking event
                    await self.emit_event({
                        'type': 'thinking',
                        'agent': 'executor',
                        'content': thought,
                        'thinking_id': thinking_id
                    })
                    logger.info(f"💭 Emitted executor thinking: {thought[:100]}...")
            
            return original_response
        
        # Override the methods
        self.planning_agent.ainvoke = streaming_planning_agent
        self.executor_agent.ainvoke = streaming_executor_agent
    
    def _restore_original_methods(self):
        """Restore original agent methods"""
        if self.original_planning_agent_method:
            self.planning_agent.ainvoke = self.original_planning_agent_method
        if self.original_executor_agent_method:
            self.executor_agent.ainvoke = self.original_executor_agent_method


def get_agent_graph() -> AgentGraph:
    """
    Get or initialize the multi-agent graph.
    
    Returns:
        AgentGraph instance
    """
    global agent_graph
    if agent_graph is None:
        logger.info("🤖 Initializing Multi-Agent Graph...")
        agent_graph = AgentGraph()
        logger.info("✅ Multi-Agent Graph initialized successfully")
    return agent_graph


def get_single_agent_graph() -> SingleAgentGraph:
    """
    Get or initialize the single agent graph.
    
    Returns:
        SingleAgentGraph instance
    """
    global single_agent_graph
    if single_agent_graph is None:
        logger.info("⚡ Initializing Single Agent Graph...")
        single_agent_graph = SingleAgentGraph()
        logger.info("✅ Single Agent Graph initialized successfully")
    return single_agent_graph


def get_streaming_agent_graph() -> StreamingAgentGraph:
    """
    Get or initialize the streaming agent graph.
    
    Returns:
        StreamingAgentGraph instance
    """
    global agent_graph
    if agent_graph is None:
        agent_graph = StreamingAgentGraph()
    return agent_graph


def get_streaming_single_agent_graph() -> StreamingSingleAgentGraph:
    """
    Get or initialize the streaming single agent graph.
    
    Returns:
        StreamingSingleAgentGraph instance
    """
    global single_agent_graph
    if single_agent_graph is None:
        single_agent_graph = StreamingSingleAgentGraph()
    return single_agent_graph


@router.post("/chat/stream")
async def chat_with_agent_streaming(request: StreamingChatRequest) -> StreamingResponse:
    """
    Chat with the AI agent system using Server-Sent Events for real-time streaming.
    
    This endpoint provides detailed, real-time updates of the agent's execution process,
    including thoughts, tool calls, and results.
    """
    async def generate_events():
        agent = None
        try:
            # Get streaming agent
            agent = get_streaming_agent_graph()
            logger.info(f"🎬 Starting streaming for message: {request.message[:100]}...")
            
            # Process streaming in background
            async def stream_processing():
                try:
                    await agent.process_user_input_streaming(
                        user_input=request.message,
                        thread_id=request.thread_id
                    )
                    logger.info("🏁 Streaming processing completed")
                except Exception as e:
                    logger.error(f"❌ Error in streaming processing: {e}")
                    await agent.emit_event({
                        'type': 'execution_error',
                        'error': str(e)
                    })
            
            # Start processing
            processing_task = asyncio.create_task(stream_processing())
            
            # Track heartbeat timing
            last_heartbeat = asyncio.get_event_loop().time()
            heartbeat_interval = 30  # Send heartbeat every 30 seconds if no events
            
            # Stream events as they come
            while True:
                try:
                    # Use longer timeout for event waiting to avoid unnecessary heartbeats
                    event = await asyncio.wait_for(agent.event_queue.get(), timeout=5.0)
                    
                    # Log event for debugging
                    logger.info(f"📡 SSE Event: {event.get('type')} - {event.get('agent', 'system')}")
                    
                    # Format as SSE and yield immediately
                    event_data = json.dumps(event)
                    yield f"data: {event_data}\n\n"
                    
                    # Update heartbeat timing
                    last_heartbeat = asyncio.get_event_loop().time()
                    
                    # Check if execution is complete
                    if event.get('type') in ['execution_complete', 'execution_error']:
                        logger.info(f"🏁 Streaming complete: {event.get('type')}")
                        break
                        
                except asyncio.TimeoutError:
                    # Check if we need to send a heartbeat
                    current_time = asyncio.get_event_loop().time()
                    if current_time - last_heartbeat >= heartbeat_interval:
                        yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
                        last_heartbeat = current_time
                    
                    # Check if processing is done
                    if processing_task.done():
                        logger.info("🏁 Processing task completed, ending stream")
                        break
                        
                except Exception as e:
                    logger.error(f"❌ Error in event generation: {e}")
                    error_event = {
                        'type': 'error',
                        'message': str(e),
                        'timestamp': datetime.now().isoformat()
                    }
                    yield f"data: {json.dumps(error_event)}\n\n"
                    break
            
            # Ensure processing task is complete
            if not processing_task.done():
                try:
                    await processing_task
                except Exception as e:
                    logger.error(f"❌ Error in processing task: {e}")
                    error_event = {
                        'type': 'error',
                        'message': str(e),
                        'timestamp': datetime.now().isoformat()
                    }
                    yield f"data: {json.dumps(error_event)}\n\n"
        
        except Exception as e:
            logger.error(f"Critical error in streaming: {e}")
            error_event = {
                'type': 'critical_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.post("/chat/single/stream")
async def chat_with_single_agent_streaming(request: StreamingChatRequest) -> StreamingResponse:
    """
    Chat with the AI single agent system using Server-Sent Events for real-time streaming.
    
    This endpoint provides detailed, real-time updates of the single agent's execution process,
    including thoughts, tool calls, and results.
    """
    async def generate_events():
        agent = None
        try:
            # Get streaming single agent
            agent = get_streaming_single_agent_graph()
            logger.info(f"⚡ Starting single agent streaming for message: {request.message[:100]}...")
            
            # Process streaming in background
            async def stream_processing():
                try:
                    await agent.process_user_input_streaming(
                        user_input=request.message,
                        thread_id=request.thread_id
                    )
                    logger.info("🏁 Single agent streaming processing completed")
                except Exception as e:
                    logger.error(f"❌ Error in single agent streaming processing: {e}")
                    await agent.emit_event({
                        'type': 'execution_error',
                        'error': str(e)
                    })
            
            # Start processing
            processing_task = asyncio.create_task(stream_processing())
            
            # Track heartbeat timing
            last_heartbeat = asyncio.get_event_loop().time()
            heartbeat_interval = 30  # Send heartbeat every 30 seconds if no events
            
            # Stream events as they come
            while True:
                try:
                    # Use longer timeout for event waiting to avoid unnecessary heartbeats
                    event = await asyncio.wait_for(agent.event_queue.get(), timeout=5.0)
                    
                    # Log event for debugging
                    logger.info(f"📡 Single Agent SSE Event: {event.get('type')} - {event.get('agent', 'system')}")
                    
                    # Format as SSE and yield immediately
                    event_data = json.dumps(event)
                    yield f"data: {event_data}\n\n"
                    
                    # Update heartbeat timing
                    last_heartbeat = asyncio.get_event_loop().time()
                    
                    # Check if execution is complete
                    if event.get('type') in ['execution_complete', 'execution_error']:
                        logger.info(f"🏁 Single agent streaming complete: {event.get('type')}")
                        break
                        
                except asyncio.TimeoutError:
                    # Check if we need to send a heartbeat
                    current_time = asyncio.get_event_loop().time()
                    if current_time - last_heartbeat >= heartbeat_interval:
                        yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
                        last_heartbeat = current_time
                    
                    # Check if processing is done
                    if processing_task.done():
                        logger.info("🏁 Single agent processing task completed, ending stream")
                        break
                        
                except Exception as e:
                    logger.error(f"❌ Error in single agent event generation: {e}")
                    error_event = {
                        'type': 'error',
                        'message': str(e),
                        'timestamp': datetime.now().isoformat()
                    }
                    yield f"data: {json.dumps(error_event)}\n\n"
                    break
            
            # Ensure processing task is complete
            if not processing_task.done():
                try:
                    await processing_task
                except Exception as e:
                    logger.error(f"❌ Error in single agent processing task: {e}")
                    error_event = {
                        'type': 'error',
                        'message': str(e),
                        'timestamp': datetime.now().isoformat()
                    }
                    yield f"data: {json.dumps(error_event)}\n\n"
        
        except Exception as e:
            logger.error(f"Critical error in single agent streaming: {e}")
            error_event = {
                'type': 'critical_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_event)}\n\n"
    
    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest) -> ChatResponse:
    """
    Chat with the AI multi-agent system (Planning + Executor).
    
    The agent will analyze your request, gather relevant information,
    and take appropriate actions on your behalf.
    """
    try:
        logger.info(f"🤖 New multi-agent chat request: {request.message[:100]}...")
        
        # Get agent graph
        agent = get_agent_graph()
        
        # Process the user input
        response = await agent.process_user_input(
            user_input=request.message,
            thread_id=request.thread_id
        )
        
        # Get or create thread ID
        thread_id = request.thread_id or str(uuid.uuid4())
        
        logger.info(f"✅ Multi-agent chat request processed successfully for thread {thread_id}")
        
        return ChatResponse(
            response=response,
            thread_id=thread_id,
            agent_used="Planning + Executor Agents",
            success=True
        )
    
    except Exception as e:
        logger.error(f"❌ Error processing multi-agent chat request: {e}")
        logger.error(f"Full error traceback:", exc_info=True)
        
        # Return error response
        thread_id = request.thread_id or str(uuid.uuid4())
        
        return ChatResponse(
            response=f"I apologize, but I encountered an error while processing your request: {str(e)}",
            thread_id=thread_id,
            agent_used="Error Handler",
            success=False
        )


@router.post("/chat/single", response_model=ChatResponse)
async def chat_with_single_agent(request: ChatRequest) -> ChatResponse:
    """
    Chat with the AI single agent system (faster, more efficient).
    
    The agent will analyze your request and take appropriate actions
    in a single streamlined workflow.
    """
    try:
        logger.info(f"⚡ New single agent chat request: {request.message[:100]}...")
        
        # Get single agent graph
        agent = get_single_agent_graph()
        
        # Process the user input
        response = await agent.process_user_input(
            user_input=request.message,
            thread_id=request.thread_id
        )
        
        # Get or create thread ID
        thread_id = request.thread_id or str(uuid.uuid4())
        
        logger.info(f"✅ Single agent chat request processed successfully for thread {thread_id}")
        
        return ChatResponse(
            response=response,
            thread_id=thread_id,
            agent_used="Single Agent",
            success=True
        )
    
    except Exception as e:
        logger.error(f"❌ Error processing single agent chat request: {e}")
        logger.error(f"Full error traceback:", exc_info=True)
        
        # Return error response
        thread_id = request.thread_id or str(uuid.uuid4())
        
        return ChatResponse(
            response=f"I apologize, but I encountered an error while processing your request: {str(e)}",
            thread_id=thread_id,
            agent_used="Error Handler",
            success=False
        )


@router.get("/conversation/{thread_id}")
async def get_conversation_history(thread_id: str) -> Dict[str, Any]:
    """
    Get conversation history for a thread from memory system.
    """
    try:
        memory_system = MemorySystem()
     
        # Get the actual conversation history with exchanges
        history = await memory_system.get_conversation_history(thread_id)
        
        return {
            "success": True,
            "thread_id": thread_id,
            "conversation_history": history.to_dict(),
            "message_count": len(history.exchanges),
            "last_updated": history.last_updated
        }
    
    except Exception as e:
        logger.error(f"❌ Error getting conversation history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get conversation history: {str(e)}"
        )


@router.get("/conversation/{thread_id}/detailed")
async def get_detailed_conversation_history(thread_id: str) -> Dict[str, Any]:
    """
    Get detailed conversation history including agent messages and streaming events.
    """
    try:
        memory_system = MemorySystem()
        
        # Get the actual conversation history with exchanges
        history = await memory_system.get_conversation_history(thread_id)
        
        # Transform to detailed format for frontend
        detailed_exchanges = []
        for exchange in history.exchanges:
            detailed_exchange = {
                "id": exchange.id,
                "user_message": exchange.user_message,
                "planner_summary": exchange.planner_summary,
                "executor_summary": exchange.executor_summary,
                "final_response": exchange.final_response,
                "timestamp": exchange.timestamp,
                "is_complete": exchange.is_complete,
                "agent_messages": [msg.to_dict() for msg in exchange.agent_messages],
                "streaming_events": [event.to_dict() for event in exchange.streaming_events],
                "execution_metadata": exchange.execution_metadata
            }
            detailed_exchanges.append(detailed_exchange)
        
        return {
            "success": True,
            "thread_id": thread_id,
            "exchanges": detailed_exchanges,
            "message_count": len(history.exchanges),
            "last_updated": history.last_updated,
            "created_at": history.created_at
        }
    
    except Exception as e:
        logger.error(f"❌ Error getting detailed conversation history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get detailed conversation history: {str(e)}"
        )


@router.post("/conversation/new", response_model=ThreadResponse)
async def create_new_conversation() -> ThreadResponse:
    """
    Create a new conversation thread.
    """
    try:
        memory_system = MemorySystem()
        thread_id = await memory_system.create_new_thread()
        
        return ThreadResponse(
            thread_id=thread_id,
            success=True,
            message="New conversation thread created successfully"
        )
    
    except Exception as e:
        logger.error(f"❌ Error creating new conversation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create new conversation: {str(e)}"
        )


@router.delete("/conversation/{thread_id}")
async def clear_conversation_history(thread_id: str) -> ThreadResponse:
    """
    Clear conversation history for a thread.
    """
    try:
        memory_system = MemorySystem()
        success = await memory_system.clear_thread_history(thread_id)
        
        if success:
            return ThreadResponse(
                thread_id=thread_id,
                success=True,
                message="Conversation history cleared successfully"
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Thread not found or could not be cleared"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error clearing conversation history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear conversation history: {str(e)}"
        )


@router.get("/conversation/{thread_id}/summary")
async def get_conversation_summary(thread_id: str) -> Dict[str, Any]:
    """
    Get a summary of the conversation for a thread.
    """
    try:
        memory_system = MemorySystem()
        summary = await memory_system.get_conversation_summary(thread_id)
        
        return {
            "success": True,
            "thread_id": thread_id,
            "summary": summary
        }
    
    except Exception as e:
        logger.error(f"❌ Error getting conversation summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get conversation summary: {str(e)}"
        )


@router.get("/conversations")
async def list_conversation_threads() -> Dict[str, Any]:
    """
    List all available conversation threads.
    """
    try:
        memory_system = MemorySystem()
        
        # Get conversation statistics from SQLite
        stats = await memory_system.get_stats()
        
        # Get all conversation threads from SQLite
        from core.database import db_manager
        threads = []
        
        async with db_manager.get_connection() as conn:
            cursor = await conn.execute("""
                SELECT ct.thread_id, ct.created_at, ct.last_updated,
                       COUNT(ce.id) as message_count,
                       MAX(ce.timestamp) as latest_exchange_time
                FROM conversation_threads ct
                LEFT JOIN conversation_exchanges ce ON ct.thread_id = ce.thread_id
                GROUP BY ct.thread_id, ct.created_at, ct.last_updated
                ORDER BY MAX(ce.timestamp) DESC, ct.last_updated DESC
            """)
            
            thread_rows = await cursor.fetchall()
            
            for thread_row in thread_rows:
                thread_id = thread_row['thread_id']
                
                # Get latest exchange for preview
                latest_cursor = await conn.execute("""
                    SELECT user_message, final_response, planner_summary, executor_summary
                    FROM conversation_exchanges
                    WHERE thread_id = ?
                    ORDER BY timestamp DESC
                    LIMIT 1
                """, (thread_id,))
                
                latest_exchange = await latest_cursor.fetchone()
                
                # Create thread info
                latest_message = latest_exchange['user_message'] if latest_exchange else ''
                latest_response = ''
                if latest_exchange:
                    latest_response = (latest_exchange['final_response'] or 
                                     latest_exchange['executor_summary'] or 
                                     latest_exchange['planner_summary'] or '')
                
                thread_info = {
                    "id": thread_id,
                    "created_at": thread_row['created_at'],
                    "last_updated": thread_row['last_updated'],
                    "message_count": thread_row['message_count'],
                    "latest_message": latest_message,
                    "latest_response": latest_response,
                    "title": (latest_message[:50] + '...' if len(latest_message) > 50 
                             else latest_message) if latest_message else 'Empty Conversation'
                }
                threads.append(thread_info)
        
        return {
            "success": True,
            "threads": threads,
            "total_count": len(threads),
            "stats": stats
        }
    
    except Exception as e:
        logger.error(f"❌ Error listing conversation threads: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list conversation threads: {str(e)}"
        )


@router.get("/status")
async def get_agent_status() -> Dict[str, Any]:
    """
    Get the current status of both agent systems.
    """
    try:
        # Check if agents are initialized
        multi_agent_initialized = agent_graph is not None
        single_agent_initialized = single_agent_graph is not None
        
        status_info = {
            "multi_agent_initialized": multi_agent_initialized,
            "single_agent_initialized": single_agent_initialized,
            "system_healthy": True,
            "available_models": {
                "multi_agent_planning_model": "gemini-2.5-flash",
                "multi_agent_executor_model": "gemini-2.5-flash", 
                "single_agent_model": "gemini-2.5-flash"
            },
            "agent_systems": {
                "multi_agent": {
                    "description": "Planning + Executor agents for complex workflows",
                    "initialized": multi_agent_initialized,
                    "endpoints": {
                        "chat": "/chat",
                        "stream": "/chat/stream"
                    }
                },
                "single_agent": {
                    "description": "Single agent for efficient, streamlined workflows",
                    "initialized": single_agent_initialized,
                    "endpoints": {
                        "chat": "/chat/single",
                        "stream": "/chat/single/stream"
                    }
                }
            },
            "features": {
                "planning_agent": True,
                "executor_agent": True,
                "single_agent": True,
                "memory_system": True,
                "conversation_threading": True,
                "objective_management": True,
                "gamification": True,
                "streaming_support": True
            }
        }
        
        if multi_agent_initialized or single_agent_initialized:
            status_info["message"] = "Agent systems are ready and operational"
        else:
            status_info["message"] = "Agent systems will be initialized on first request"
        
        return status_info
    
    except Exception as e:
        logger.error(f"❌ Error getting agent status: {e}")
        return {
            "multi_agent_initialized": False,
            "single_agent_initialized": False,
            "system_healthy": False,
            "error": str(e),
            "message": "Agent system encountered an error"
        }


@router.post("/initialize")
async def initialize_agent_systems(background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    Manually initialize both agent systems.
    """
    try:
        initialization_tasks = []
        
        # Initialize multi-agent system if not already done
        if agent_graph is None:
            background_tasks.add_task(get_agent_graph)
            initialization_tasks.append("multi_agent")
            
        # Initialize single agent system if not already done
        if single_agent_graph is None:
            background_tasks.add_task(get_single_agent_graph)
            initialization_tasks.append("single_agent")
            
        if initialization_tasks:
            return {
                "success": True,
                "message": f"Agent systems initialization started: {', '.join(initialization_tasks)}",
                "status": "initializing",
                "systems": initialization_tasks
            }
        else:
            return {
                "success": True,
                "message": "All agent systems are already initialized",
                "status": "ready",
                "systems": []
            }
    
    except Exception as e:
        logger.error(f"❌ Error initializing agent systems: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize agent systems: {str(e)}"
        )


@router.post("/edit-message", response_model=EditMessageResponse)
async def edit_message(request: EditMessageRequest) -> EditMessageResponse:
    """
    Edit a message in the conversation and truncate history after that point.
    """
    try:
        logger.info(f"📝 Editing message in thread {request.thread_id}, exchange {request.exchange_id}")
        
        # Use the memory system to edit the message
        memory_system = MemorySystem()
        success = await memory_system.edit_message_and_truncate(
            request.thread_id,
            request.exchange_id,
            request.new_message
        )
        
        if success:
            return EditMessageResponse(
                success=True,
                message="Message edited successfully and conversation history truncated",
                thread_id=request.thread_id,
                exchange_id=request.exchange_id
            )
        else:
            raise HTTPException(
                status_code=404,
                detail="Exchange not found or edit failed"
            )
    
    except Exception as e:
        logger.error(f"❌ Error editing message: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to edit message: {str(e)}"
        )


@router.post("/rerun-from-message", response_model=ChatResponse)
async def rerun_from_message(request: ChatRequest) -> ChatResponse:
    """
    Re-run the conversation from a specific message.
    This endpoint uses the existing chat logic but with a thread that has been truncated.
    """
    try:
        logger.info(f"🔄 Re-running conversation from message in thread {request.thread_id}")
        
        # Initialize the default agent graph (multi-agent system)
        global agent_graph
        if agent_graph is None:
            agent_graph = AgentGraph()
        
        # Get the last exchange from the thread (which should be the edited one)
        memory_system = MemorySystem()
        current_exchange = await memory_system.get_current_exchange(request.thread_id)
        
        if not current_exchange:
            raise HTTPException(
                status_code=404,
                detail="No exchange found in the thread"
            )
        
        # Process the edited message
        final_response = await agent_graph.process_user_input(
            current_exchange.user_message,
            request.thread_id
        )
        
        return ChatResponse(
            response=final_response,
            thread_id=request.thread_id,
            agent_used="multi-agent",
            success=True
        )
    
    except Exception as e:
        logger.error(f"❌ Error re-running from message: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to re-run from message: {str(e)}"
        )


@router.post("/rerun-from-message/stream")
async def rerun_from_message_stream(request: RerunFromMessageRequest):
    """
    Re-run the conversation from a specific message with streaming.
    """
    try:
        logger.info(f"🔄 Re-running conversation with streaming from thread {request.thread_id}")
        logger.info(f"🔄 Request details: include_thoughts={request.include_thoughts}, include_tool_details={request.include_tool_details}")
        
        # Initialize the streaming agent graph (multi-agent system)
        streaming_agent = get_streaming_agent_graph()
        
        # Get the last exchange from the thread (which should be the edited one)
        memory_system = MemorySystem()
        current_exchange = await memory_system.get_current_exchange(request.thread_id)
        
        logger.info(f"🔄 Current exchange: {current_exchange.id if current_exchange else 'None'}")
        if current_exchange:
            logger.info(f"🔄 Exchange message: {current_exchange.user_message[:100]}...")
        
        if not current_exchange:
            raise HTTPException(
                status_code=404,
                detail="No exchange found in the thread"
            )
        
        # Process the edited message with streaming
        async def event_stream():
            try:
                # Start processing in background
                processing_task = asyncio.create_task(
                    streaming_agent.process_user_input_streaming(
                        current_exchange.user_message,
                        request.thread_id
                    )
                )
                
                # Stream events
                while True:
                    try:
                        # Wait for events with timeout
                        event = await asyncio.wait_for(
                            streaming_agent.event_queue.get(),
                            timeout=1.0
                        )
                        
                        yield f"data: {json.dumps(event)}\n\n"
                        
                        # Check if processing is done
                        if event.get('type') == 'execution_complete' or event.get('type') == 'execution_error':
                            break
                        
                    except asyncio.TimeoutError:
                        # Send heartbeat
                        yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
                        
                        # Check if processing task is done
                        if processing_task.done():
                            break
                
                # Ensure task is completed
                await processing_task
                
            except Exception as e:
                logger.error(f"❌ Error in streaming rerun: {e}")
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )
    
    except Exception as e:
        logger.error(f"❌ Error in streaming rerun setup: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to setup streaming rerun: {str(e)}"
        )


@router.post("/stop-execution", response_model=StopExecutionResponse)
async def stop_execution(request: StopExecutionRequest) -> StopExecutionResponse:
    """
    Stop an active execution.
    """
    try:
        logger.info(f"🛑 Stopping execution {request.execution_id}")
        
        # Try to stop in both agent systems
        success = False
        
        # Check multi-agent system
        global agent_graph
        if agent_graph and hasattr(agent_graph, 'request_stop'):
            try:
                if isinstance(agent_graph, StreamingAgentGraph):
                    logger.info(f"🔍 Checking multi-agent system for execution {request.execution_id}")
                    logger.info(f"🔍 Active executions: {list(agent_graph.active_executions.keys())}")
                    success = await agent_graph.request_stop(request.execution_id)
            except Exception as e:
                logger.warning(f"Failed to stop in multi-agent system: {e}")
        else:
            logger.info(f"🔍 Multi-agent system not available or no request_stop method")
        
        # Check single-agent system
        global single_agent_graph
        if single_agent_graph and hasattr(single_agent_graph, 'request_stop'):
            try:
                if isinstance(single_agent_graph, StreamingSingleAgentGraph):
                    logger.info(f"🔍 Checking single-agent system for execution {request.execution_id}")
                    logger.info(f"🔍 Active executions: {list(single_agent_graph.active_executions.keys())}")
                    single_success = await single_agent_graph.request_stop(request.execution_id)
                    success = success or single_success
            except Exception as e:
                logger.warning(f"Failed to stop in single-agent system: {e}")
        else:
            logger.info(f"🔍 Single-agent system not available or no request_stop method")
        
        if success:
            return StopExecutionResponse(
                success=True,
                message="Execution stop requested successfully",
                execution_id=request.execution_id
            )
        else:
            logger.info(f"🔍 Execution {request.execution_id} not found in any active executions")
            return StopExecutionResponse(
                success=False,
                message="Execution not found or already completed",
                execution_id=request.execution_id
            )
    
    except Exception as e:
        logger.error(f"❌ Error stopping execution: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to stop execution: {str(e)}"
        )


@router.post("/rerun-from-message/single/stream")
async def rerun_from_message_single_stream(request: RerunFromMessageRequest):
    """
    Re-run the conversation from a specific message with streaming using single-agent system.
    """
    try:
        logger.info(f"🔄 Re-running conversation with single-agent streaming from thread {request.thread_id}")
        logger.info(f"🔄 Request details: include_thoughts={request.include_thoughts}, include_tool_details={request.include_tool_details}")
        
        # Initialize the streaming single agent graph
        streaming_single_agent = get_streaming_single_agent_graph()
        
        # Get the last exchange from the thread (which should be the edited one)
        memory_system = MemorySystem()
        current_exchange = await memory_system.get_current_exchange(request.thread_id)
        
        logger.info(f"🔄 Current exchange: {current_exchange.id if current_exchange else 'None'}")
        if current_exchange:
            logger.info(f"🔄 Exchange message: {current_exchange.user_message[:100]}...")
        
        if not current_exchange:
            raise HTTPException(
                status_code=404,
                detail="No exchange found in the thread"
            )
        
        # Process the edited message with streaming
        async def event_stream():
            try:
                # Start processing in background
                processing_task = asyncio.create_task(
                    streaming_single_agent.process_user_input_streaming(
                        current_exchange.user_message,
                        request.thread_id
                    )
                )
                
                # Stream events
                while True:
                    try:
                        # Wait for events with timeout
                        event = await asyncio.wait_for(
                            streaming_single_agent.event_queue.get(),
                            timeout=1.0
                        )
                        
                        yield f"data: {json.dumps(event)}\n\n"
                        
                        # Check if processing is done
                        if event.get('type') == 'execution_complete' or event.get('type') == 'execution_error':
                            break
                        
                    except asyncio.TimeoutError:
                        # Send heartbeat
                        yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
                        
                        # Check if processing task is done
                        if processing_task.done():
                            break
                
                # Ensure task is completed
                await processing_task
                
            except Exception as e:
                logger.error(f"❌ Error in single-agent streaming rerun: {e}")
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )
    
    except Exception as e:
        logger.error(f"❌ Error in single-agent streaming rerun setup: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to setup single-agent streaming rerun: {str(e)}"
        ) 