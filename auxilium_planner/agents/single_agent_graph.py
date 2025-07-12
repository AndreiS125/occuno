"""
Single Agent Graph for Auxilium AI System

This module implements a streamlined single-agent approach that combines planning 
and execution into one efficient workflow. Designed to be faster and less resource-intensive
than the multi-agent system.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import re
import uuid
import asyncio

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, MessagesState, START, END

from core.config import settings
from core.logging_config import get_logger
from core.quota_manager import initialize_quota_manager
from core.quota_aware_llm import create_quota_aware_chat_model
from agents.memory_system import MemorySystem
from agents.tools import ALL_PLANNING_TOOLS, ALL_EXECUTOR_TOOLS
from agents.prompts.single_agent_prompt import SINGLE_AGENT_PROMPT

logger = get_logger("single_agent_graph")


class SingleAgentState(MessagesState):
    """Simplified state for single agent workflow."""
    user_input: str = ""
    user_memories: str = ""
    thread_id: str = ""
    exchange_id: str = ""
    final_response: str = ""
    conversation_history: str = ""
    iteration_count: int = 0
    terminal_tool_executed: bool = False


class SingleAgentGraph:
    """Streamlined single agent that combines planning and execution."""
    
    def __init__(self):
        self.memory_system = MemorySystem()
        
        # Initialize quota manager if enabled
        if settings.quota_manager_enabled:
            initialize_quota_manager(settings.get_all_api_keys())
        
        self._initialize_model()
        self._setup_tools()
        self.graph = self._build_graph()
        
    def _initialize_model(self):
        """Initialize the LLM model with optimized settings for speed."""
        # More efficient model configuration - less thinking, faster responses
        model_config = {
            "model": "gemini-2.5-flash",
            "temperature": 0.7,  # Slightly higher for more direct responses
            "max_output_tokens": 4096,  # Reasonable limit
            "top_p": 0.9,
            "top_k": 40,
            "max_retries": 2,  # Fewer retries for speed
            "include_thoughts": True,
            "thinking_budget": 800,  # Reduced thinking budget for speed
            "timeout": 30  # Shorter timeout
        }
        
        if settings.quota_manager_enabled:
            self.llm = create_quota_aware_chat_model(**model_config)
        else:
            base_config = {**model_config, "api_key": settings.google_api_key}
            del base_config["thinking_budget"]  # Remove if not quota-aware
            self.llm = ChatGoogleGenerativeAI(**base_config)
    
    def _setup_tools(self):
        """Combine all tools from both agents, removing duplicates."""
        all_tools = []
        seen_tools = set()
        
        # Add planning tools
        for tool in ALL_PLANNING_TOOLS:
            if tool.name not in seen_tools:
                all_tools.append(tool)
                seen_tools.add(tool.name)
        
        # Add executor tools (skip duplicates)
        for tool in ALL_EXECUTOR_TOOLS:
            if tool.name not in seen_tools:
                all_tools.append(tool)
                seen_tools.add(tool.name)
        
        # Remove conflicting final response tools - keep only final_response_to_user
        self.all_tools = [tool for tool in all_tools if tool.name != 'final_response']
        
        # Bind tools to the agent
        self.agent = self.llm.bind_tools(self.all_tools)
        
        logger.info(f"Single agent initialized with {len(self.all_tools)} tools")
    
    def _create_tool_node(self):
        """Create a tool execution node."""
        tool_map = {tool.name: tool for tool in self.all_tools}
        
        async def execute_tools(state: SingleAgentState) -> Dict[str, Any]:
            messages = state.get("messages", [])
            if not messages:
                return {"messages": []}
            
            last_message = messages[-1]
            if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
                return {"messages": []}
            
            tool_messages = []
            updates = {}
            
            for tool_call in last_message.tool_calls:
                tool_name = tool_call.get('name')
                tool_args = tool_call.get('args', {})
                tool_id = tool_call.get('id', 'unknown')
                
                try:
                    if tool_name in tool_map:
                        result = await tool_map[tool_name].ainvoke(tool_args)
                        
                        # Handle terminal tool
                        if tool_name == 'final_response_to_user':
                            updates["terminal_tool_executed"] = True
                            try:
                                result_data = json.loads(str(result))
                                updates["final_response"] = result_data.get('response_content', '')
                                # Update memory with action summary
                                if result_data.get('action_summary') and state.get("thread_id") and state.get("exchange_id"):
                                    await self.memory_system.update_executor_summary(
                                        state["thread_id"], state["exchange_id"], result_data['action_summary']
                                    )
                            except:
                                pass
                        
                        tool_messages.append(ToolMessage(content=str(result), name=tool_name, tool_call_id=tool_id))
                    else:
                        tool_messages.append(ToolMessage(content=f"Tool {tool_name} not found", name=tool_name, tool_call_id=tool_id))
                except Exception as e:
                    tool_messages.append(ToolMessage(content=f"Error: {str(e)}", name=tool_name, tool_call_id=tool_id))
            
            return {"messages": tool_messages, **updates}
        
        return execute_tools
    
    def _build_graph(self) -> StateGraph:
        """Build the simplified LangGraph workflow."""
        workflow = StateGraph(SingleAgentState)
        
        # Simple 3-node workflow: initialize -> agent -> finalize
        workflow.add_node("initialize", self._initialize_node)
        workflow.add_node("agent", self._agent_node)
        workflow.add_node("tools", self._create_tool_node())
        workflow.add_node("finalize", self._finalize_node)
        
        # Linear flow with tool execution loop
        workflow.add_edge(START, "initialize")
        workflow.add_edge("initialize", "agent")
        
        # Agent decides whether to use tools or finalize
        workflow.add_conditional_edges(
            "agent",
            self._should_continue,
            {"tools": "tools", "finalize": "finalize"}
        )
        
        # After tools, check if we should continue or finalize
        workflow.add_conditional_edges(
            "tools",
            self._should_continue_after_tools,
            {"agent": "agent", "finalize": "finalize"}
        )
        
        workflow.add_edge("finalize", END)
        
        return workflow.compile(checkpointer=self.memory_system.get_checkpointer())
    
    def _should_continue(self, state: SingleAgentState) -> str:
        """Determine if agent should use tools or finalize."""
        iteration_count = state.get("iteration_count", 0)
        
        # Check if we've reached iteration limit
        if iteration_count >= 10:  # More aggressive limit to prevent hanging
            logger.info(f"🔄 Single agent reached iteration limit ({iteration_count}), finalizing")
            return "finalize"
        
        # Check if we have tool calls
        messages = state.get("messages", [])
        if messages and hasattr(messages[-1], 'tool_calls') and messages[-1].tool_calls:
            tool_calls = messages[-1].tool_calls
            logger.info(f"🔧 Single agent has {len(tool_calls)} tool calls to execute")
            return "tools"
        
        logger.info(f"🏁 Single agent has no tool calls, finalizing")
        return "finalize"
    
    def _should_continue_after_tools(self, state: SingleAgentState) -> str:
        """Determine flow after tool execution."""
        iteration_count = state.get("iteration_count", 0)
        terminal_executed = state.get("terminal_tool_executed", False)
        
        # If terminal tool was executed, finalize
        if terminal_executed:
            logger.info(f"🔚 Terminal tool executed, finalizing")
            return "finalize"
        
        # Check iteration count
        if iteration_count >= 10:
            logger.info(f"🔄 Iteration limit reached ({iteration_count}), finalizing")
            return "finalize"
        
        # Continue with agent
        logger.info(f"🔁 Continuing to agent (iteration {iteration_count})")
        return "agent"
    
    async def _initialize_node(self, state: SingleAgentState) -> Dict[str, Any]:
        """Initialize the single agent workflow."""
        try:
            user_context = await self.memory_system.get_user_context()
            
            user_input = ""
            if state["messages"]:
                last_message = state["messages"][-1]
                user_input = last_message.content if hasattr(last_message, 'content') else str(last_message)
            
            thread_id = state.get("thread_id", "default")
            exchange_id = await self.memory_system.start_new_exchange(thread_id, user_input)
            conversation_history = await self.memory_system.get_context_for_planner(thread_id)
            
            return {
                "user_input": user_input,
                "user_memories": user_context["user_memories"],
                "thread_id": thread_id,
                "exchange_id": exchange_id,
                "conversation_history": conversation_history,
                "iteration_count": 0,
                "terminal_tool_executed": False
            }
        
        except Exception as e:
            logger.error(f"Error in initialize node: {e}")
            return {
                "user_input": "Error initializing workflow",
                "iteration_count": 0,
                "terminal_tool_executed": False
            }
    
    async def _agent_node(self, state: SingleAgentState) -> Dict[str, Any]:
        """Execute the single agent."""
        try:
            user_context = await self.memory_system.get_user_context()
            
            # Create system prompt
            system_prompt = self._create_system_prompt(
                user_context["formatted_date"],
                state["user_memories"]
            )
            
            messages = [SystemMessage(content=system_prompt)]
            
            # Add conversation context on first iteration
            if state.get("iteration_count", 0) == 0:
                user_message_content = state["user_input"]
                conversation_context = state.get("conversation_history", "")
                
                if conversation_context and conversation_context != "No previous conversation history.":
                    user_message_content += f"\n\nPrevious conversation history:\n{conversation_context}"
                
                messages.append(HumanMessage(content=user_message_content))
            else:
                # Continue conversation
                messages.extend(state.get("messages", []))
                messages.append(HumanMessage(content="Continue with the task."))
            
            # Get response from agent
            response = await self.agent.ainvoke(messages)
            final_response = self._process_agent_response(response)
            
            return {
                "messages": [final_response],
                "iteration_count": state.get("iteration_count", 0) + 1
            }
        
        except Exception as e:
            logger.error(f"Error in agent node: {e}")
            return {
                "messages": [AIMessage(content=f"Agent error: {str(e)}")]
            }
    
    def _process_agent_response(self, response):
        """Process agent response to handle thinking content."""
        try:
            if isinstance(response.content, list):
                # Extract thinking content for display
                thoughts = []
                for part in response.content:
                    try:
                        if isinstance(part, dict) and part.get("type") == "thinking" and part.get("thinking"):
                            thoughts.append(part["thinking"])
                    except (KeyError, TypeError) as e:
                        logger.warning(f"Skipping malformed thinking part: {part} - Error: {e}")
                        continue
                
                if thoughts:
                    print(f"—–– Single Agent THOUGHTS —––––")
                    for thought in thoughts[:500]:  # Limit thinking output
                        print(thought)
                
                # Extract text content
                text_content = []
                for part in response.content:
                    try:
                        if isinstance(part, dict) and part.get("type") == "text":
                            text_content.append(part.get("text", ""))
                        elif isinstance(part, str):
                            text_content.append(part)
                    except (KeyError, TypeError) as e:
                        logger.warning(f"Skipping malformed content part: {part} - Error: {e}")
                        continue
                
                return AIMessage(
                    content=" ".join(text_content) if text_content else "",
                    tool_calls=response.tool_calls if hasattr(response, 'tool_calls') else None,
                    usage_metadata=getattr(response, 'usage_metadata', None),
                    response_metadata=getattr(response, 'response_metadata', {}),
                    id=getattr(response, 'id', None)
                )
            else:
                return response
        except Exception as e:
            logger.error(f"Error processing agent response: {e}")
            # Return a safe fallback response
            return AIMessage(
                content=str(response.content) if hasattr(response, 'content') else "",
                tool_calls=response.tool_calls if hasattr(response, 'tool_calls') else None,
                usage_metadata=getattr(response, 'usage_metadata', None),
                response_metadata=getattr(response, 'response_metadata', {}),
                id=getattr(response, 'id', None)
            )
    
    async def _finalize_node(self, state: SingleAgentState) -> Dict[str, Any]:
        """Finalize the single agent workflow."""
        try:
            final_response = state.get("final_response", "")
            
            # Extract final response from tool messages if not already set
            if not final_response:
                messages = state.get("messages", [])
                for msg in reversed(messages):
                    if hasattr(msg, 'content') and hasattr(msg, 'name'):
                        if msg.name == 'final_response_to_user':
                            try:
                                json_match = re.search(r'\{.*"response_content".*\}', msg.content, re.DOTALL)
                                if json_match:
                                    response_data = json.loads(json_match.group())
                                    final_response = response_data.get("response_content", "")
                                    break
                            except:
                                pass
                
                if not final_response:
                    final_response = "Task completed successfully."
            
            return {
                "final_response": final_response
            }
        
        except Exception as e:
            logger.error(f"Error in finalize node: {e}")
            return {
                "final_response": f"Workflow completed with error: {str(e)}"
            }
    
    def _create_system_prompt(self, current_date: str, user_memories: str) -> str:
        """Create the system prompt combining planning and execution."""
        return SINGLE_AGENT_PROMPT.format(
            current_date=current_date,
            user_memories=user_memories
        )

    async def process_user_input(self, user_input: str, thread_id: Optional[str] = None) -> str:
        """Process user input through the single agent workflow."""
        try:
            if not thread_id:
                thread_id = await self.memory_system.create_new_thread()
            
            initial_state = {
                "messages": [HumanMessage(content=user_input)],
                "thread_id": thread_id
            }
            
            config = RunnableConfig(
                configurable={"thread_id": thread_id},
                recursion_limit=20,  # More aggressive limit to prevent hanging
                max_steps=20
            )
            
            result = await self.graph.ainvoke(initial_state, config)
            return result.get("final_response", "I've processed your request.")
        
        except Exception as e:
            logger.error(f"Error processing user input: {e}")
            return f"I apologize, but I encountered an error while processing your request: {str(e)}"
    
    def get_graph(self):
        """Get the compiled LangGraph."""
        return self.graph


class StreamingSingleAgentGraph(SingleAgentGraph):
    """Enhanced SingleAgentGraph with streaming capabilities"""
    
    def __init__(self):
        super().__init__()
        self.event_queue = asyncio.Queue()
        self.streaming_active = False
        self.current_execution_id = None
        self.current_thread_id = None
        self.current_exchange_id = None
        self.final_response_emitted = False
        self.original_agent_method = None
        
        # Store tool calls to associate with results
        self.pending_tool_calls = {}  # tool_call_id -> {tool_name, tool_args, agent}
    
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
                    event.get('agent', 'single'),
                    event.get('content', ''),
                    event
                )
    
    async def process_user_input_streaming(self, user_input: str, thread_id: Optional[str] = None):
        """Process user input with streaming events"""
        self.streaming_active = True
        self.current_execution_id = str(uuid.uuid4())
        self.final_response_emitted = False
        self.pending_tool_calls = {}  # Reset for new execution
        
        try:
            logger.info(f"🎬 StreamingSingleAgentGraph: Starting processing for: {user_input[:100]}...")
            
            # Create or get thread ID
            if not thread_id:
                thread_id = await self.memory_system.create_new_thread()
                logger.info(f"🆕 Created new thread: {thread_id}")
            
            self.current_thread_id = thread_id
            
            # Start new exchange
            exchange_id = await self.memory_system.start_new_exchange(thread_id, user_input)
            self.current_exchange_id = exchange_id
            
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
            
            # Override the agent method to capture original thinking content
            self._setup_streaming_overrides()
            
            # Start processing with streaming
            final_response = await self._process_with_streaming(user_input, thread_id)
            logger.info(f"✅ StreamingSingleAgentGraph: Processing complete, final response: {final_response[:100]}...")
            
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
            
            logger.info(f"🏁 StreamingSingleAgentGraph: Workflow completed successfully")
            
        except Exception as e:
            logger.error(f"❌ StreamingSingleAgentGraph error: {e}")
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
    
    async def _process_with_streaming(self, user_input: str, thread_id: str) -> str:
        """Process the user input with detailed streaming events"""
        # Create initial state
        initial_state = {
            "messages": [HumanMessage(content=user_input)],
            "thread_id": thread_id
        }
        
        # Configure the run
        config = RunnableConfig(
            configurable={"thread_id": thread_id},
            recursion_limit=80,  # More aggressive limit to prevent hanging
            max_steps=100
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
            
            # Handle content - thinking is captured separately in agent overrides
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
        # For single agent, everything is just 'single'
        if 'agent' in node_name.lower():
            return 'single'
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
        """Override agent method to capture thinking content"""
        # Store original method
        self.original_agent_method = self.agent.ainvoke
        
        # Create quota pause callback
        async def quota_pause_callback(event_type, data):
            if self.streaming_active:
                await self.emit_event({
                    'type': event_type,
                    'agent': 'system',
                    'data': data
                })
        
        # Create wrapper method that captures original thinking
        async def streaming_single_agent(messages):
            logger.info("🎬 Streaming single agent override called")
            
            # If the agent uses quota-aware LLM, pass the callback
            if hasattr(self.llm, '_get_working_llm'):
                # This is a quota-aware LLM, pass the callback
                original_get_working_llm = self.llm._get_working_llm
                self.llm._get_working_llm = lambda: original_get_working_llm(quota_pause_callback)
            
            original_response = await self.original_agent_method(messages)
            
            # Restore original method
            if hasattr(self.llm, '_get_working_llm'):
                self.llm._get_working_llm = original_get_working_llm
            
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
                            'single',
                            thought,
                            "thinking"
                        )
                    
                    # Emit thinking event
                    await self.emit_event({
                        'type': 'thinking',
                        'agent': 'single',
                        'content': thought,
                        'thinking_id': thinking_id
                    })
                    logger.info(f"💭 Emitted single agent thinking: {thought[:100]}...")
            
            return original_response
        
        # Override the method
        self.agent.ainvoke = streaming_single_agent
    
    def _restore_original_methods(self):
        """Restore original agent method"""
        if self.original_agent_method:
            self.agent.ainvoke = self.original_agent_method 