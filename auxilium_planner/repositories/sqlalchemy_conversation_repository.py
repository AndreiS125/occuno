"""
SQLAlchemy-based conversation repository

This repository replaces the SQLite-based conversation repository while
maintaining complete API compatibility and preserving all existing behavior.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import desc

# Data classes for conversation management
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime

@dataclass
class AgentMessage:
    """Represents a message from an AI agent"""
    id: str
    agent: str
    content: str
    message_type: str = "response"
    thinking_content: str = ""
    tool_calls: List[Dict] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    tool_name: Optional[str] = None
    tool_args: Optional[Dict] = None
    tool_call_id: Optional[str] = None
    tool_result_parsed: Optional[Dict] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API serialization"""
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
            "tool_call_id": self.tool_call_id,
            "tool_result_parsed": self.tool_result_parsed
        }

@dataclass
class StreamingEvent:
    """Represents a streaming event during agent execution"""
    id: str
    event_type: str
    agent: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API serialization"""
        return {
            "id": self.id,
            "event_type": self.event_type,
            "agent": self.agent,
            "content": self.content,
            "metadata": self.metadata,
            "timestamp": self.timestamp
        }

@dataclass
class ExchangeSummary:
    """Represents a conversation exchange between user and agents"""
    id: str
    user_message: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    planner_summary: str = ""
    executor_summary: str = ""
    final_response: str = ""
    is_complete: bool = False
    agent_messages: List[AgentMessage] = field(default_factory=list)
    streaming_events: List[StreamingEvent] = field(default_factory=list)
    execution_metadata: Dict[str, Any] = field(default_factory=dict)
    
    def add_agent_message(self, agent: str, content: str, message_type: str = "response", 
                         thinking_content: str = "", tool_calls: List[Dict] = None) -> AgentMessage:
        """Add an agent message to this exchange"""
        message = AgentMessage(
            id=str(uuid.uuid4()),
            agent=agent,
            content=content,
            message_type=message_type,
            thinking_content=thinking_content,
            tool_calls=tool_calls or []
        )
        self.agent_messages.append(message)
        return message
    
    def add_streaming_event(self, event_type: str, agent: str, content: str, 
                           metadata: Dict = None) -> StreamingEvent:
        """Add a streaming event to this exchange"""
        event = StreamingEvent(
            id=str(uuid.uuid4()),
            event_type=event_type,
            agent=agent,
            content=content,
            metadata=metadata or {}
        )
        self.streaming_events.append(event)
        return event
    
    def set_final_response(self, response: str):
        """Set the final response and mark as complete"""
        self.final_response = response
        self.is_complete = True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API serialization"""
        return {
            "id": self.id,
            "user_message": self.user_message,
            "timestamp": self.timestamp,
            "planner_summary": self.planner_summary,
            "executor_summary": self.executor_summary,
            "final_response": self.final_response,
            "is_complete": self.is_complete,
            "agent_messages": [msg.to_dict() for msg in self.agent_messages],
            "streaming_events": [event.to_dict() for event in self.streaming_events],
            "execution_metadata": self.execution_metadata
        }

@dataclass
class ConversationHistory:
    """Represents the complete conversation history for a thread"""
    thread_id: str
    exchanges: List[ExchangeSummary] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def add_exchange(self, user_message: str) -> ExchangeSummary:
        """Add a new exchange to the conversation"""
        exchange = ExchangeSummary(
            id=str(uuid.uuid4()),
            user_message=user_message
        )
        self.exchanges.append(exchange)
        self.last_updated = datetime.utcnow().isoformat()
        return exchange
    
    def update_planner_summary(self, exchange_id: str, summary: str):
        """Update planner summary for an exchange"""
        for exchange in self.exchanges:
            if exchange.id == exchange_id:
                exchange.planner_summary = summary
                self.last_updated = datetime.utcnow().isoformat()
                break
    
    def update_executor_summary(self, exchange_id: str, summary: str):
        """Update executor summary for an exchange"""
        for exchange in self.exchanges:
            if exchange.id == exchange_id:
                exchange.executor_summary = summary
                self.last_updated = datetime.utcnow().isoformat()
                break
    
    def get_formatted_history_for_planner(self) -> str:
        """Get formatted conversation history for planner context"""
        if not self.exchanges:
            return "No previous conversation history."
        
        history_parts = []
        for exchange in self.exchanges[-5:]:  # Last 5 exchanges
            history_parts.append(f"User: {exchange.user_message}")
            if exchange.final_response:
                history_parts.append(f"Assistant: {exchange.final_response}")
        
        return "\n".join(history_parts)
    
    def get_last_10_exchanges(self) -> List[ExchangeSummary]:
        """Get the last 10 exchanges"""
        return self.exchanges[-10:] if len(self.exchanges) > 10 else self.exchanges
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API serialization"""
        return {
            "thread_id": self.thread_id,
            "exchanges": [exchange.to_dict() for exchange in self.exchanges],
            "created_at": self.created_at,
            "last_updated": self.last_updated
        }
from core.sqlalchemy_database import sqlalchemy_db_manager
from core.sqlalchemy_models import (
    ConversationThreadModel, ConversationExchangeModel,
    ExchangeAgentMessageModel, ExchangeStreamingEventModel
)
from core.logging_config import get_logger

class SQLAlchemyConversationRepository:
    """SQLAlchemy-based conversation repository with complete API compatibility"""
    
    def __init__(self):
        self.logger = get_logger("sqlalchemy_conversation_repository")
    
    def _agent_message_to_model(self, message: AgentMessage, exchange_id: str) -> ExchangeAgentMessageModel:
        """Convert AgentMessage to SQLAlchemy model"""
        return ExchangeAgentMessageModel(
            id=message.id,
            exchange_id=exchange_id,
            agent=message.agent,
            content=message.content,
            message_type=message.message_type,
            thinking_content=message.thinking_content,
            tool_calls=message.tool_calls,
            timestamp=datetime.fromisoformat(message.timestamp) if isinstance(message.timestamp, str) else message.timestamp,
            tool_name=message.tool_name,
            tool_args=message.tool_args,
            tool_result_parsed=message.tool_result_parsed,
            tool_call_id=message.tool_call_id
        )
    
    def _model_to_agent_message(self, model: ExchangeAgentMessageModel) -> AgentMessage:
        """Convert SQLAlchemy model to AgentMessage"""
        message = AgentMessage(
            id=model.id,
            agent=model.agent,
            content=model.content,
            message_type=model.message_type,
            thinking_content=model.thinking_content,
            tool_calls=model.tool_calls or [],
            timestamp=model.timestamp.isoformat() if model.timestamp else datetime.utcnow().isoformat(),
            tool_name=model.tool_name,
            tool_args=model.tool_args or {},
            tool_call_id=model.tool_call_id,
            tool_result_parsed=model.tool_result_parsed or {}
        )
        return message
    
    def _streaming_event_to_model(self, event: StreamingEvent, exchange_id: str) -> ExchangeStreamingEventModel:
        """Convert StreamingEvent to SQLAlchemy model"""
        return ExchangeStreamingEventModel(
            id=event.id,
            exchange_id=exchange_id,
            event_type=event.event_type,
            agent=event.agent,
            content=event.content,
            event_metadata=event.metadata,
            timestamp=datetime.fromisoformat(event.timestamp) if isinstance(event.timestamp, str) else event.timestamp
        )
    
    def _model_to_streaming_event(self, model: ExchangeStreamingEventModel) -> StreamingEvent:
        """Convert SQLAlchemy model to StreamingEvent"""
        event = StreamingEvent(
            id=model.id,
            event_type=model.event_type,
            agent=model.agent,
            content=model.content,
            metadata=model.event_metadata or {},
            timestamp=model.timestamp.isoformat() if model.timestamp else datetime.utcnow().isoformat()
        )
        return event
    
    def _exchange_to_model(self, exchange: ExchangeSummary, thread_id: str) -> ConversationExchangeModel:
        """Convert ExchangeSummary to SQLAlchemy model"""
        return ConversationExchangeModel(
            id=exchange.id,
            thread_id=thread_id,
            user_message=exchange.user_message,
            planner_summary=exchange.planner_summary,
            executor_summary=exchange.executor_summary,
            timestamp=datetime.fromisoformat(exchange.timestamp) if isinstance(exchange.timestamp, str) else exchange.timestamp,
            final_response=exchange.final_response,
            execution_metadata=exchange.execution_metadata,
            is_complete=exchange.is_complete
        )
    
    def _model_to_exchange(self, model: ConversationExchangeModel) -> ExchangeSummary:
        """Convert SQLAlchemy model to ExchangeSummary"""
        exchange = ExchangeSummary(
            id=model.id,
            user_message=model.user_message,
            timestamp=model.timestamp.isoformat() if model.timestamp else datetime.utcnow().isoformat(),
            planner_summary=model.planner_summary,
            executor_summary=model.executor_summary,
            final_response=model.final_response,
            is_complete=model.is_complete,
            execution_metadata=model.execution_metadata or {}
        )
        
        # Load agent messages
        exchange.agent_messages = [
            self._model_to_agent_message(msg_model) 
            for msg_model in model.agent_messages
        ]
        
        # Load streaming events
        exchange.streaming_events = [
            self._model_to_streaming_event(event_model) 
            for event_model in model.streaming_events
        ]
        
        return exchange
    
    async def get_conversation_history(self, thread_id: str) -> ConversationHistory:
        """Get conversation history for a thread"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                # Get or create thread
                thread_model = session.query(ConversationThreadModel).filter_by(thread_id=thread_id).first()
                
                history = ConversationHistory(thread_id)
                
                if thread_model:
                    history.created_at = thread_model.created_at.isoformat()
                    history.last_updated = thread_model.last_updated.isoformat()
                    
                    # Load exchanges with their messages and events
                    exchange_models = session.query(ConversationExchangeModel).filter_by(
                        thread_id=thread_id
                    ).order_by(ConversationExchangeModel.timestamp.asc()).all()
                    
                    for exchange_model in exchange_models:
                        exchange = self._model_to_exchange(exchange_model)
                        history.exchanges.append(exchange)
                
                return history
        
        except Exception as e:
            self.logger.error(f"Error getting conversation history: {e}")
            return ConversationHistory(thread_id)
    
    async def save_conversation_history(self, history: ConversationHistory):
        """Save conversation history to database"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                # Update or create thread
                thread_model = session.query(ConversationThreadModel).filter_by(thread_id=history.thread_id).first()
                if not thread_model:
                    thread_model = ConversationThreadModel(
                        thread_id=history.thread_id,
                        created_at=datetime.fromisoformat(history.created_at) if isinstance(history.created_at, str) else history.created_at,
                        last_updated=datetime.fromisoformat(history.last_updated) if isinstance(history.last_updated, str) else history.last_updated
                    )
                    session.add(thread_model)
                else:
                    thread_model.last_updated = datetime.fromisoformat(history.last_updated) if isinstance(history.last_updated, str) else history.last_updated
                
                # Process each exchange
                for exchange in history.exchanges:
                    # Update or create exchange
                    exchange_model = session.query(ConversationExchangeModel).filter_by(id=exchange.id).first()
                    if not exchange_model:
                        exchange_model = self._exchange_to_model(exchange, history.thread_id)
                        session.add(exchange_model)
                    else:
                        # Update existing exchange
                        exchange_model.user_message = exchange.user_message
                        exchange_model.planner_summary = exchange.planner_summary
                        exchange_model.executor_summary = exchange.executor_summary
                        exchange_model.final_response = exchange.final_response
                        exchange_model.execution_metadata = exchange.execution_metadata
                        exchange_model.is_complete = exchange.is_complete
                    
                    # Upsert agent messages (avoid data loss during streaming)
                    existing_message_ids = {msg.id for msg in session.query(ExchangeAgentMessageModel).filter_by(exchange_id=exchange.id).all()}
                    current_message_ids = {msg.id for msg in exchange.agent_messages}
                    
                    # Remove messages that no longer exist
                    messages_to_remove = existing_message_ids - current_message_ids
                    if messages_to_remove:
                        session.query(ExchangeAgentMessageModel).filter(
                            ExchangeAgentMessageModel.exchange_id == exchange.id,
                            ExchangeAgentMessageModel.id.in_(messages_to_remove)
                        ).delete(synchronize_session=False)
                    
                    # Add or update messages
                    for message in exchange.agent_messages:
                        existing_msg = session.query(ExchangeAgentMessageModel).filter_by(id=message.id).first()
                        if existing_msg:
                            # Update existing message
                            existing_msg.agent = message.agent
                            existing_msg.content = message.content
                            existing_msg.message_type = message.message_type
                            existing_msg.thinking_content = message.thinking_content
                            existing_msg.tool_calls = message.tool_calls
                            existing_msg.tool_name = message.tool_name
                            existing_msg.tool_args = message.tool_args
                            existing_msg.tool_call_id = message.tool_call_id
                            existing_msg.tool_result_parsed = message.tool_result_parsed
                            existing_msg.timestamp = datetime.fromisoformat(message.timestamp) if isinstance(message.timestamp, str) else message.timestamp
                        else:
                            # Add new message
                            message_model = self._agent_message_to_model(message, exchange.id)
                            session.add(message_model)
                    
                    # Upsert streaming events (avoid data loss during streaming)
                    existing_event_ids = {evt.id for evt in session.query(ExchangeStreamingEventModel).filter_by(exchange_id=exchange.id).all()}
                    current_event_ids = {evt.id for evt in exchange.streaming_events}
                    
                    # Remove events that no longer exist
                    events_to_remove = existing_event_ids - current_event_ids
                    if events_to_remove:
                        session.query(ExchangeStreamingEventModel).filter(
                            ExchangeStreamingEventModel.exchange_id == exchange.id,
                            ExchangeStreamingEventModel.id.in_(events_to_remove)
                        ).delete(synchronize_session=False)
                    
                    # Add or update events
                    for event in exchange.streaming_events:
                        existing_evt = session.query(ExchangeStreamingEventModel).filter_by(id=event.id).first()
                        if existing_evt:
                            # Update existing event
                            existing_evt.event_type = event.event_type
                            existing_evt.agent = event.agent
                            existing_evt.content = event.content
                            existing_evt.event_metadata = event.metadata
                            existing_evt.timestamp = datetime.fromisoformat(event.timestamp) if isinstance(event.timestamp, str) else event.timestamp
                        else:
                            # Add new event
                            event_model = self._streaming_event_to_model(event, exchange.id)
                            session.add(event_model)
                
                # Session will be committed by the context manager
                
                self.logger.debug(f"Saved conversation history for thread {history.thread_id}")
        
        except Exception as e:
            self.logger.error(f"Error saving conversation history: {e}")
            raise
    
    async def clear_thread_history(self, thread_id: str) -> bool:
        """Clear the conversation history for a thread"""
        try:
            with sqlalchemy_db_manager.get_transaction() as session:
                # Delete thread and all related data (cascading deletes will handle the rest)
                thread_model = session.query(ConversationThreadModel).filter_by(thread_id=thread_id).first()
                if thread_model:
                    session.delete(thread_model)
                    # Session will be committed by the context manager
                    
                    self.logger.info(f"Cleared conversation history for thread {thread_id}")
                    return True
                else:
                    self.logger.warning(f"Thread {thread_id} not found")
                    return False
        
        except Exception as e:
            self.logger.error(f"Error clearing thread history: {e}")
            return False
    
    async def get_thread_count(self) -> int:
        """Get the total number of conversation threads"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                return session.query(ConversationThreadModel).count()
        except Exception as e:
            self.logger.error(f"Error getting thread count: {e}")
            return 0
    
    async def get_exchange_count(self) -> int:
        """Get the total number of exchanges across all threads"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                return session.query(ConversationExchangeModel).count()
        except Exception as e:
            self.logger.error(f"Error getting exchange count: {e}")
            return 0
    
    async def get_all_threads(self) -> List[str]:
        """Get all conversation thread IDs"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                thread_models = session.query(ConversationThreadModel).order_by(
                    desc(ConversationThreadModel.last_updated)
                ).all()
                return [thread.thread_id for thread in thread_models]
        except Exception as e:
            self.logger.error(f"Error getting all threads: {e}")
            return []
    
    async def get_threads_with_details(self) -> List[Dict[str, Any]]:
        """Get all conversation threads with detailed metadata"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                threads = []
                
                # Get all threads with their exchange counts and latest exchange info
                thread_models = session.query(ConversationThreadModel).order_by(
                    desc(ConversationThreadModel.last_updated)
                ).all()
                
                for thread_model in thread_models:
                    # Get exchange count for this thread
                    exchange_count = session.query(ConversationExchangeModel).filter_by(
                        thread_id=thread_model.thread_id
                    ).count()
                    
                    # Get latest exchange for preview
                    latest_exchange = session.query(ConversationExchangeModel).filter_by(
                        thread_id=thread_model.thread_id
                    ).order_by(desc(ConversationExchangeModel.timestamp)).first()
                    
                    # Create thread info
                    latest_message = latest_exchange.user_message if latest_exchange else ''
                    latest_response = ''
                    if latest_exchange:
                        latest_response = (latest_exchange.final_response or 
                                         latest_exchange.executor_summary or 
                                         latest_exchange.planner_summary or '')
                    
                    thread_info = {
                        "id": thread_model.thread_id,
                        "created_at": thread_model.created_at.isoformat() if thread_model.created_at else None,
                        "last_updated": thread_model.last_updated.isoformat() if thread_model.last_updated else None,
                        "message_count": exchange_count,
                        "latest_message": latest_message,
                        "latest_response": latest_response,
                        "title": (latest_message[:50] + '...' if len(latest_message) > 50 
                                 else latest_message) if latest_message else 'Empty Conversation'
                    }
                    threads.append(thread_info)
                
                return threads
        
        except Exception as e:
            self.logger.error(f"Error getting threads with details: {e}")
            return []
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get conversation statistics"""
        try:
            with sqlalchemy_db_manager.get_session() as session:
                stats = {}
                
                # Thread count
                stats['thread_count'] = session.query(ConversationThreadModel).count()
                
                # Exchange count
                stats['exchange_count'] = session.query(ConversationExchangeModel).count()
                
                # Message count
                stats['message_count'] = session.query(ExchangeAgentMessageModel).count()
                
                # Event count
                stats['event_count'] = session.query(ExchangeStreamingEventModel).count()
                
                return stats
        
        except Exception as e:
            self.logger.error(f"Error getting stats: {e}")
            return {'error': str(e)}
