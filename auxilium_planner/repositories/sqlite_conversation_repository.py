"""
SQLite-based conversation repository

This module provides SQLite-based storage for conversation history,
replacing the JSON file-based storage in MemorySystem.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import uuid
import logging

from core.database import db_manager, json_serialize, json_deserialize
from core.logging_config import get_logger

logger = get_logger("sqlite_conversation_repository")


class AgentMessage:
    """Represents a single agent message/response."""
    
    def __init__(self, agent: str, content: str, message_type: str = "response", 
                 thinking_content: str = "", tool_calls: List[Dict] = None, 
                 timestamp: str = None):
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
        msg.tool_name = data.get("tool_name")
        msg.tool_args = data.get("tool_args", {})
        msg.tool_result_parsed = data.get("tool_result_parsed", {})
        msg.tool_call_id = data.get("tool_call_id")
        return msg


class StreamingEvent:
    """Represents a streaming event during conversation."""
    
    def __init__(self, event_type: str, agent: str, content: str, metadata: Dict = None):
        self.event_type = event_type
        self.agent = agent
        self.content = content
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow().isoformat()
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
            metadata=data.get("metadata", {})
        )
        event.id = data.get("id", str(uuid.uuid4()))
        event.timestamp = data.get("timestamp", datetime.utcnow().isoformat())
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
    
    def add_agent_message(self, agent: str, content: str, message_type: str = "response", 
                         thinking_content: str = "", tool_calls: List[Dict] = None):
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
            # Only include exchanges that have been completed
            if exchange.is_complete and exchange.user_message and exchange.user_message.strip():
                formatted_history.append(f"User: {exchange.user_message}")
                if exchange.planner_summary and exchange.planner_summary.strip():
                    formatted_history.append(f"Planner: {exchange.planner_summary}")
                if exchange.executor_summary and exchange.executor_summary.strip():
                    formatted_history.append(f"Executor: {exchange.executor_summary}")
                formatted_history.append("---")
        
        return "\n".join(formatted_history) if formatted_history else "No previous conversation history."
    
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


class SQLiteConversationRepository:
    """SQLite-based conversation repository for managing conversation history."""
    
    def __init__(self):
        self.logger = logger
    
    async def get_conversation_history(self, thread_id: str) -> ConversationHistory:
        """Get conversation history for a thread."""
        try:
            async with db_manager.get_connection() as conn:
                # Get thread info
                thread_cursor = await conn.execute(
                    "SELECT * FROM conversation_threads WHERE thread_id = ?",
                    (thread_id,)
                )
                thread_row = await thread_cursor.fetchone()
                
                if not thread_row:
                    # Create new thread
                    await conn.execute(
                        "INSERT INTO conversation_threads (thread_id) VALUES (?)",
                        (thread_id,)
                    )
                    await conn.commit()
                    return ConversationHistory(thread_id)
                
                # Get exchanges for this thread
                exchanges_cursor = await conn.execute(
                    """SELECT id, user_message, planner_summary, executor_summary, 
                              timestamp, final_response, execution_metadata, is_complete
                       FROM conversation_exchanges 
                       WHERE thread_id = ?
                       ORDER BY timestamp ASC""",
                    (thread_id,)
                )
                exchange_rows = await exchanges_cursor.fetchall()
                
                history = ConversationHistory(thread_id)
                history.created_at = thread_row['created_at']
                history.last_updated = thread_row['last_updated']
                
                for exchange_row in exchange_rows:
                    exchange = ExchangeSummary(
                        user_message=exchange_row['user_message'],
                        planner_summary=exchange_row['planner_summary'] or "",
                        executor_summary=exchange_row['executor_summary'] or ""
                    )
                    exchange.id = exchange_row['id']
                    exchange.timestamp = exchange_row['timestamp']
                    exchange.final_response = exchange_row['final_response'] or ""
                    exchange.execution_metadata = json_deserialize(exchange_row['execution_metadata']) or {}
                    exchange.is_complete = bool(exchange_row['is_complete'])
                    
                    # Load agent messages for this exchange
                    messages_cursor = await conn.execute(
                        """SELECT id, agent, content, message_type, thinking_content, 
                                  tool_calls, timestamp, tool_name, tool_args, 
                                  tool_result_parsed, tool_call_id
                           FROM exchange_agent_messages 
                           WHERE exchange_id = ?
                           ORDER BY timestamp ASC""",
                        (exchange.id,)
                    )
                    message_rows = await messages_cursor.fetchall()
                    
                    for msg_row in message_rows:
                        message = AgentMessage(
                            agent=msg_row['agent'],
                            content=msg_row['content'],
                            message_type=msg_row['message_type'],
                            thinking_content=msg_row['thinking_content'] or "",
                            tool_calls=json_deserialize(msg_row['tool_calls']) or [],
                            timestamp=msg_row['timestamp']
                        )
                        message.id = msg_row['id']
                        message.tool_name = msg_row['tool_name']
                        message.tool_args = json_deserialize(msg_row['tool_args']) or {}
                        message.tool_result_parsed = json_deserialize(msg_row['tool_result_parsed']) or {}
                        message.tool_call_id = msg_row['tool_call_id']
                        exchange.agent_messages.append(message)
                    
                    # Load streaming events for this exchange
                    events_cursor = await conn.execute(
                        """SELECT id, event_type, agent, content, metadata, timestamp
                           FROM exchange_streaming_events 
                           WHERE exchange_id = ?
                           ORDER BY timestamp ASC""",
                        (exchange.id,)
                    )
                    event_rows = await events_cursor.fetchall()
                    
                    for event_row in event_rows:
                        event = StreamingEvent(
                            event_type=event_row['event_type'],
                            agent=event_row['agent'],
                            content=event_row['content'],
                            metadata=json_deserialize(event_row['metadata']) or {}
                        )
                        event.id = event_row['id']
                        event.timestamp = event_row['timestamp']
                        exchange.streaming_events.append(event)
                    
                    history.exchanges.append(exchange)
                
                return history
        
        except Exception as e:
            self.logger.error(f"Error getting conversation history: {e}")
            return ConversationHistory(thread_id)
    
    async def save_conversation_history(self, history: ConversationHistory):
        """Save conversation history to database."""
        try:
            async with db_manager.get_connection() as conn:
                await conn.execute("BEGIN")
                
                # Update thread
                await conn.execute(
                    """INSERT OR REPLACE INTO conversation_threads 
                       (thread_id, created_at, last_updated) 
                       VALUES (?, ?, ?)""",
                    (history.thread_id, history.created_at, history.last_updated)
                )
                
                # Process each exchange
                for exchange in history.exchanges:
                    # Insert or update exchange
                    await conn.execute(
                        """INSERT OR REPLACE INTO conversation_exchanges 
                           (id, thread_id, user_message, planner_summary, executor_summary,
                            timestamp, final_response, execution_metadata, is_complete)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (
                            exchange.id,
                            history.thread_id,
                            exchange.user_message,
                            exchange.planner_summary,
                            exchange.executor_summary,
                            exchange.timestamp,
                            exchange.final_response,
                            json_serialize(exchange.execution_metadata),
                            exchange.is_complete
                        )
                    )
                    
                    # Clear existing agent messages for this exchange
                    await conn.execute(
                        "DELETE FROM exchange_agent_messages WHERE exchange_id = ?",
                        (exchange.id,)
                    )
                    
                    # Insert agent messages
                    for message in exchange.agent_messages:
                        await conn.execute(
                            """INSERT INTO exchange_agent_messages 
                               (id, exchange_id, agent, content, message_type, thinking_content,
                                tool_calls, timestamp, tool_name, tool_args, tool_result_parsed, tool_call_id)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                            (
                                message.id,
                                exchange.id,
                                message.agent,
                                message.content,
                                message.message_type,
                                message.thinking_content,
                                json_serialize(message.tool_calls),
                                message.timestamp,
                                message.tool_name,
                                json_serialize(message.tool_args),
                                json_serialize(message.tool_result_parsed),
                                message.tool_call_id
                            )
                        )
                    
                    # Clear existing streaming events for this exchange
                    await conn.execute(
                        "DELETE FROM exchange_streaming_events WHERE exchange_id = ?",
                        (exchange.id,)
                    )
                    
                    # Insert streaming events
                    for event in exchange.streaming_events:
                        await conn.execute(
                            """INSERT INTO exchange_streaming_events 
                               (id, exchange_id, event_type, agent, content, metadata, timestamp)
                               VALUES (?, ?, ?, ?, ?, ?, ?)""",
                            (
                                event.id,
                                exchange.id,
                                event.event_type,
                                event.agent,
                                event.content,
                                json_serialize(event.metadata),
                                event.timestamp
                            )
                        )
                
                await conn.commit()
                self.logger.info(f"Saved conversation history for thread {history.thread_id}")
        
        except Exception as e:
            self.logger.error(f"Error saving conversation history: {e}")
            raise
    
    async def clear_thread_history(self, thread_id: str) -> bool:
        """Clear the conversation history for a thread."""
        try:
            async with db_manager.get_connection() as conn:
                await conn.execute("BEGIN")
                
                # Delete thread and all related data (cascading deletes will handle the rest)
                await conn.execute(
                    "DELETE FROM conversation_threads WHERE thread_id = ?",
                    (thread_id,)
                )
                
                await conn.commit()
                self.logger.info(f"Cleared conversation history for thread {thread_id}")
                return True
        
        except Exception as e:
            self.logger.error(f"Error clearing thread history: {e}")
            return False
    
    async def get_thread_count(self) -> int:
        """Get the total number of conversation threads."""
        try:
            async with db_manager.get_connection() as conn:
                cursor = await conn.execute("SELECT COUNT(*) FROM conversation_threads")
                result = await cursor.fetchone()
                return result[0] if result else 0
        except Exception as e:
            self.logger.error(f"Error getting thread count: {e}")
            return 0
    
    async def get_exchange_count(self) -> int:
        """Get the total number of exchanges across all threads."""
        try:
            async with db_manager.get_connection() as conn:
                cursor = await conn.execute("SELECT COUNT(*) FROM conversation_exchanges")
                result = await cursor.fetchone()
                return result[0] if result else 0
        except Exception as e:
            self.logger.error(f"Error getting exchange count: {e}")
            return 0
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get conversation statistics."""
        try:
            async with db_manager.get_connection() as conn:
                stats = {}
                
                # Thread count
                cursor = await conn.execute("SELECT COUNT(*) FROM conversation_threads")
                result = await cursor.fetchone()
                stats['thread_count'] = result[0] if result else 0
                
                # Exchange count
                cursor = await conn.execute("SELECT COUNT(*) FROM conversation_exchanges")
                result = await cursor.fetchone()
                stats['exchange_count'] = result[0] if result else 0
                
                # Message count
                cursor = await conn.execute("SELECT COUNT(*) FROM exchange_agent_messages")
                result = await cursor.fetchone()
                stats['message_count'] = result[0] if result else 0
                
                # Event count
                cursor = await conn.execute("SELECT COUNT(*) FROM exchange_streaming_events")
                result = await cursor.fetchone()
                stats['event_count'] = result[0] if result else 0
                
                return stats
        
        except Exception as e:
            self.logger.error(f"Error getting stats: {e}")
            return {'error': str(e)} 