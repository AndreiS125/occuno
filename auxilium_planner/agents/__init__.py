"""
Auxilium AI Agent System

This package contains the multi-agent system built with LangGraph and Google Gemini.
The system includes:
- Planning Agent: Analyzes and retrieves data
- Executor Agent: Executes plans and performs actions
- Single Agent: Combines planning and execution for efficiency (new)
- Tools: Functions that agents can use to interact with the system
- Memory: System for storing and retrieving user facts and conversation history
"""

from .agent_graph import AgentGraph
from .single_agent_graph import SingleAgentGraph, StreamingSingleAgentGraph
from .memory_system import MemorySystem

__all__ = [
    "AgentGraph",
    "SingleAgentGraph", 
    "StreamingSingleAgentGraph",
    "MemorySystem"
] 