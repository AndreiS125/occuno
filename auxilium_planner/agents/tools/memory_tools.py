"""
Memory Tools for AI Agents

These tools allow agents to save and retrieve user memories/facts:
- Save important user information
- Retrieve user memories for context
"""

from typing import List, Dict, Any
from datetime import datetime
import json

from langchain_core.tools import tool
from core.config import settings
from core.logging_config import get_logger
from .objective_tools import safe_json_dumps

logger = get_logger("memory_tools")


class MemoryManager:
    """Manages user memories stored in the data file"""
    
    def __init__(self):
        self.data_file = settings.data_file_path
    
    async def load_data(self) -> Dict[str, Any]:
        """Load data from the JSON file"""
        try:
            import aiofiles
            async with aiofiles.open(self.data_file, 'r') as f:
                content = await f.read()
                return json.loads(content)
        except FileNotFoundError:
            return {"user_profile": {}, "objectives": [], "user_memories": []}
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            return {"user_profile": {}, "objectives": [], "user_memories": []}
    
    async def save_data(self, data: Dict[str, Any]) -> None:
        """Save data to the JSON file"""
        try:
            import aiofiles
            async with aiofiles.open(self.data_file, 'w') as f:
                # Use safe JSON serializer for saving data
                await f.write(safe_json_dumps(data, indent=2))
        except Exception as e:
            logger.error(f"Error saving data: {e}")
            raise


@tool
async def save_user_memory(memory_text: str, category: str = "general") -> str:
    """
    Save an important fact or insight about the user.
    
    Args:
        memory_text: The fact or insight to remember about the user
        category: Category of the memory (e.g., "preferences", "patterns", "goals", "constraints")
    
    Returns:
        JSON string confirming the memory was saved
    """
    try:
        memory_manager = MemoryManager()
        data = await memory_manager.load_data()
        
        # Initialize user_memories if it doesn't exist
        if "user_memories" not in data:
            data["user_memories"] = []
        
        # Check for duplicates to prevent saving the same memory multiple times
        existing_memories = data["user_memories"]
        for existing_memory in existing_memories:
            existing_text = existing_memory.get("text", "").lower().strip()
            new_text = memory_text.lower().strip()
            
            # If very similar memory exists, don't save duplicate
            if existing_text == new_text or (len(existing_text) > 20 and existing_text in new_text) or (len(new_text) > 20 and new_text in existing_text):
                logger.info(f"Duplicate memory detected, skipping save: {memory_text[:50]}...")
                return safe_json_dumps({
                    "success": False,
                    "message": f"Memory already exists in category '{category}' - skipping duplicate",
                    "existing_memory": existing_memory
                }, indent=2)
        
        # Create memory entry
        memory_entry = {
            "text": memory_text,
            "category": category,
            "timestamp": datetime.utcnow().isoformat(),
            "id": len(data["user_memories"]) + 1
        }
        
        data["user_memories"].append(memory_entry)
        
        # Save the updated data
        await memory_manager.save_data(data)
        
        logger.info(f"Saved user memory: {memory_text[:50]}...")
        
        return safe_json_dumps({
            "success": True,
            "message": f"Saved memory in category '{category}'",
            "memory": memory_entry
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Error saving user memory: {e}")
        return safe_json_dumps({"error": f"Failed to save memory: {str(e)}"})


@tool
async def get_user_memories(category: str = None, limit: int = 20) -> str:
    """
    Retrieve user memories for context.
    
    Args:
        category: Optional category filter
        limit: Maximum number of memories to retrieve (default 20)
    
    Returns:
        JSON string containing user memories
    """
    try:
        memory_manager = MemoryManager()
        data = await memory_manager.load_data()
        
        memories = data.get("user_memories", [])
        
        # Filter by category if specified
        if category:
            memories = [m for m in memories if m.get("category") == category]
        
        # Sort by timestamp (most recent first) and limit
        memories = sorted(memories, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit]
        
        return safe_json_dumps({
            "memories": memories,
            "total_count": len(memories),
            "filtered_by": category if category else "none"
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Error retrieving user memories: {e}")
        return safe_json_dumps({"error": f"Failed to retrieve memories: {str(e)}"})


async def get_user_memories_for_prompt() -> str:
    """
    Get formatted user memories for inclusion in agent prompts.
    
    Returns:
        Formatted string of user memories
    """
    try:
        memory_manager = MemoryManager()
        data = await memory_manager.load_data()
        
        memories = data.get("user_memories", [])
        
        if not memories:
            return "No user memories stored yet."
        
        # Sort by timestamp (most recent first)
        memories = sorted(memories, key=lambda x: x.get("timestamp", ""), reverse=True)
        
        # Format memories for prompt inclusion
        formatted_memories = []
        for memory in memories[:10]:  # Limit to last 10 memories
            timestamp = memory.get("timestamp", "")[:10]  # Just the date
            category = memory.get("category", "general")
            text = memory.get("text", "")
            formatted_memories.append(f"[{timestamp}] ({category}) {text}")
        
        return "\n".join(formatted_memories)
    
    except Exception as e:
        logger.error(f"Error formatting user memories: {e}")
        return "Error retrieving user memories." 