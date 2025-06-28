import json
import asyncio
from pathlib import Path
from typing import Any, Dict, Optional
from datetime import datetime
import aiofiles
from uuid import UUID
from core.config import settings

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle UUID and datetime objects."""
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

class FileRepository:
    """Generic JSON file repository for data persistence."""
    
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self._lock = asyncio.Lock()
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Ensure the data file and directory exist."""
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            with open(self.file_path, 'w') as f:
                json.dump({}, f)
    
    async def read_all(self) -> Dict[str, Any]:
        """Read all data from the JSON file."""
        async with self._lock:
            try:
                async with aiofiles.open(self.file_path, 'r') as f:
                    content = await f.read()
                    return json.loads(content) if content else {}
            except (json.JSONDecodeError, FileNotFoundError):
                return {}
    
    async def write_all(self, data: Dict[str, Any]) -> None:
        """Write all data to the JSON file."""
        async with self._lock:
            async with aiofiles.open(self.file_path, 'w') as f:
                await f.write(json.dumps(data, cls=JSONEncoder, indent=2))
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a specific key from the JSON file."""
        data = await self.read_all()
        return data.get(key)
    
    async def set(self, key: str, value: Any) -> None:
        """Set a specific key in the JSON file."""
        data = await self.read_all()
        data[key] = value
        await self.write_all(data)
    
    async def update(self, key: str, updates: Dict[str, Any]) -> None:
        """Update a nested dictionary in the JSON file."""
        data = await self.read_all()
        if key in data and isinstance(data[key], dict):
            data[key].update(updates)
        else:
            data[key] = updates
        await self.write_all(data)
    
    async def load_data(self) -> Dict[str, Any]:
        """Convenience method - alias for read_all."""
        return await self.read_all()
    
    async def save_data(self, data: Dict[str, Any]) -> None:
        """Convenience method - alias for write_all."""
        await self.write_all(data) 