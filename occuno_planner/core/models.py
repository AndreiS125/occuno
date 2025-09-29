"""
Thin aggregator that re-exports split SQLModel models.

All code can continue to import from `core.models`.
"""

from .models_parts import *  # noqa: F401,F403
