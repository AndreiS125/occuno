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

# Import conversation repository classes from SQLAlchemy
from repositories.sqlalchemy_conversation_repository import (
    ConversationHistory,
    ExchangeSummary,
    AgentMessage,
    StreamingEvent
)

logger = get_logger("memory_system")


class MemorySystem:
    """
    Manages conversation memory and exchange summaries for the agent system.
    Now uses SQLite for persistent storage instead of JSON files.
    """
    
    def __init__(self):
        self.checkpointer = MemorySaver()
        self.logger = logger
        self._conversation_repo = None  # Lazy initialization
        self.current_thread_id = None
        self.current_exchange_id = None
    
    @property
    def conversation_repo(self):
        """Lazy initialization of conversation repository to ensure correct environment variable usage"""
        if self._conversation_repo is None:
            from repositories.repository_factory import get_conversation_repository
            self._conversation_repo = get_conversation_repository()
        return self._conversation_repo
    

    
    async def get_conversation_history(self, thread_id: str) -> ConversationHistory:
        """Get conversation history for a thread."""
        return await self.conversation_repo.get_conversation_history(thread_id)
    
    async def save_conversation_history(self, history: ConversationHistory):
        """Save conversation history to database."""
        await self.conversation_repo.save_conversation_history(history)
    
    async def start_new_exchange(self, thread_id: str, user_message: str) -> str:
        """Start a new exchange and return the exchange ID."""
        history = await self.get_conversation_history(thread_id)
        exchange = history.add_exchange(user_message)
        await self.save_conversation_history(history)
        
        self.current_thread_id = thread_id
        self.current_exchange_id = exchange.id
        
        self.logger.info(f"Started new exchange {exchange.id} for thread {thread_id}")
        return exchange.id
    
    async def add_agent_message(self, thread_id: str, exchange_id: str, agent: str, content: str, 
                               message_type: str = "response", thinking_content: str = "", 
                               tool_calls: List[Dict] = None):
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
    
    async def add_streaming_event(self, thread_id: str, exchange_id: str, event_type: str, 
                                 agent: str, content: str, metadata: Dict = None):
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
            
            # Initialize empty history (this will create the thread in database)
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
            # Clear from SQLite database
            success = await self.conversation_repo.clear_thread_history(thread_id)
            
            if success:
                self.logger.info(f"Cleared thread {thread_id} from database")
            else:
                self.logger.warning(f"Failed to clear thread {thread_id} from database")
            
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
                # If checkpointer fails, still consider it successful since we cleared the database
                self.logger.warning(f"Failed to clear LangGraph state for thread {thread_id}: {checkpoint_error}")
                self.logger.info("Continuing since database was cleared successfully")
            
            self.logger.info(f"Successfully cleared conversation history for thread: {thread_id}")
            return success
        
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
    
    async def edit_message_and_truncate(self, thread_id: str, exchange_id: str, new_message: str) -> bool:
        """Edit a user message and truncate all conversation history after that exchange."""
        try:
            history = await self.get_conversation_history(thread_id)
            
            # Find the exchange to edit
            exchange_index = None
            for i, exchange in enumerate(history.exchanges):
                if exchange.id == exchange_id:
                    exchange_index = i
                    break
            
            if exchange_index is None:
                self.logger.error(f"Exchange {exchange_id} not found in thread {thread_id}")
                return False
            
            # Edit the message
            history.exchanges[exchange_index].user_message = new_message
            history.exchanges[exchange_index].timestamp = datetime.utcnow().isoformat()
            
            # Truncate all exchanges after this one
            history.exchanges = history.exchanges[:exchange_index + 1]
            
            # Clear the final response and completion status from the edited exchange
            history.exchanges[exchange_index].final_response = ""
            history.exchanges[exchange_index].is_complete = False
            history.exchanges[exchange_index].agent_messages = []
            history.exchanges[exchange_index].streaming_events = []
            
            # Update history metadata
            history.last_updated = datetime.utcnow().isoformat()
            
            await self.save_conversation_history(history)
            
            # Clear LangGraph state to prevent conflicts
            try:
                user_memories = await get_user_memories_for_prompt()
                reset_state = {
                    "messages": [],
                    "planning_analysis": "",
                    "user_memories": user_memories,
                    "thread_id": thread_id,
                    "exchange_id": None,
                    "user_input": "",
                    "conversation_history": "No previous conversation history.",
                    "iteration_count": 0,
                    "terminal_tool_executed": False,
                    "created_at": datetime.utcnow().isoformat(),
                    "last_updated": datetime.utcnow().isoformat(),
                    "edited_at": datetime.utcnow().isoformat()
                }
                
                config = RunnableConfig(
                    configurable={"thread_id": thread_id}
                )
                
                self.checkpointer.put(config, reset_state, {}, {})
                self.logger.info(f"Cleared LangGraph state after message edit for thread {thread_id}")
            except Exception as checkpoint_error:
                self.logger.warning(f"Failed to clear LangGraph state after edit for thread {thread_id}: {checkpoint_error}")
            
            self.logger.info(f"Successfully edited message and truncated history for exchange {exchange_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error editing message and truncating history: {e}")
            return False
    
    async def get_exchange_by_id(self, thread_id: str, exchange_id: str) -> Optional[ExchangeSummary]:
        """Get a specific exchange by ID."""
        try:
            history = await self.get_conversation_history(thread_id)
            
            for exchange in history.exchanges:
                if exchange.id == exchange_id:
                    return exchange
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting exchange {exchange_id} from thread {thread_id}: {e}")
            return None
    
    async def mark_exchange_incomplete(self, thread_id: str, exchange_id: str) -> bool:
        """Mark an exchange as incomplete (for re-running)."""
        try:
            history = await self.get_conversation_history(thread_id)
            
            for exchange in history.exchanges:
                if exchange.id == exchange_id:
                    exchange.is_complete = False
                    exchange.final_response = ""
                    exchange.timestamp = datetime.utcnow().isoformat()
                    
                    await self.save_conversation_history(history)
                    self.logger.info(f"Marked exchange {exchange_id} as incomplete")
                    return True
            
            self.logger.error(f"Exchange {exchange_id} not found in thread {thread_id}")
            return False
            
        except Exception as e:
            self.logger.error(f"Error marking exchange incomplete: {e}")
            return False

    async def clear_memory_cache(self, thread_id: str) -> bool:
        """Clear any cached data to force fresh reads from database."""
        try:
            logger.info(f"🧹 Clearing memory cache for thread {thread_id}")
            
            # Clear LangGraph state to force fresh reads
            config = RunnableConfig(
                configurable={"thread_id": thread_id}
            )
            
            # Reset state but preserve thread ID
            reset_state = {
                "messages": [],
                "planning_analysis": "",
                "user_memories": await get_user_memories_for_prompt(),
                "thread_id": thread_id,
                "exchange_id": self.current_exchange_id,
                "user_input": "",
                "conversation_history": "",
                "iteration_count": 0,
                "terminal_tool_executed": False,
                "created_at": datetime.utcnow().isoformat(),
                "last_updated": datetime.utcnow().isoformat(),
                "reset_at": datetime.utcnow().isoformat(),
                "checkpoint_ns": f"thread_{thread_id}_reset_{datetime.utcnow().timestamp()}"  # Force new namespace
            }
            
            # Use a new namespace to force fresh checkpoint
            self.checkpointer.put(config, reset_state, {}, {})
            logger.info(f"✅ Memory cache cleared for thread {thread_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error clearing memory cache: {e}")
            return False

    def get_checkpointer(self):
        """Get the LangGraph checkpointer."""
        # Return a fresh checkpointer instance on each call
        # This prevents state corruption between different runs
        return MemorySaver()
    
    async def get_threads_with_details(self) -> List[Dict[str, Any]]:
        """Get all conversation threads with detailed metadata."""
        return await self.conversation_repo.get_threads_with_details()
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get conversation statistics."""
        return await self.conversation_repo.get_stats() 

    async def get_user_memories_for_prompt(self) -> str:
        """Get user memories formatted for the prompt."""
        return await get_user_memories_for_prompt() 

    def get_checkpoint_namespace(self, thread_id: str) -> str:
        """Generate a unique namespace for checkpoints based on thread ID."""
        try:
            return f"thread_{thread_id}_{datetime.utcnow().timestamp()}"
        except Exception as e:
            logger.error(f"Error generating checkpoint namespace: {e}")
            return f"thread_fallback_{datetime.utcnow().timestamp()}" 