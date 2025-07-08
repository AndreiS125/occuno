"""
Agent Graph for Auxilium AI System

This module implements the LangGraph workflow that orchestrates the Planning and Executor agents.
The workflow follows the specifications:

1. Planning Agent: Analyzes user input and gathers information
2. Executor Agent: Takes action based on the planning analysis
"""

from typing import Dict, List, Any, Optional, Annotated
from datetime import datetime
import json
import asyncio
import re

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.graph.message import add_messages
# from langgraph.prebuilt import ToolNode  # Temporarily commented out due to import issue

from core.config import settings
from core.logging_config import get_logger
from core.quota_manager import initialize_quota_manager, get_quota_manager
from core.quota_aware_llm import create_quota_aware_chat_model
from agents.prompts import PLANNING_AGENT_PROMPT, EXECUTOR_AGENT_PROMPT
from agents.tools import ALL_PLANNING_TOOLS, ALL_EXECUTOR_TOOLS
from agents.memory_system import MemorySystem

logger = get_logger("agent_graph")
planning_model = "gemini-2.5-flash"
executor_model = "gemini-2.5-flash"


class AgentState(MessagesState):
    """
    State for the agent workflow.
    Extends MessagesState to include additional fields for the agent system.
    """
    planning_analysis: str = ""
    user_input: str = ""
    current_agent: str = ""
    iteration_count: int = 0
    user_memories: str = ""
    thread_id: str = ""
    exchange_id: str = ""
    final_response: str = ""
    conversation_history: str = ""
    planner_summary: str = ""
    executor_summary: str = ""
    # Add conversation history for each agent
    planning_conversation: List = []
    executor_conversation: List = []


class AgentGraph:
    """
    Main agent graph that orchestrates the Planning and Executor agents.
    """
    
    def __init__(self):
        self.logger = logger
        self.memory_system = MemorySystem()
        
        # Initialize quota manager with all available API keys
        if settings.quota_manager_enabled:
            all_keys = settings.get_all_api_keys()
            initialize_quota_manager(all_keys)
            logger.info(f"🔑 Initialized quota manager with {len(all_keys)} API keys")
        
        # Initialize models and build graph
        self._initialize_models()
    

    
    def _initialize_models(self):
        """Initialize the LLM models and build the graph."""
        # Initialize Gemini 2.5 Flash models with enhanced configuration and quota management
        if settings.quota_manager_enabled:
            # Use quota-aware models
            self.planning_llm = create_quota_aware_chat_model(
                model="gemini-2.5-flash",
                temperature=settings.llm_temperature,
                max_output_tokens=settings.llm_max_output_tokens,
                top_p=settings.llm_top_p,
                top_k=settings.llm_top_k,
                max_retries=settings.retry_attempts,
                include_thoughts=True,
                thinking_budget=3000,
                timeout=settings.request_timeout
            )
            
            self.executor_llm = create_quota_aware_chat_model(
                model="gemini-2.5-flash",
                temperature=settings.llm_temperature + 0.1,  # Slightly higher for creativity
                max_output_tokens=settings.llm_max_output_tokens,
                top_p=settings.llm_top_p,
                top_k=settings.llm_top_k,
                max_retries=settings.retry_attempts,
                include_thoughts=True,
                thinking_budget=3000,
                timeout=settings.request_timeout
            )
        else:
            # Use regular models (fallback)
            self.planning_llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                api_key=settings.google_api_key,
                temperature=settings.llm_temperature,
                max_output_tokens=settings.llm_max_output_tokens,
                top_p=settings.llm_top_p,
                top_k=settings.llm_top_k,
                max_retries=settings.retry_attempts,
                include_thoughts=True,
                thinking_budget=3000,
                timeout=settings.request_timeout
            )
            
            self.executor_llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                api_key=settings.google_api_key,
                temperature=settings.llm_temperature + 0.1,  # Slightly higher for creativity
                max_output_tokens=settings.llm_max_output_tokens,
                top_p=settings.llm_top_p,
                top_k=settings.llm_top_k,
                max_retries=settings.retry_attempts,
                include_thoughts=True,
                thinking_budget=3000,
                timeout=settings.request_timeout
            )
        
        logger.info(f"✅ Initialized models:")
        logger.info(f"   🧠 Planning: {planning_model}")
        logger.info(f"   ⚡ Executor: {executor_model}")
        logger.info(f"   💭 Thinking mode: {'enabled' if settings.enable_thinking_mode else 'disabled'}")
        
        # Bind tools to models
        self.planning_agent = self.planning_llm.bind_tools(ALL_PLANNING_TOOLS)
        self.executor_agent = self.executor_llm.bind_tools(ALL_EXECUTOR_TOOLS)
        
        # Build the graph
        self.graph = self._build_graph()
        
        logger.info("✅ Agent Graph initialized successfully")
    
    def _create_tool_node(self, tools: List):
        """
        Create a custom tool execution node to replace ToolNode.
        
        Args:
            tools: List of tools to execute
            
        Returns:
            Async function that executes tools
        """
        from langchain_core.messages import ToolMessage
        
        # Create a tool map for quick lookup
        tool_map = {tool.name: tool for tool in tools}
        
        async def execute_tools(state: AgentState) -> Dict[str, Any]:
            """Execute tools from the last AI message's tool calls."""
            try:
                messages = state.get("messages", [])
                if not messages:
                    return {"messages": []}
                
                last_message = messages[-1]
                if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
                    return {"messages": []}
                
                tool_messages = []
                planning_analysis_update = None
                terminal_tool_executed = False
                final_response_content = None
                
                for tool_call in last_message.tool_calls:
                    tool_name = tool_call.get('name')
                    tool_args = tool_call.get('args', {})
                    tool_id = tool_call.get('id', 'unknown')
                    
                    if tool_name in tool_map:
                        try:
                            # Execute the tool
                            result = await tool_map[tool_name].ainvoke(tool_args)
                            
                            # DEBUG: Print all tool results for debugging
                            logger.info(f"🔧 TOOL RESULT: {tool_name}")
                            logger.info(f"✅ {result}")
                            
                            # DEBUG: Check extraction conditions
                            logger.info(f"🔍 Current agent: {state.get('current_agent')}")
                            logger.info(f"🔍 Tool name: {tool_name}")
                            
                            # Extract summaries from final_response tools
                            # Check by tool name and conversation context instead of current_agent state
                            if tool_name == 'final_response_to_user':
                                # Extract executor summary from the tool result (not args)
                                logger.info(f"🔍 Processing final_response_to_user tool result for executor agent")
                                logger.info(f"🔍 Thread ID: {state.get('thread_id')}, Exchange ID: {state.get('exchange_id')}")
                                logger.info(f"🔍 RAW TOOL RESULT: {result}")
                                try:
                                    result_data = json.loads(str(result))
                                    logger.info(f"🔍 PARSED RESULT DATA: {result_data}")
                                    
                                    summary = result_data.get('action_summary', '')
                                    response_content = result_data.get('response_content', '')
                                    
                                    logger.info(f"🔍 EXTRACTED SUMMARY: '{summary}' (length: {len(summary)})")
                                    logger.info(f"🔍 EXTRACTED RESPONSE_CONTENT: '{response_content[:200]}...' (length: {len(response_content)})")
                                    
                                    # If no action summary provided, create a default one
                                    if not summary:
                                        summary = "Executor agent completed the requested task successfully."
                                        logger.info(f"🔍 No action summary provided, using default: {summary}")
                                    else:
                                        logger.info(f"🔍 Using provided action summary: {summary[:100]}...")
                                    
                                    if state.get("thread_id") and state.get("exchange_id"):
                                        logger.info(f"🔍 Attempting to save executor summary...")
                                        await self.memory_system.update_executor_summary(
                                            state["thread_id"], 
                                            state["exchange_id"], 
                                            summary
                                        )
                                        logger.info(f"📝 Saved executor summary for exchange {state['exchange_id']}")
                                    else:
                                        logger.warning(f"🔍 Cannot save executor summary - missing thread_id or exchange_id: thread_id={state.get('thread_id')}, exchange_id={state.get('exchange_id')}")
                                    
                                    # Mark as terminal tool and extract final response
                                    terminal_tool_executed = True
                                    final_response_content = response_content
                                    logger.info(f"🏁 Terminal tool executed, extracted final response: {response_content[:100]}...")
                                    logger.info(f"🏁 FINAL_RESPONSE_CONTENT SET TO: '{final_response_content[:200]}...' (length: {len(final_response_content)})")
                                    
                                except (json.JSONDecodeError, AttributeError) as e:
                                    logger.warning(f"Could not parse final_response_to_user tool result: {e}")
                                    logger.warning(f"Raw result: {result}")
                            
                            elif tool_name == 'final_response':
                                # Extract planner summary from the tool result (not args)
                                logger.info(f"🔍 Processing final_response tool result for planning agent")
                                logger.info(f"🔍 Thread ID: {state.get('thread_id')}, Exchange ID: {state.get('exchange_id')}")
                                try:
                                    result_data = json.loads(str(result))
                                    summary = result_data.get('summary_content', '')
                                    analysis = result_data.get('analysis_content', '')
                                    
                                    logger.info(f"🔍 Extracted summary: {summary[:100]}..." if summary else "🔍 No summary content found")
                                    logger.info(f"🔍 Extracted analysis: {analysis[:100]}..." if analysis else "🔍 No analysis content found")
                                    
                                    if summary and state.get("thread_id") and state.get("exchange_id"):
                                        logger.info(f"🔍 Attempting to save planner summary...")
                                        await self.memory_system.update_planner_summary(
                                            state["thread_id"], 
                                            state["exchange_id"], 
                                            summary
                                        )
                                        logger.info(f"📝 Saved planner summary for exchange {state['exchange_id']}")
                                    else:
                                        logger.warning(f"🔍 Cannot save summary - missing data: summary={bool(summary)}, thread_id={state.get('thread_id')}, exchange_id={state.get('exchange_id')}")
                                    
                                    # Store planning analysis for state update
                                    if analysis:
                                        planning_analysis_update = analysis
                                        logger.info(f"📝 Planning analysis extracted ({len(analysis)} chars)")
                                except (json.JSONDecodeError, AttributeError) as e:
                                    logger.warning(f"Could not parse final_response tool result: {e}")
                                    logger.warning(f"Raw result: {result}")
                                
                                # Mark as terminal tool (planning agent final response)
                                terminal_tool_executed = True
                                logger.info(f"🏁 Terminal tool executed: {tool_name}")
                            
                            # Create tool message
                            tool_message = ToolMessage(
                                content=str(result),
                                name=tool_name,
                                tool_call_id=tool_id
                            )
                            tool_messages.append(tool_message)
                            
                            logger.info(f"🔧 Executed tool {tool_name} successfully")
                            
                        except Exception as e:
                            logger.error(f"❌ Error executing tool {tool_name}: {e}")
                            error_message = ToolMessage(
                                content=f"Error executing {tool_name}: {str(e)}",
                                name=tool_name,
                                tool_call_id=tool_id
                            )
                            tool_messages.append(error_message)
                    else:
                        logger.warning(f"⚠️ Tool {tool_name} not found in tool map")
                        error_message = ToolMessage(
                            content=f"Tool {tool_name} not found",
                            name=tool_name,
                            tool_call_id=tool_id
                        )
                        tool_messages.append(error_message)
                
                # Update the appropriate conversation history with proper ordering
                current_agent = state.get("current_agent", "")
                updated_state = {"messages": tool_messages}
                
                # Add terminal tool information
                if terminal_tool_executed:
                    updated_state["terminal_tool_executed"] = True
                    if final_response_content:
                        updated_state["final_response_content"] = final_response_content
                        logger.info(f"🏁 Terminal tool complete, final response ready")
                        logger.info(f"🏁 SETTING STATE final_response_content TO: '{final_response_content[:200]}...' (length: {len(final_response_content)})")
                    else:
                        logger.warning(f"🏁 Terminal tool executed but no final_response_content extracted!")
                
                # Add planning analysis to state if extracted
                if planning_analysis_update:
                    updated_state["planning_analysis"] = planning_analysis_update
                    logger.info(f"📝 Set planning analysis in state for executor ({len(planning_analysis_update)} chars)")
                    logger.info(f"📝 Analysis preview: {planning_analysis_update[:200]}...")
                else:
                    logger.warning(f"⚠️ No planning analysis extracted to pass to executor")
                
                if current_agent == "planning":
                    planning_conv = state.get("planning_conversation", [])
                    # Add tool messages to conversation history
                    planning_conv.extend(tool_messages)
                    updated_state["planning_conversation"] = planning_conv
                elif current_agent == "executor":
                    executor_conv = state.get("executor_conversation", [])
                    # Add tool messages to conversation history  
                    executor_conv.extend(tool_messages)
                    updated_state["executor_conversation"] = executor_conv
                
                return updated_state
                
            except Exception as e:
                logger.error(f"❌ Error in tool execution node: {e}")
                return {"messages": []}
        
        return execute_tools
    
    def _should_finish_from_planning_tools(self, state: AgentState) -> str:
        """Determine if planning tools should route to executor or back to planning agent."""
        terminal_flag = state.get("terminal_tool_executed")
        logger.info(f"🔍 _should_finish_from_planning_tools: terminal_tool_executed = {terminal_flag}")
        logger.info(f"🔍 State keys: {list(state.keys())}")
        
        if terminal_flag:
            logger.info("🏁 Planning terminal tool executed, moving to Executor Agent")
            return "executor"
        else:
            logger.info("🔄 No terminal tool executed, returning to Planning Agent")
            return "planning_agent"
    
    def _should_finish_from_executor_tools(self, state: AgentState) -> str:
        """Determine if executor tools should route to finish or back to executor agent."""
        if state.get("terminal_tool_executed"):
            logger.info("🏁 Executor terminal tool executed, moving to Finalize")
            return "finalize"
        else:
            return "executor_agent"
    
    def _build_graph(self) -> StateGraph:
        """
        Build the LangGraph workflow.
        
        Returns:
            Compiled StateGraph
        """
        # Create the graph
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("initialize", self._initialize_node)
        workflow.add_node("planning_agent", self._planning_agent_node)
        workflow.add_node("planning_tools", self._create_tool_node(ALL_PLANNING_TOOLS))
        workflow.add_node("executor_agent", self._executor_agent_node)
        workflow.add_node("executor_tools", self._create_tool_node(ALL_EXECUTOR_TOOLS))
        workflow.add_node("finalize", self._finalize_node)
        
        # Define the workflow edges
        workflow.add_edge(START, "initialize")
        workflow.add_edge("initialize", "planning_agent")
        
        # Planning agent conditional edges
        workflow.add_conditional_edges(
            "planning_agent",
            self._should_use_planning_tools,
            {
                "tools": "planning_tools",
                "executor": "executor_agent"
            }
        )
        
        # Planning tools conditional edges (NEW: can route directly to executor or back to agent)
        workflow.add_conditional_edges(
            "planning_tools",
            self._should_finish_from_planning_tools,
            {
                "executor": "executor_agent",
                "planning_agent": "planning_agent"
            }
        )
        
        # Executor agent conditional edges
        workflow.add_conditional_edges(
            "executor_agent",
            self._should_use_executor_tools,
            {
                "tools": "executor_tools",
                "finish": "finalize"
            }
        )
        
        # Executor tools conditional edges (NEW: can route directly to finalize or back to agent)
        workflow.add_conditional_edges(
            "executor_tools",
            self._should_finish_from_executor_tools,
            {
                "finalize": "finalize",
                "executor_agent": "executor_agent"
            }
        )
        workflow.add_edge("finalize", END)
        
        # Compile with checkpointer for memory
        return workflow.compile(
            checkpointer=self.memory_system.get_checkpointer()
        )
    
    async def _initialize_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Initialize the agent workflow and start a new exchange.
        """
        try:
            # Get user context
            user_context = await self.memory_system.get_user_context()
            
            # Extract user input from the last message
            user_input = ""
            if state["messages"]:
                last_message = state["messages"][-1]
                if hasattr(last_message, 'content'):
                    user_input = last_message.content
                else:
                    user_input = str(last_message)
            
            thread_id = state.get("thread_id", "default")
            
            # Start a new exchange in the memory system
            exchange_id = await self.memory_system.start_new_exchange(thread_id, user_input)
            
            # Get conversation history for planning agent
            conversation_history = await self.memory_system.get_context_for_planner(thread_id)
            
            logger.info(f"🚀 Initializing agent workflow for input: {user_input[:100]}...")
            logger.info(f"📚 Exchange ID: {exchange_id}")
            
            return {
                "user_input": user_input,
                "user_memories": user_context["user_memories"],
                "current_agent": "planning",
                "iteration_count": 0,
                "thread_id": thread_id,
                "exchange_id": exchange_id,
                "conversation_history": conversation_history,
                "planning_conversation": [],
                "executor_conversation": [],
                "planning_analysis": "",  # Clear any previous planning analysis
                "final_response_content": ""  # Clear any previous final response
            }
        
        except Exception as e:
            logger.error(f"❌ Error in initialize node: {e}")
            return {
                "user_input": "Error initializing workflow",
                "user_memories": "",
                "current_agent": "planning",
                "iteration_count": 0,
                "thread_id": state.get("thread_id", "default"),
                "exchange_id": "",
                "conversation_history": "",
                "planning_conversation": [],
                "executor_conversation": [],
                "planning_analysis": "",  # Clear any previous planning analysis
                "final_response_content": ""  # Clear any previous final response
            }
    
    async def _planning_agent_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Execute the Planning Agent with conversation history.
        """
        try:
            logger.info("🧠 Planning Agent analyzing user request...")
            
            # Get current context with proper timezone
            user_context = await self.memory_system.get_user_context()
            
            # Format the planning prompt - NO user input in system message
            prompt = PLANNING_AGENT_PROMPT.format(
                current_date=user_context["formatted_date"],
                user_memories=state["user_memories"]
            )
            
            # Create system message - contains ONLY instructions
            system_message = SystemMessage(content=prompt)
            
            # Build proper conversation with correct message ordering
            messages = [system_message]
            
            # Get planning conversation history
            planning_conv = state.get("planning_conversation", [])
            
            if not planning_conv:
                # First planning iteration - add user input with conversation history
                conversation_context = state.get("conversation_history", "")
                
                # Format user message with history as specified
                user_message_content = state["user_input"]
                if conversation_context and conversation_context != "No previous conversation history.":
                    user_message_content += f"\n\nPrevious conversation history:\n{conversation_context}"
                
                user_message = HumanMessage(content=user_message_content)
                messages.append(user_message)
            else:
                # Subsequent iterations - add conversation history in proper order
                # Start with user input
                user_message = HumanMessage(content=f"Continue analyzing: {state['user_input']}")
                messages.append(user_message)
                
                # Add the planning conversation history (maintains AI -> Tool -> AI -> Tool pattern)
                messages.extend(planning_conv)
            
            # Call the planning agent
            response = await self.planning_agent.ainvoke(messages)
            
            # Handle structured content with thinking
            if isinstance(response.content, list):
                thoughts = [
                    part["thinking"]
                    for part in response.content
                    if isinstance(part, dict) and part.get("type") == "thinking" and part.get("thinking")
                ]
                print("—–– Planner Agent THOUGHTS —––––")
                for step in thoughts[:1000]:
                    print(step)
                
                # Filter out thinking content and keep only text content
                text_content = []
                for part in response.content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        text_content.append(part.get("text", ""))
                    elif isinstance(part, str):
                        text_content.append(part)
                
                # Create a new response with only text content
                filtered_response = AIMessage(
                    content=" ".join(text_content) if text_content else "",
                    tool_calls=response.tool_calls if hasattr(response, 'tool_calls') else None
                )
                
                # Update conversation history with filtered response
                planning_conv.append(filtered_response)
            else:
                # Update conversation history with original response
                planning_conv.append(response)
            
            # Update iteration count
            new_iteration_count = state.get("iteration_count", 0) + 1
            
            logger.info(f"🧠 Planning Agent iteration {new_iteration_count} completed")
            
            # Use filtered response if we created one, otherwise use original
            message_to_return = filtered_response if 'filtered_response' in locals() else response
            
            return {
                "messages": [message_to_return],
                "planning_conversation": planning_conv,
                "current_agent": "planning",
                "iteration_count": new_iteration_count
            }
        
        except Exception as e:
            logger.error(f"❌ Error in planning agent node: {e}")
            error_message = AIMessage(content=f"Planning Agent error: {str(e)}")
            return {
                "messages": [error_message],
                "current_agent": "planning"
            }
    
    async def _executor_agent_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Execute the Executor Agent (no history, only user input + planning analysis).
        """
        try:
            logger.info("⚡ Executor Agent processing planning analysis...")
            
            # Get planning analysis from state (should be set by tools)
            planning_analysis = state.get("planning_analysis", "No planning analysis available")
            logger.info(f"🔍 EXECUTOR RECEIVED planning_analysis: {planning_analysis[:200] if planning_analysis != 'No planning analysis available' else 'NONE'}...")
            
            # Get current context with proper timezone
            user_context = await self.memory_system.get_user_context()
            
            # Format the executor prompt - ONLY instructions, no user content
            prompt = EXECUTOR_AGENT_PROMPT.format(
                current_date=user_context["formatted_date"],
                user_memories=state["user_memories"]
                # NOTE: planning_analysis is NOT in the system message anymore
            )
            
            # Create system message - contains ONLY instructions, date, and memories
            system_message = SystemMessage(content=prompt)
            
            # Build proper conversation with correct message ordering
            messages = [system_message]
            
            # Get executor conversation history
            executor_conv = state.get("executor_conversation", [])
            
            if not executor_conv:
                # First executor iteration - add user input + planning analysis as user message
                user_message_content = f"Execute the task that the user requested. Follow the planning analysis from the Planning Agent. \n\n Original user request: {state['user_input']}\n\nPlanning analysis from the Planning Agent:\n{planning_analysis}"
                context_message = HumanMessage(content=user_message_content)
                messages.append(context_message)
            else:
                # Subsequent iterations - add conversation history in proper order
                # Start with execution context
                context_message = HumanMessage(content=f"Continue execution for: {state['user_input']}")
                messages.append(context_message)
                
                # Add the executor conversation history (maintains AI -> Tool -> AI -> Tool pattern)
                messages.extend(executor_conv)
            
            # Call the executor agent
            response = await self.executor_agent.ainvoke(messages)
            
            # Handle structured content with thinking
            if isinstance(response.content, list):
                thoughts = [
                    part["thinking"]
                    for part in response.content
                    if isinstance(part, dict) and part.get("type") == "thinking" and part.get("thinking")
                ]
                print("—–– Executor Agent THOUGHTS —––––")
                for step in thoughts[:1000]:
                    print(step)
                
                # Filter out thinking content and keep only text content
                text_content = []
                for part in response.content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        text_content.append(part.get("text", ""))
                    elif isinstance(part, str):
                        text_content.append(part)
                
                # Create a new response with only text content
                filtered_response = AIMessage(
                    content=" ".join(text_content) if text_content else "",
                    tool_calls=response.tool_calls if hasattr(response, 'tool_calls') else None
                )
                
                # Update conversation history with filtered response
                executor_conv.append(filtered_response)
            else:
                # Update conversation history with original response
                executor_conv.append(response)
            
            # Update iteration count
            new_iteration_count = state.get("iteration_count", 0) + 1
            
            logger.info(f"⚡ Executor Agent iteration {new_iteration_count} completed")
            
            
            # Use filtered response if we created one, otherwise use original
            message_to_return = filtered_response if 'filtered_response' in locals() else response
            
            return {
                "messages": [message_to_return],
                "executor_conversation": executor_conv,
                "current_agent": "executor",
                "iteration_count": new_iteration_count,
                "planning_analysis": planning_analysis
            }
        
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            logger.error(f"❌ Error in executor agent node: {e}")
            logger.error(f"❌ Full traceback: {error_traceback}")
            error_message = AIMessage(content=f"Executor Agent error: {str(e)}")
            return {
                "messages": [error_message],
                "current_agent": "executor"
            }
    
    def _should_use_planning_tools(self, state: AgentState) -> str:
        """
        Determine if the planning agent should use tools or pass to executor.
        """
        try:
            iteration_count = state.get("iteration_count", 0)
            planning_conv = state.get("planning_conversation", [])
            
            # Safety: If too many planning iterations, move to executor
            if len(planning_conv) >= 10:  # Allow more iterations for thorough analysis
                logger.info(f"🔀 Planning phase complete ({len(planning_conv)} iterations), moving to Executor")
                return "executor"
            
            # Check if final_response has already been EXECUTED (not just called) in this planning conversation
            # This prevents the planner from being called again after final_response execution
            final_response_executed = False
            for i, msg in enumerate(planning_conv):
                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                    for tc in msg.tool_calls:
                        if tc.get('name') == 'final_response':
                            # Check if the next message is a ToolMessage for this tool call
                            if i + 1 < len(planning_conv):
                                next_msg = planning_conv[i + 1]
                                if hasattr(next_msg, 'name') and next_msg.name == 'final_response':
                                    final_response_executed = True
                                    break
            
            if final_response_executed:
                logger.info("🏁 final_response tool executed in planning, moving to Executor")
                return "executor"
            
            # Check if the last message has tool calls
            if state["messages"]:
                last_message = state["messages"][-1]
                
                # If there are tool calls, ALWAYS execute them first
                if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                    logger.info(f"🔧 Planning tools requested, executing: {[tc.get('name') for tc in last_message.tool_calls]}")
                    return "tools"
                
                # Count how many tool executions we've had in planning  
                tool_execution_count = 0
                
                for msg in planning_conv:
                    if hasattr(msg, 'tool_calls') and msg.tool_calls:
                        tool_execution_count += 1
                
                # If no tool calls in last message, check tool execution count
                if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
                    # If we've done minimal tool gathering, stay in planning for more analysis
                    if tool_execution_count < 1:
                        logger.info("🔧 Insufficient context gathering, staying in planning phase")
                        return "tools"  # This will cause the planner to be called again
                    else:
                        # We've gathered context, this might be the analysis phase
                        logger.info("🔀 Planning analysis complete, moving to Executor Agent")
                        return "executor"
            
            # If no messages or unclear state, allow planning to continue
            logger.info("🔧 Planning phase continuing")
            return "tools"
        
        except Exception as e:
            logger.error(f"❌ Error in planning routing: {e}")
            return "executor"
    
    def _should_use_executor_tools(self, state: AgentState) -> str:
        """
        Determine if the executor agent should use tools or finish.
        """
        try:
            iteration_count = state.get("iteration_count", 0)
            
            # Safety: Check iteration limit first to prevent infinite loops
            if iteration_count >= settings.max_agent_iterations:
                logger.warning(f"⚠️ Max iterations ({settings.max_agent_iterations}) reached, finishing")
                return "finish"
            
            # Get executor conversation history
            executor_conv = state.get("executor_conversation", [])
            
            # Note: final_response_to_user routing is now handled by executor_tools node directly
            
            # Check if the last message has tool calls
            if executor_conv:
                last_message = executor_conv[-1]
                
                # Skip content-based error checking - rely on tool results instead
                
                # If there are tool calls, execute them
                if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                    tool_names = [tc.get('name') for tc in last_message.tool_calls]
                    
                    # Check for plan tool loops using conversation history
                    plan_count = 0
                    for msg in executor_conv:  # Check entire executor conversation
                        if hasattr(msg, 'tool_calls') and msg.tool_calls:
                            for tc in msg.tool_calls:
                                if tc.get('name') == 'plan':
                                    plan_count += 1
                    
                    # If plan was called 3+ times in conversation, force finish to break the loop
                    if plan_count >= 3:
                        logger.warning(f"⚠️ Plan tool called {plan_count} times in conversation, breaking loop")
                        return "finish"
                    
                    # Count action tools executed to determine if we've done enough comprehensive work
                    action_count = 0
                    for msg in executor_conv:
                        if hasattr(msg, 'tool_calls') and msg.tool_calls:
                            for tc in msg.tool_calls:
                                if tc.get('name') in ['create_objective', 'update_objective', 'delete_objective', 
                                                    'update_gamification_stats', 'save_user_memory']:
                                    action_count += 1
                    
                    # For complex learning goals, we need MANY more actions (30-50+)
                    # Only start considering completion after substantial work
                    if action_count >= 25:
                        logger.info(f"🎯 Substantial work completed ({action_count} actions), considering completion")
                        # Allow more actions, then force completion at a much higher threshold
                        if action_count >= 40:
                            logger.warning(f"⚠️ Extremely comprehensive work done ({action_count} actions), forcing completion")
                            return "finish"
                    
                    # For action tools (create_objective, etc.), always execute
                    action_tools = ['create_objective', 'update_objective', 'delete_objective', 
                                  'update_gamification_stats', 'save_user_memory']
                    if any(tool in tool_names for tool in action_tools):
                        logger.info(f"🔧 Action tools detected: {tool_names}, executing")
                        return "tools"
                    
                    # For other tools (including plan), execute but track
                    return "tools"
                
                # Skip content-based completion signals - rely on tool calls only
            
            # If no executor conversation yet or no tool calls, start with tools
            if not executor_conv or iteration_count < 2:
                return "tools"
            
            # If we've had some iterations without progress, finish
            logger.info("🔀 Multiple iterations without clear progress, finishing")
            return "finish"
        
        except Exception as e:
            logger.error(f"❌ Error in executor routing: {e}")
            return "finish"  # Default to finish if error
    
    async def _finalize_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Finalize the agent workflow and extract the final response.
        """
        try:
            logger.info("🏁 Finalizing agent workflow...")
            logger.info(f"🔍 FINALIZE STATE KEYS: {list(state.keys())}")
            
            # Use the final response content extracted directly from the tool
            final_response = state.get("final_response_content", "")
            logger.info(f"🔍 FINAL_RESPONSE_CONTENT FROM STATE: '{final_response[:200]}...' (length: {len(final_response)})")
            
            if final_response:
                logger.info(f"✅ Using extracted final response ({len(final_response)} chars)")
            else:
                # Fallback: try to extract from conversation (old method)
                logger.warning("⚠️ No final response content in state, falling back to conversation parsing")
                executor_conv = state.get("executor_conversation", [])
                logger.info(f"🔍 EXECUTOR_CONVERSATION LENGTH: {len(executor_conv)}")
                
                for i, msg in enumerate(reversed(executor_conv)):
                    logger.info(f"🔍 CHECKING MESSAGE {len(executor_conv)-i-1}: {type(msg)}")
                    if hasattr(msg, 'content'):
                        content = msg.content
                        logger.info(f"🔍 MESSAGE CONTENT: {content[:300]}...")
                        if "final_response_to_user" in content and "response_content" in content:
                            try:
                                # Parse the JSON response from the tool
                                import json
                                import re
                                json_match = re.search(r'\{.*"response_content".*\}', content, re.DOTALL)
                                if json_match:
                                    response_data = json.loads(json_match.group())
                                    final_response = response_data.get("response_content", "")
                                    logger.info(f"✅ Fallback extraction successful ({len(final_response)} chars)")
                                    break
                            except Exception as json_error:
                                logger.error(f"❌ Error parsing final response JSON: {json_error}")
                
                # If still no response found, use default message
                if not final_response:
                    final_response = "Task completed successfully. Please check your objectives for the results."
                    logger.warning("⚠️ Using default completion message as final response")
            
            logger.info("✅ Agent workflow completed successfully")
            logger.info(f"📝 Exchange {state.get('exchange_id')} completed")
            logger.info(f"🏁 FINAL RESPONSE TO RETURN: '{final_response[:200]}...' (length: {len(final_response)})")
             
            return {
                "final_response": final_response,
                "current_agent": "completed"
            }
        
        except Exception as e:
            logger.error(f"❌ Error in finalize node: {e}")
            return {
                "final_response": f"Workflow completed with error: {str(e)}",
                "current_agent": "error"
            }
    
    async def process_user_input(self, user_input: str, thread_id: Optional[str] = None) -> str:
        """
        Process user input through the agent workflow.
        
        Args:
            user_input: The user's message/request
            thread_id: Optional thread ID for conversation continuity
            
        Returns:
            Final response from the agent system
        """
        try:
            # Create or get thread ID
            if not thread_id:
                thread_id = await self.memory_system.create_new_thread()
            
            # Prepare initial state
            initial_state = {
                "messages": [HumanMessage(content=user_input)],
                "thread_id": thread_id
            }
            
            # Configure the run with thread ID
            config = RunnableConfig(
                configurable={"thread_id": thread_id},
                recursion_limit=500,  # High recursion limit for comprehensive work
                max_steps=500  # Allow many steps for complex objectives
            )
            
            logger.info(f"🎯 Processing user input: {user_input[:100]}...")
            
            # Run the workflow
            result = await self.graph.ainvoke(initial_state, config)
            
            # Extract final response
            final_response = result.get("final_response", "I've processed your request.")
            
            logger.info("✅ User input processed successfully")
            
            return final_response
        
        except Exception as e:
            logger.error(f"❌ Error processing user input: {e}")
            return f"I apologize, but I encountered an error while processing your request: {str(e)}"
    
    def get_graph(self):
        """
        Get the compiled LangGraph.
        
        Returns:
            Compiled StateGraph
        """
        return self.graph 