"""
Memory System for AI Agents

This module manages conversation state and exchange summaries for the agent system.
Stores user messages, planner summaries, and executor summaries for multi-turn dialogue.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import uuid
import os
from pathlib import Path

from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver
from core.config import settings
from core.logging_config import get_logger
from agents.tools.memory_tools import get_user_memories_for_prompt

logger = get_logger("memory_system")


class AgentMessage:
    """Represents a single agent message/response."""
    
    def __init__(self, agent: str, content: str, message_type: str = "response", thinking_content: str = "", tool_calls: List[Dict] = None, timestamp: str = None):
        self.agent = agent  # 'planning' or 'executor'
        self.content = content
        self.message_type = message_type  # 'response', 'thinking', 'tool_call', 'tool_result'
        self.thinking_content = thinking_content
        self.tool_calls = tool_calls or []
        self.timestamp = timestamp or datetime.utcnow().isoformat()
        self.id = str(uuid.uuid4())
        
        # Enhanced tool data for better frontend display
        self.tool_name = None
        self.tool_args = {}
        self.tool_result_parsed = {}
        self.tool_call_id = None
        
        # If this is a tool result, try to extract structured data
        if message_type == "tool_result" and tool_calls:
            for tool_call in tool_calls:
                if isinstance(tool_call, dict):
                    self.tool_name = tool_call.get('name')
                    self.tool_call_id = tool_call.get('call_id')
                    # Try to parse the content as JSON for structured data
                    try:
                        self.tool_result_parsed = json.loads(content) if content else {}
                    except (json.JSONDecodeError, TypeError):
                        self.tool_result_parsed = {"raw_content": content}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "agent": self.agent,
            "content": self.content,
            "message_type": self.message_type,
            "thinking_content": self.thinking_content,
            "tool_calls": self.tool_calls,
            "timestamp": self.timestamp,
            # Enhanced tool data
            "tool_name": self.tool_name,
            "tool_args": self.tool_args,
            "tool_result_parsed": self.tool_result_parsed,
            "tool_call_id": self.tool_call_id
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AgentMessage':
        msg = cls(
            agent=data["agent"],
            content=data["content"],
            message_type=data.get("message_type", "response"),
            thinking_content=data.get("thinking_content", ""),
            tool_calls=data.get("tool_calls", []),
            timestamp=data.get("timestamp")
        )
        msg.id = data.get("id", str(uuid.uuid4()))
        
        # Load enhanced tool data
        msg.tool_name = data.get("tool_name")
        msg.tool_args = data.get("tool_args", {})
        msg.tool_result_parsed = data.get("tool_result_parsed", {})
        msg.tool_call_id = data.get("tool_call_id")
        
        return msg


class StreamingEvent:
    """Represents a streaming event during agent execution."""
    
    def __init__(self, event_type: str, agent: str, content: str, metadata: Dict = None, timestamp: str = None):
        self.event_type = event_type  # 'thinking', 'tool_call', 'tool_result', 'agent_response'
        self.agent = agent
        self.content = content
        self.metadata = metadata or {}
        self.timestamp = timestamp or datetime.utcnow().isoformat()
        self.id = str(uuid.uuid4())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "event_type": self.event_type,
            "agent": self.agent,
            "content": self.content,
            "metadata": self.metadata,
            "timestamp": self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StreamingEvent':
        event = cls(
            event_type=data["event_type"],
            agent=data["agent"],
            content=data["content"],
            metadata=data.get("metadata", {}),
            timestamp=data.get("timestamp")
        )
        event.id = data.get("id", str(uuid.uuid4()))
        return event


class ExchangeSummary:
    """Represents a single exchange in the conversation."""
    
    def __init__(self, user_message: str, planner_summary: str = "", executor_summary: str = ""):
        self.user_message = user_message
        self.planner_summary = planner_summary
        self.executor_summary = executor_summary
        self.timestamp = datetime.utcnow().isoformat()
        self.id = str(uuid.uuid4())
        
        # New fields for detailed conversation tracking
        self.agent_messages: List[AgentMessage] = []
        self.streaming_events: List[StreamingEvent] = []
        self.final_response = ""
        self.execution_metadata = {}
        self.is_complete = False
    
    def add_agent_message(self, agent: str, content: str, message_type: str = "response", thinking_content: str = "", tool_calls: List[Dict] = None):
        """Add an agent message to this exchange."""
        message = AgentMessage(agent, content, message_type, thinking_content, tool_calls)
        self.agent_messages.append(message)
        return message
    
    def add_streaming_event(self, event_type: str, agent: str, content: str, metadata: Dict = None):
        """Add a streaming event to this exchange."""
        event = StreamingEvent(event_type, agent, content, metadata)
        self.streaming_events.append(event)
        return event
    
    def set_final_response(self, response: str):
        """Set the final response for this exchange."""
        self.final_response = response
        self.is_complete = True
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_message": self.user_message,
            "planner_summary": self.planner_summary,
            "executor_summary": self.executor_summary,
            "timestamp": self.timestamp,
            "agent_messages": [msg.to_dict() for msg in self.agent_messages],
            "streaming_events": [event.to_dict() for event in self.streaming_events],
            "final_response": self.final_response,
            "execution_metadata": self.execution_metadata,
            "is_complete": self.is_complete
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ExchangeSummary':
        exchange = cls(
            user_message=data["user_message"],
            planner_summary=data.get("planner_summary", ""),
            executor_summary=data.get("executor_summary", "")
        )
        exchange.id = data.get("id", str(uuid.uuid4()))
        exchange.timestamp = data.get("timestamp", datetime.utcnow().isoformat())
        exchange.final_response = data.get("final_response", "")
        exchange.execution_metadata = data.get("execution_metadata", {})
        exchange.is_complete = data.get("is_complete", False)
        
        # Load agent messages
        exchange.agent_messages = [
            AgentMessage.from_dict(msg_data) 
            for msg_data in data.get("agent_messages", [])
        ]
        
        # Load streaming events
        exchange.streaming_events = [
            StreamingEvent.from_dict(event_data) 
            for event_data in data.get("streaming_events", [])
        ]
        
        return exchange


class ConversationHistory:
    """Manages the conversation history for a thread."""
    
    def __init__(self, thread_id: str):
        self.thread_id = thread_id
        self.exchanges: List[ExchangeSummary] = []
        self.created_at = datetime.utcnow().isoformat()
        self.last_updated = datetime.utcnow().isoformat()
    
    def add_exchange(self, user_message: str) -> ExchangeSummary:
        """Add a new exchange to the conversation."""
        exchange = ExchangeSummary(user_message)
        self.exchanges.append(exchange)
        self.last_updated = datetime.utcnow().isoformat()
        return exchange
    
    def update_planner_summary(self, exchange_id: str, planner_summary: str):
        """Update the planner summary for a specific exchange."""
        for exchange in self.exchanges:
            if exchange.id == exchange_id:
                exchange.planner_summary = planner_summary
                self.last_updated = datetime.utcnow().isoformat()
                break
    
    def update_executor_summary(self, exchange_id: str, executor_summary: str):
        """Update the executor summary for a specific exchange."""
        for exchange in self.exchanges:
            if exchange.id == exchange_id:
                exchange.executor_summary = executor_summary
                self.last_updated = datetime.utcnow().isoformat()
                break
    
    def get_last_10_exchanges(self) -> List[ExchangeSummary]:
        """Get the last 10 exchanges for context."""
        return self.exchanges[-10:] if len(self.exchanges) > 10 else self.exchanges
    
    def get_formatted_history_for_planner(self) -> str:
        """Format the last 10 exchanges for the planning agent."""
        recent_exchanges = self.get_last_10_exchanges()
        if not recent_exchanges:
            return "No previous conversation history."
        
        formatted_history = []
        for exchange in recent_exchanges:
            formatted_history.append(f"User: {exchange.user_message}")
            if exchange.planner_summary:
                formatted_history.append(f"Planner: {exchange.planner_summary}")
            if exchange.executor_summary:
                formatted_history.append(f"Executor: {exchange.executor_summary}")
            formatted_history.append("---")
        
        return "\n".join(formatted_history)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "thread_id": self.thread_id,
            "exchanges": [exchange.to_dict() for exchange in self.exchanges],
            "created_at": self.created_at,
            "last_updated": self.last_updated
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConversationHistory':
        history = cls(data["thread_id"])
        history.exchanges = [ExchangeSummary.from_dict(ex) for ex in data.get("exchanges", [])]
        history.created_at = data.get("created_at", datetime.utcnow().isoformat())
        history.last_updated = data.get("last_updated", datetime.utcnow().isoformat())
        return history


class MemorySystem:
    """
    Manages conversation memory and exchange summaries for the agent system.
    Stores user messages, planner summaries, and executor summaries for multi-turn dialogue.
    """
    
    def __init__(self):
        self.checkpointer = MemorySaver()
        self.logger = logger
        self.memory_file = Path(settings.data_file_path).parent / "conversation_history.json"
        self.current_thread_id = None
        self.current_exchange_id = None
        
        # Ensure memory file exists
        self.memory_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.memory_file.exists():
            self._save_memory_data({})
    
    def _load_memory_data(self) -> Dict[str, Any]:
        """Load memory data from file."""
        try:
            with open(self.memory_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _save_memory_data(self, data: Dict[str, Any]):
        """Save memory data to file."""
        try:
            with open(self.memory_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving memory data: {e}")
    
    async def get_conversation_history(self, thread_id: str) -> ConversationHistory:
        """Get conversation history for a thread."""
        try:
            data = self._load_memory_data()
            if thread_id in data:
                return ConversationHistory.from_dict(data[thread_id])
            else:
                return ConversationHistory(thread_id)
        except Exception as e:
            self.logger.error(f"Error getting conversation history: {e}")
            return ConversationHistory(thread_id)
    
    async def save_conversation_history(self, history: ConversationHistory):
        """Save conversation history to file."""
        try:
            data = self._load_memory_data()
            data[history.thread_id] = history.to_dict()
            self._save_memory_data(data)
            self.logger.info(f"Saved conversation history for thread {history.thread_id}")
        except Exception as e:
            self.logger.error(f"Error saving conversation history: {e}")
    
    async def start_new_exchange(self, thread_id: str, user_message: str) -> str:
        """Start a new exchange and return the exchange ID."""
        history = await self.get_conversation_history(thread_id)
        exchange = history.add_exchange(user_message)
        await self.save_conversation_history(history)
        
        self.current_thread_id = thread_id
        self.current_exchange_id = exchange.id
        
        self.logger.info(f"Started new exchange {exchange.id} for thread {thread_id}")
        return exchange.id
    
    async def add_agent_message(self, thread_id: str, exchange_id: str, agent: str, content: str, message_type: str = "response", thinking_content: str = "", tool_calls: List[Dict] = None):
        """Add an agent message to an exchange."""
        history = await self.get_conversation_history(thread_id)
        for exchange in history.exchanges:
            if exchange.id == exchange_id:
                message = exchange.add_agent_message(agent, content, message_type, thinking_content, tool_calls)
                await self.save_conversation_history(history)
                self.logger.info(f"Added {agent} agent message to exchange {exchange_id}")
                return message
        
        self.logger.error(f"Exchange {exchange_id} not found in thread {thread_id}")
        return None
    
    async def add_streaming_event(self, thread_id: str, exchange_id: str, event_type: str, agent: str, content: str, metadata: Dict = None):
        """Add a streaming event to an exchange."""
        history = await self.get_conversation_history(thread_id)
        for exchange in history.exchanges:
            if exchange.id == exchange_id:
                event = exchange.add_streaming_event(event_type, agent, content, metadata)
                await self.save_conversation_history(history)
                self.logger.debug(f"Added streaming event {event_type} to exchange {exchange_id}")
                return event
        
        self.logger.error(f"Exchange {exchange_id} not found in thread {thread_id}")
        return None
    
    async def set_final_response(self, thread_id: str, exchange_id: str, response: str):
        """Set the final response for an exchange."""
        history = await self.get_conversation_history(thread_id)
        for exchange in history.exchanges:
            if exchange.id == exchange_id:
                exchange.set_final_response(response)
                await self.save_conversation_history(history)
                self.logger.info(f"Set final response for exchange {exchange_id}")
                return
        
        self.logger.error(f"Exchange {exchange_id} not found in thread {thread_id}")
    
    async def update_planner_summary(self, thread_id: str, exchange_id: str, planner_summary: str):
        """Update the planner summary for an exchange."""
        history = await self.get_conversation_history(thread_id)
        history.update_planner_summary(exchange_id, planner_summary)
        await self.save_conversation_history(history)
        self.logger.info(f"Updated planner summary for exchange {exchange_id}")
    
    async def update_executor_summary(self, thread_id: str, exchange_id: str, executor_summary: str):
        """Update the executor summary for an exchange."""
        history = await self.get_conversation_history(thread_id)
        history.update_executor_summary(exchange_id, executor_summary)
        await self.save_conversation_history(history)
        self.logger.info(f"Updated executor summary for exchange {exchange_id}")
    
    async def get_current_exchange(self, thread_id: str) -> Optional[ExchangeSummary]:
        """Get the current (last) exchange for a thread."""
        history = await self.get_conversation_history(thread_id)
        if history.exchanges:
            return history.exchanges[-1]
        return None
    
    async def get_context_for_planner(self, thread_id: str) -> str:
        """Get formatted context for the planning agent (includes history)."""
        history = await self.get_conversation_history(thread_id)
        return history.get_formatted_history_for_planner()
    
    async def get_conversation_state(self, thread_id: str) -> Dict[str, Any]:
        """Get the current conversation state for LangGraph compatibility."""
        try:
            config = RunnableConfig(
                configurable={"thread_id": thread_id}
            )
            
            # Get checkpoint from memory
            checkpoint = self.checkpointer.get(config)
            
            if checkpoint and checkpoint.channel_values:
                return checkpoint.channel_values
            
            # Return empty state if no checkpoint exists
            return {
                "messages": [],
                "planning_analysis": "",
                "user_memories": await get_user_memories_for_prompt(),
                "thread_id": thread_id,
                "exchange_id": self.current_exchange_id,
                "created_at": datetime.utcnow().isoformat(),
                "last_updated": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            self.logger.error(f"Error getting conversation state: {e}")
            return {
                "messages": [],
                "planning_analysis": "",
                "user_memories": "",
                "thread_id": thread_id,
                "exchange_id": None,
                "error": str(e)
            }
    
    async def update_conversation_state(self, thread_id: str, updates: Dict[str, Any]) -> bool:
        """Update the conversation state for LangGraph compatibility."""
        try:
            config = RunnableConfig(
                configurable={"thread_id": thread_id}
            )
            
            # Get current state
            current_state = await self.get_conversation_state(thread_id)
            
            # Apply updates
            current_state.update(updates)
            current_state["last_updated"] = datetime.utcnow().isoformat()
            
            # Save updated state
            self.checkpointer.put(config, current_state, {}, {})
            
            self.logger.debug(f"Updated conversation state for thread {thread_id}")
            return True
        
        except Exception as e:
            self.logger.error(f"Error updating conversation state: {e}")
            return False
    
    async def get_user_context(self) -> Dict[str, Any]:
        """Get comprehensive user context including memories."""
        try:
            # Get user memories
            user_memories = await get_user_memories_for_prompt()
            
            # Get current date/time for context
            current_time = datetime.utcnow()
            
            context = {
                "current_date": current_time.isoformat(),
                "formatted_date": current_time.strftime("%A, %B %d, %Y at %H:%M UTC"),
                "user_memories": user_memories,
                "system_info": {
                    "max_iterations": settings.max_agent_iterations,
                    "max_research_loops": settings.max_research_loops,
                    "gemini_model": settings.gemini_model,
                    "thinking_model": settings.gemini_thinking_model
                }
            }
            
            return context
        
        except Exception as e:
            self.logger.error(f"Error getting user context: {e}")
            return {
                "current_date": datetime.utcnow().isoformat(),
                "formatted_date": datetime.utcnow().strftime("%A, %B %d, %Y at %H:%M UTC"),
                "user_memories": "Error retrieving user memories",
                "error": str(e)
            }
    
    async def create_new_thread(self) -> str:
        """Create a new conversation thread."""
        try:
            thread_id = str(uuid.uuid4())
            
            # Initialize empty history
            history = ConversationHistory(thread_id)
            await self.save_conversation_history(history)
            
            # Initialize empty state for LangGraph
            try:
                initial_state = {
                    "messages": [],
                    "planning_analysis": "",
                    "user_memories": await get_user_memories_for_prompt(),
                    "thread_id": thread_id,
                    "exchange_id": None,
                    "created_at": datetime.utcnow().isoformat(),
                    "last_updated": datetime.utcnow().isoformat()
                }
                
                config = RunnableConfig(
                    configurable={"thread_id": thread_id}
                )
                
                # LangGraph checkpointer API - use empty metadata and versions
                self.checkpointer.put(config, initial_state, {}, {})
                self.logger.info(f"Initialized LangGraph state for thread {thread_id}")
            except Exception as checkpoint_error:
                # If checkpointer fails, still return the thread_id since we saved the history
                self.logger.warning(f"Failed to initialize LangGraph state for thread {thread_id}: {checkpoint_error}")
                self.logger.info("Continuing since conversation history was saved successfully")
            
            self.logger.info(f"Created new conversation thread: {thread_id}")
            return thread_id
        
        except Exception as e:
            self.logger.error(f"Error creating new thread: {e}")
            return str(uuid.uuid4())  # Fallback to basic UUID
    
    async def clear_thread_history(self, thread_id: str) -> bool:
        """Clear the conversation history for a thread."""
        try:
            # Remove from memory file
            data = self._load_memory_data()
            thread_existed = thread_id in data
            
            if thread_existed:
                del data[thread_id]
                self._save_memory_data(data)
                self.logger.info(f"Removed thread {thread_id} from memory file")
            else:
                self.logger.info(f"Thread {thread_id} not found in memory file (already deleted or never existed)")
            
            # Clear LangGraph state (always do this to ensure clean state)
            try:
                user_memories = await get_user_memories_for_prompt()
                reset_state = {
                    "messages": [],
                    "planning_analysis": "",
                    "user_memories": user_memories,
                    "thread_id": thread_id,
                    "exchange_id": None,
                    "created_at": datetime.utcnow().isoformat(),
                    "last_updated": datetime.utcnow().isoformat(),
                    "cleared_at": datetime.utcnow().isoformat()
                }
                
                config = RunnableConfig(
                    configurable={"thread_id": thread_id}
                )
                
                self.checkpointer.put(config, reset_state, {}, {})
                self.logger.info(f"Cleared LangGraph state for thread {thread_id}")
            except Exception as checkpoint_error:
                # If checkpointer fails, still consider it successful since we cleared the memory file
                self.logger.warning(f"Failed to clear LangGraph state for thread {thread_id}: {checkpoint_error}")
                self.logger.info("Continuing since memory file was cleared successfully")
            
            self.logger.info(f"Successfully cleared conversation history for thread: {thread_id}")
            return True
        
        except Exception as e:
            self.logger.error(f"Error clearing thread history for {thread_id}: {e}")
            return False
    
    async def get_conversation_summary(self, thread_id: str) -> str:
        """Get a summary of the conversation for a thread."""
        try:
            history = await self.get_conversation_history(thread_id)
            
            if not history.exchanges:
                return "No conversation history available."
            
            summary = f"Conversation Thread: {thread_id}\n"
            summary += f"Exchanges: {len(history.exchanges)}\n"
            summary += f"Last Updated: {history.last_updated}\n"
            
            # Show recent exchanges
            recent = history.get_last_10_exchanges()
            if recent:
                summary += f"\nRecent exchanges:\n"
                for exchange in recent[-3:]:  # Show last 3
                    summary += f"  User: {exchange.user_message[:50]}...\n"
            
            return summary
        
        except Exception as e:
            self.logger.error(f"Error getting conversation summary: {e}")
            return f"Error retrieving summary for thread {thread_id}: {str(e)}"
    
    def get_checkpointer(self):
        """Get the LangGraph checkpointer."""
        return self.checkpointer 