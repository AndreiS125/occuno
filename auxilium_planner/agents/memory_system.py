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


class ExchangeSummary:
    """Represents a single exchange in the conversation."""
    
    def __init__(self, user_message: str, planner_summary: str = "", executor_summary: str = ""):
        self.user_message = user_message
        self.planner_summary = planner_summary
        self.executor_summary = executor_summary
        self.timestamp = datetime.utcnow().isoformat()
        self.id = str(uuid.uuid4())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_message": self.user_message,
            "planner_summary": self.planner_summary,
            "executor_summary": self.executor_summary,
            "timestamp": self.timestamp
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
            if thread_id in data:
                del data[thread_id]
                self._save_memory_data(data)
            
            # Clear LangGraph state
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
            
            self.logger.info(f"Cleared conversation history for thread: {thread_id}")
            return True
        
        except Exception as e:
            self.logger.error(f"Error clearing thread history: {e}")
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