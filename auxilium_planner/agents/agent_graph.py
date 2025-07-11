"""
Agent Graph for Auxilium AI System

This module implements the LangGraph workflow that orchestrates the Planning and Executor agents.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import re

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, MessagesState, START, END

from core.config import settings
from core.logging_config import get_logger
from core.quota_manager import initialize_quota_manager
from core.quota_aware_llm import create_quota_aware_chat_model
from agents.prompts import PLANNING_AGENT_PROMPT, EXECUTOR_AGENT_PROMPT
from agents.tools import ALL_PLANNING_TOOLS, ALL_EXECUTOR_TOOLS
from agents.memory_system import MemorySystem

logger = get_logger("agent_graph")


class AgentState(MessagesState):
    """State for the agent workflow."""
    planning_analysis: str = ""
    user_input: str = ""
    current_agent: str = ""
    iteration_count: int = 0
    user_memories: str = ""
    thread_id: str = ""
    exchange_id: str = ""
    final_response: str = ""
    conversation_history: str = ""
    planning_conversation: List = []
    executor_conversation: List = []
    terminal_tool_executed: bool = False


class AgentGraph:
    """Main agent graph that orchestrates the Planning and Executor agents."""
    
    def __init__(self):
        self.memory_system = MemorySystem()
        
        # Initialize quota manager BEFORE models
        if settings.quota_manager_enabled:
            initialize_quota_manager(settings.get_all_api_keys())
        
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize the LLM models and build the graph."""
        model_config = {
            "model": "gemini-2.5-flash",
            "temperature": settings.llm_temperature,
            "max_output_tokens": settings.llm_max_output_tokens,
            "top_p": settings.llm_top_p,
            "top_k": settings.llm_top_k,
            "max_retries": settings.retry_attempts,
            "include_thoughts": True,
            "thinking_budget": 2000,
            "timeout": settings.request_timeout
        }
        
        if settings.quota_manager_enabled:
            self.planning_llm = create_quota_aware_chat_model(**model_config)
            self.executor_llm = create_quota_aware_chat_model(**{**model_config, "temperature": model_config["temperature"] + 0.1, "thinking_budget": 400})
        else:
            base_config = {**model_config, "api_key": settings.google_api_key}
            self.planning_llm = ChatGoogleGenerativeAI(**base_config)
            self.executor_llm = ChatGoogleGenerativeAI(**{**base_config, "temperature": base_config["temperature"] + 0.1, "thinking_budget": 400})
        
        self.planning_agent = self.planning_llm.bind_tools(ALL_PLANNING_TOOLS)
        self.executor_agent = self.executor_llm.bind_tools(ALL_EXECUTOR_TOOLS)
        self.graph = self._build_graph()
    
    def _create_tool_node(self, tools: List):
        """Create a tool execution node."""
        tool_map = {tool.name: tool for tool in tools}
        
        async def execute_tools(state: AgentState) -> Dict[str, Any]:
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
                        
                        # Handle terminal tools
                        if tool_name == 'final_response':
                            updates["terminal_tool_executed"] = True
                            try:
                                result_data = json.loads(str(result))
                                updates["planning_analysis"] = result_data.get('analysis_content', '')
                                if result_data.get('summary_content') and state.get("thread_id") and state.get("exchange_id"):
                                    await self.memory_system.update_planner_summary(
                                        state["thread_id"], state["exchange_id"], result_data['summary_content']
                                    )
                            except:
                                pass
                        
                        elif tool_name == 'final_response_to_user':
                            updates["terminal_tool_executed"] = True
                            try:
                                result_data = json.loads(str(result))
                                updates["final_response"] = result_data.get('response_content', '')
                                summary = result_data.get('action_summary', '') or "Task completed successfully."
                                if state.get("thread_id") and state.get("exchange_id"):
                                    await self.memory_system.update_executor_summary(
                                        state["thread_id"], state["exchange_id"], summary
                                    )
                            except:
                                pass
                        
                        tool_messages.append(ToolMessage(content=str(result), name=tool_name, tool_call_id=tool_id))
                    else:
                        tool_messages.append(ToolMessage(content=f"Tool {tool_name} not found", name=tool_name, tool_call_id=tool_id))
                except Exception as e:
                    tool_messages.append(ToolMessage(content=f"Error: {str(e)}", name=tool_name, tool_call_id=tool_id))
            
            # Update conversation history
            current_agent = state.get("current_agent", "")
            if current_agent == "planning":
                planning_conv = state.get("planning_conversation", [])
                planning_conv.extend(tool_messages)
                updates["planning_conversation"] = planning_conv
            elif current_agent == "executor":
                executor_conv = state.get("executor_conversation", [])
                executor_conv.extend(tool_messages)
                updates["executor_conversation"] = executor_conv
            
            return {"messages": tool_messages, **updates}
        
        return execute_tools
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        workflow = StateGraph(AgentState)
        
        workflow.add_node("initialize", self._initialize_node)
        workflow.add_node("planning_agent", self._planning_agent_node)
        workflow.add_node("planning_tools", self._create_tool_node(ALL_PLANNING_TOOLS))
        workflow.add_node("executor_agent", self._executor_agent_node)
        workflow.add_node("executor_tools", self._create_tool_node(ALL_EXECUTOR_TOOLS))
        workflow.add_node("finalize", self._finalize_node)
        
        workflow.add_edge(START, "initialize")
        workflow.add_edge("initialize", "planning_agent")
        
        workflow.add_conditional_edges(
            "planning_agent",
            lambda state: "tools" if self._has_tool_calls(state) else "executor",
            {"tools": "planning_tools", "executor": "executor_agent"}
        )
        
        workflow.add_conditional_edges(
            "planning_tools",
            lambda state: "executor" if state.get("terminal_tool_executed") else "planning_agent",
            {"executor": "executor_agent", "planning_agent": "planning_agent"}
        )
        
        workflow.add_conditional_edges(
            "executor_agent",
            self._should_executor_continue,
            {"tools": "executor_tools", "continue": "executor_agent", "finalize": "finalize"}
        )
        
        workflow.add_conditional_edges(
            "executor_tools",
            lambda state: "finalize" if state.get("terminal_tool_executed") else "executor_agent",
            {"finalize": "finalize", "executor_agent": "executor_agent"}
        )
        
        workflow.add_edge("finalize", END)
        
        return workflow.compile(checkpointer=self.memory_system.get_checkpointer())
    
    def _has_tool_calls(self, state: AgentState) -> bool:
        """Check if the last message has tool calls."""
        messages = state.get("messages", [])
        if not messages:
            return False
        
        last_message = messages[-1]
        return hasattr(last_message, 'tool_calls') and bool(last_message.tool_calls)
    
    def _should_executor_continue(self, state: AgentState) -> str:
        """Determine executor flow: tools, continue, or finalize."""                
        # If executor has tool calls, execute them
        if self._has_tool_calls(state):
            return "tools"
        
        # Check if we've executed a terminal tool (final_response_to_user)
        if state.get("terminal_tool_executed"):
            return "finalize"
        
        # Check if executor has called final_response_to_user in its messages
        messages = state.get("messages", [])
        for msg in messages:
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                for tc in msg.tool_calls:
                    if tc.get('name') == 'final_response_to_user':
                        return "finalize"
        
        # Check executor conversation for terminal tools
        executor_conv = state.get("executor_conversation", [])
        for msg in executor_conv:
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                for tc in msg.tool_calls:
                    if tc.get('name') == 'final_response_to_user':
                        return "finalize"
            # Also check tool messages for final_response_to_user
            if hasattr(msg, 'name') and msg.name == 'final_response_to_user':
                return "finalize"
        
        # Check iteration count as safety net
        iteration_count = state.get("iteration_count", 0)
        if iteration_count >= 100:  # Safety limit
            logger.warning(f"Executor reached iteration limit ({iteration_count}), forcing finalize")
            return "finalize"
        
        # If no terminal tool called yet, call executor again to continue
        return "continue"
    
    async def _initialize_node(self, state: AgentState) -> Dict[str, Any]:
        """Initialize the agent workflow."""
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
                "current_agent": "planning",
                "iteration_count": 0,
                "thread_id": thread_id,
                "exchange_id": exchange_id,
                "conversation_history": conversation_history,
                "planning_conversation": [],
                "executor_conversation": [],
                "planning_analysis": "",
                "final_response": "",
                "terminal_tool_executed": False
            }
        
        except Exception as e:
            logger.error(f"Error in initialize node: {e}")
            return {
                "user_input": "Error initializing workflow",
                "current_agent": "planning",
                "iteration_count": 0,
                "planning_conversation": [],
                "executor_conversation": [],
                "terminal_tool_executed": False
            }
    
    async def _planning_agent_node(self, state: AgentState) -> Dict[str, Any]:
        """Execute the Planning Agent."""
        try:
            user_context = await self.memory_system.get_user_context()
            
            prompt = PLANNING_AGENT_PROMPT.format(
                current_date=user_context["formatted_date"],
                user_memories=state["user_memories"]
            )
            
            messages = [SystemMessage(content=prompt)]
            planning_conv = state.get("planning_conversation", [])
            
            if not planning_conv:
                user_message_content = state["user_input"]
                conversation_context = state.get("conversation_history", "")
                
                if conversation_context and conversation_context != "No previous conversation history.":
                    user_message_content += f"\n\nPrevious conversation history:\n{conversation_context}"
                
                messages.append(HumanMessage(content=user_message_content))
            else:
                messages.append(HumanMessage(content=f"Continue analyzing: {state['user_input']}"))
                messages.extend(planning_conv)
            
            response = await self.planning_agent.ainvoke(messages)
            final_response = self._process_agent_response(response)
            
            planning_conv.append(final_response)
            
            return {
                "messages": [final_response],
                "planning_conversation": planning_conv,
                "current_agent": "planning",
                "iteration_count": state.get("iteration_count", 0) + 1
            }
        
        except Exception as e:
            logger.error(f"Error in planning agent: {e}")
            return {
                "messages": [AIMessage(content=f"Planning Agent error: {str(e)}")],
                "current_agent": "planning"
            }
    
    async def _executor_agent_node(self, state: AgentState) -> Dict[str, Any]:
        """Execute the Executor Agent."""
        try:
            user_context = await self.memory_system.get_user_context()
            planning_analysis = state.get("planning_analysis", "No planning analysis available")
            
            prompt = EXECUTOR_AGENT_PROMPT.format(
                current_date=user_context["formatted_date"],
                user_memories=state["user_memories"]
            )
            
            messages = [SystemMessage(content=prompt)]
            executor_conv = state.get("executor_conversation", [])
            
            if not executor_conv:
                user_message_content = f"Execute the task that the user requested. Follow the planning analysis from the Planning Agent. \n\n Original user request: {state['user_input']}\n\nPlanning analysis from the Planning Agent:\n{planning_analysis}"
                messages.append(HumanMessage(content=user_message_content))
            else:
                messages.append(HumanMessage(content=f"Continue execution for: {state['user_input']}"))
                messages.extend(executor_conv)
            
            # Check if this is the first executor iteration
            is_first_iteration = len(executor_conv) == 0
            
            response = await self.executor_agent.ainvoke(messages)
            final_response = self._process_agent_response(response)
            
            executor_conv.append(final_response)
            
            updates = {
                "messages": [final_response],
                "executor_conversation": executor_conv,
                "current_agent": "executor",
                "iteration_count": state.get("iteration_count", 0) + 1
            }
            
            # Clear terminal flag when starting executor (first iteration only)
            if is_first_iteration:
                updates["terminal_tool_executed"] = False
                
            return updates
        
        except Exception as e:
            logger.error(f"Error in executor agent: {e}")
            return {
                "messages": [AIMessage(content=f"Executor Agent error: {str(e)}")],
                "current_agent": "executor"
            }
    
    def _process_agent_response(self, response):
        """Process agent response to handle thinking content."""
        if isinstance(response.content, list):
            thoughts = [
                part["thinking"] for part in response.content
                if isinstance(part, dict) and part.get("type") == "thinking" and part.get("thinking")
            ]
            
            if thoughts:
                agent_type = "Planning" if "planning" in str(type(response)).lower() else "Executor"
                print(f"—–– {agent_type} Agent THOUGHTS —––––")
                for thought in thoughts[:1000]:
                    print(thought)
            
            text_content = []
            for part in response.content:
                if isinstance(part, dict) and part.get("type") == "text":
                    text_content.append(part.get("text", ""))
                elif isinstance(part, str):
                    text_content.append(part)
            
            # Preserve all important metadata from the original response
            return AIMessage(
                content=" ".join(text_content) if text_content else "",
                tool_calls=response.tool_calls if hasattr(response, 'tool_calls') else None,
                usage_metadata=getattr(response, 'usage_metadata', None),
                response_metadata=getattr(response, 'response_metadata', {}),
                id=getattr(response, 'id', None)
            )
        else:
            return response
    
    async def _finalize_node(self, state: AgentState) -> Dict[str, Any]:
        """Finalize the agent workflow."""
        try:
            final_response = state.get("final_response", "")
            
            if not final_response:
                executor_conv = state.get("executor_conversation", [])
                for msg in reversed(executor_conv):
                    if hasattr(msg, 'content'):
                        content = msg.content
                        if "final_response_to_user" in content and "response_content" in content:
                            try:
                                json_match = re.search(r'\{.*"response_content".*\}', content, re.DOTALL)
                                if json_match:
                                    response_data = json.loads(json_match.group())
                                    final_response = response_data.get("response_content", "")
                                    break
                            except:
                                pass
                
                if not final_response:
                    final_response = "Task completed successfully. Please check your objectives for the results."
             
            return {
                "final_response": final_response,
                "current_agent": "completed"
            }
        
        except Exception as e:
            logger.error(f"Error in finalize node: {e}")
            return {
                "final_response": f"Workflow completed with error: {str(e)}",
                "current_agent": "error"
            }
    
    async def process_user_input(self, user_input: str, thread_id: Optional[str] = None) -> str:
        """Process user input through the agent workflow."""
        try:
            if not thread_id:
                thread_id = await self.memory_system.create_new_thread()
            
            initial_state = {
                "messages": [HumanMessage(content=user_input)],
                "thread_id": thread_id
            }
            
            config = RunnableConfig(
                configurable={"thread_id": thread_id},
                recursion_limit=500,
                max_steps=500
            )
            
            result = await self.graph.ainvoke(initial_state, config)
            return result.get("final_response", "I've processed your request.")
        
        except Exception as e:
            logger.error(f"Error processing user input: {e}")
            return f"I apologize, but I encountered an error while processing your request: {str(e)}"
    
    def get_graph(self):
        """Get the compiled LangGraph."""
        return self.graph 