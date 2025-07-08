"""
Agent Prompt Templates

This package contains all the prompt templates used by the AI agents.
"""

from .planning_prompt import PLANNING_AGENT_PROMPT
from .executor_prompt import EXECUTOR_AGENT_PROMPT

__all__ = [
    "PLANNING_AGENT_PROMPT",
    "EXECUTOR_AGENT_PROMPT"
] 