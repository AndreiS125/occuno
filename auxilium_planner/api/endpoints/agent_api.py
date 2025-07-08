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
from agents.memory_system import MemorySystem
from core.logging_config import get_logger

logger = get_logger("agent_api")
router = APIRouter(tags=["agent"])

# Global agent instance
agent_graph: Optional[AgentGraph] = None


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


class StreamingAgentGraph(AgentGraph):
    """Enhanced AgentGraph with streaming capabilities"""
    
    def __init__(self):
        super().__init__()
        self.event_queue = asyncio.Queue()
        self.streaming_active = False
        self.current_execution_id = None
        self.final_response_emitted = False
        self.original_planning_agent_method = None
        self.original_executor_agent_method = None
    


    async def emit_event(self, event: Dict[str, Any]):
        """Emit a streaming event"""
        if self.streaming_active:
            event['timestamp'] = datetime.now().isoformat()
            event['execution_id'] = self.current_execution_id
            await self.event_queue.put(event)
    
    async def process_user_input_streaming(self, user_input: str, thread_id: Optional[str] = None):
        """Process user input with streaming events"""
        self.streaming_active = True
        self.current_execution_id = str(uuid.uuid4())
        self.final_response_emitted = False  # Reset flag for each request
        
        try:
            logger.info(f"🎬 StreamingAgentGraph: Starting processing for: {user_input[:100]}...")
            
            # Emit start event
            await self.emit_event({
                'type': 'execution_start',
                'message': user_input,
                'thread_id': thread_id
            })
            
            # Create or get thread ID
            if not thread_id:
                thread_id = await self.memory_system.create_new_thread()
                logger.info(f"🆕 Created new thread: {thread_id}")
            
            # Emit initialization event
            await self.emit_event({
                'type': 'initialization',
                'thread_id': thread_id,
                'user_input': user_input
            })
            
            # Override the node methods to capture original thinking content
            self._setup_streaming_overrides()
            
            # Start processing with streaming
            final_response = await self._process_with_streaming(user_input, thread_id)
            logger.info(f"✅ StreamingAgentGraph: Processing complete, final response: {final_response[:100]}...")
            
            # Only emit final response if we haven't already emitted a real one from final_response_to_user tool
            if not self.final_response_emitted:
                await self.emit_event({
                    'type': 'final_response',
                    'response': final_response,
                    'thread_id': thread_id
                })
                logger.info("📤 Emitted fallback final response")
            else:
                logger.info("⏭️ Skipped fallback final response (real one already emitted)")
            
            # Emit completion event
            await self.emit_event({
                'type': 'execution_complete',
                'thread_id': thread_id,
                'success': True
            })
            
            logger.info(f"🏁 StreamingAgentGraph: Workflow completed successfully")
            
        except Exception as e:
            logger.error(f"❌ StreamingAgentGraph error: {e}")
            await self.emit_event({
                'type': 'execution_error',
                'error': str(e),
                'thread_id': thread_id
            })
            raise
        finally:
            self.streaming_active = False
            self._restore_original_methods()
    
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
            # Emit node start
            await self.emit_event({
                'type': 'node_start',
                'node': node_name,
                'agent': self._get_agent_from_node(node_name)
            })
            
            # Process messages in the chunk
            messages = node_data.get('messages', [])
            for message in messages:
                await self._emit_message_events(message, node_name)
            
            # Emit node complete
            await self.emit_event({
                'type': 'node_complete',
                'node': node_name,
                'agent': self._get_agent_from_node(node_name)
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
            
            # Emit individual tool calls
            for tool_call in tool_calls:
                await self.emit_event({
                    'type': 'tool_call',
                    'agent': agent,
                    'tool_name': tool_call.get('name'),
                    'tool_id': tool_call.get('id'),
                    'tool_args': tool_call.get('args', {}),
                    'tool_call_id': tool_call.get('id')  # Use the actual tool call ID to prevent duplicates
                })
        
        elif msg_type == 'ToolMessage':
            # Emit tool result
            tool_name = getattr(message, 'name', 'unknown')
            tool_content = getattr(message, 'content', '')
            tool_call_id = getattr(message, 'tool_call_id', 'unknown')
            
            # Check if this is a final response tool
            if tool_name == 'final_response_to_user':
                try:
                    result_data = json.loads(tool_content)
                    final_response_content = result_data.get('response_content', '')
                    if final_response_content:
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
                'result': tool_content,
                'tool_result_id': str(uuid.uuid4())
            })
        
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
    
    def _extract_final_response(self, final_result: Dict[str, Any]) -> str:
        """Extract final response from the graph result"""
        # Check if final response content is in state
        final_response_content = final_result.get('final_response_content', '')
        if final_response_content:
            return final_response_content
        
        # Fallback to extracting from messages
        messages = final_result.get('messages', [])
        for msg in reversed(messages):
            if hasattr(msg, 'content') and msg.content:
                # Check if it's a tool result with final response
                if hasattr(msg, 'name') and msg.name == 'final_response_to_user':
                    try:
                        result_data = json.loads(msg.content)
                        return result_data.get('response_content', msg.content)
                    except:
                        return msg.content
                # Check if it's an AI message
                elif hasattr(msg, 'content') and len(str(msg.content)) > 50:
                    return str(msg.content)
        
        return "No final response found in execution result."
    
    def _setup_streaming_overrides(self):
        """Override agent methods to capture original thinking content"""
        # Store original methods
        self.original_planning_agent_method = self.planning_agent.ainvoke
        self.original_executor_agent_method = self.executor_agent.ainvoke
        
        # Create wrapper methods that capture original thinking
        async def streaming_planning_agent(messages):
            logger.info("🎬 Streaming planning agent override called")
            original_response = await self.original_planning_agent_method(messages)
            
            # Capture original thinking content before filtering
            if hasattr(original_response, 'content') and isinstance(original_response.content, list):
                thoughts = [
                    part["thinking"]
                    for part in original_response.content
                    if isinstance(part, dict) and part.get("type") == "thinking" and part.get("thinking")
                ]
                
                # Emit thinking events
                for thought in thoughts:
                    await self.emit_event({
                        'type': 'thinking',
                        'agent': 'planning',
                        'content': thought,
                        'thinking_id': str(uuid.uuid4())
                    })
                    logger.info(f"💭 Emitted planning thinking: {thought[:100]}...")
            
            return original_response
        
        async def streaming_executor_agent(messages):
            logger.info("🎬 Streaming executor agent override called")
            original_response = await self.original_executor_agent_method(messages)
            
            # Capture original thinking content before filtering
            if hasattr(original_response, 'content') and isinstance(original_response.content, list):
                thoughts = [
                    part["thinking"]
                    for part in original_response.content
                    if isinstance(part, dict) and part.get("type") == "thinking" and part.get("thinking")
                ]
                
                # Emit thinking events
                for thought in thoughts:
                    await self.emit_event({
                        'type': 'thinking',
                        'agent': 'executor',
                        'content': thought,
                        'thinking_id': str(uuid.uuid4())
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
    Get or initialize the agent graph.
    
    Returns:
        AgentGraph instance
    """
    global agent_graph
    if agent_graph is None:
        logger.info("🤖 Initializing Agent Graph...")
        agent_graph = AgentGraph()
        logger.info("✅ Agent Graph initialized successfully")
    return agent_graph


def get_streaming_agent_graph() -> StreamingAgentGraph:
    """
    Get or initialize the streaming agent graph.
    
    Returns:
        StreamingAgentGraph instance
    """
    # Always create a new instance for streaming to avoid conflicts
    return StreamingAgentGraph()


@router.post("/chat/stream")
async def chat_with_agent_streaming(request: StreamingChatRequest) -> StreamingResponse:
    """
    Chat with the AI agent system using Server-Sent Events for real-time streaming.
    
    This endpoint provides detailed, real-time updates of the agent's execution process,
    including thoughts, tool calls, and results.
    """
    async def generate_events():
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
            
            # Stream events as they come
            while True:
                try:
                    # Wait for next event with timeout
                    event = await asyncio.wait_for(agent.event_queue.get(), timeout=0.1)
                    
                    # Log event for debugging
                    logger.info(f"📡 SSE Event: {event.get('type')} - {event.get('agent', 'system')}")
                    
                    # Format as SSE
                    event_data = json.dumps(event)
                    yield f"data: {event_data}\n\n"
                    
                    # Check if execution is complete
                    if event.get('type') in ['execution_complete', 'execution_error']:
                        logger.info(f"🏁 Streaming complete: {event.get('type')}")
                        break
                        
                except asyncio.TimeoutError:
                    # Send heartbeat
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                    
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
            "Access-Control-Allow-Headers": "Content-Type"
        }
    )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest) -> ChatResponse:
    """
    Chat with the AI agent system.
    
    The agent will analyze your request, gather relevant information,
    and take appropriate actions on your behalf.
    """
    try:
        logger.info(f"🤖 New chat request: {request.message[:100]}...")
        
        # Get agent graph
        agent = get_agent_graph()
        
        # Process the user input
        response = await agent.process_user_input(
            user_input=request.message,
            thread_id=request.thread_id
        )
        
        # Get or create thread ID
        thread_id = request.thread_id or str(uuid.uuid4())
        
        logger.info(f"✅ Chat request processed successfully for thread {thread_id}")
        
        return ChatResponse(
            response=response,
            thread_id=thread_id,
            agent_used="Planning + Executor Agents",
            success=True
        )
    
    except Exception as e:
        logger.error(f"❌ Error processing chat request: {e}")
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
        data = memory_system._load_memory_data()
        
        threads = []
        for thread_id, thread_data in data.items():
            exchanges = thread_data.get('exchanges', [])
            last_updated = thread_data.get('last_updated', 'Unknown')
            created_at = thread_data.get('created_at', 'Unknown')
            
            # Get the latest exchange for preview
            latest_exchange = None
            if exchanges:
                latest_exchange = exchanges[-1]
            
            thread_info = {
                "id": thread_id,
                "created_at": created_at,
                "last_updated": last_updated,
                "message_count": len(exchanges),
                "latest_message": latest_exchange.get('user_message', '') if latest_exchange else '',
                "latest_response": latest_exchange.get('executor_summary', latest_exchange.get('planner_summary', '')) if latest_exchange else '',
                "title": latest_exchange.get('user_message', 'New Conversation')[:50] + '...' if latest_exchange and len(latest_exchange.get('user_message', '')) > 50 else latest_exchange.get('user_message', 'New Conversation') if latest_exchange else 'Empty Conversation'
            }
            threads.append(thread_info)
        
        # Sort by last_updated (most recent first)
        threads.sort(key=lambda x: x['last_updated'], reverse=True)
        
        return {
            "success": True,
            "threads": threads,
            "total_count": len(threads)
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
    Get the current status of the agent system.
    """
    try:
        # Check if agent is initialized
        agent_initialized = agent_graph is not None
        
        status_info = {
            "agent_initialized": agent_initialized,
            "system_healthy": True,
            "available_models": {
                "planning_model": "gemini-2.0-flash-exp",
                "executor_model": "gemini-2.0-flash-thinking-exp-1219"
            },
            "features": {
                "planning_agent": True,
                "executor_agent": True,
                "memory_system": True,
                "conversation_threading": True,
                "objective_management": True,
                "gamification": True
            }
        }
        
        if agent_initialized:
            status_info["message"] = "Agent system is ready and operational"
        else:
            status_info["message"] = "Agent system will be initialized on first request"
        
        return status_info
    
    except Exception as e:
        logger.error(f"❌ Error getting agent status: {e}")
        return {
            "agent_initialized": False,
            "system_healthy": False,
            "error": str(e),
            "message": "Agent system encountered an error"
        }


@router.post("/initialize")
async def initialize_agent_system(background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    Manually initialize the agent system.
    """
    try:
        # Initialize in background if not already done
        if agent_graph is None:
            background_tasks.add_task(get_agent_graph)
            
        return {
            "success": True,
            "message": "Agent system initialization started",
            "status": "initializing"
        }
    
    except Exception as e:
        logger.error(f"❌ Error initializing agent system: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize agent system: {str(e)}"
        ) 