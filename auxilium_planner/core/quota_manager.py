#!/usr/bin/env python3
"""
Quota Manager for Google Gemini API

Handles automatic API key rotation when rate limits are encountered.
Tracks usage per key and switches to available keys automatically.
"""

import os
import time
import json
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class KeyUsage:
    """Track usage statistics for an API key."""
    key_id: str
    key_suffix: str  # Last 4 characters for identification
    requests_today: int
    last_request_time: Optional[str]
    quota_reset_time: Optional[str]
    is_exhausted: bool
    total_requests: int
    first_used: Optional[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'KeyUsage':
        return cls(**data)


class QuotaManager:
    """
    Manages multiple Google API keys and automatically rotates when quotas are hit.
    
    Features:
    - Automatic key rotation on 429 errors
    - Usage tracking per key
    - Persistent storage of usage data
    - Daily quota reset handling
    - Smart key selection
    """
    
    def __init__(self, api_keys: List[str], usage_file: str = "data/api_key_usage.json"):
        self.api_keys = self._deduplicate_keys(api_keys)
        self.current_key_index = 0
        self.usage_file = Path(usage_file)
        self.usage_file.parent.mkdir(exist_ok=True)
        
        # Initialize usage tracking
        self.key_usage: Dict[str, KeyUsage] = {}
        self._load_usage_data()
        self._initialize_keys()
        
        logger.info(f"🔑 QuotaManager initialized with {len(self.api_keys)} unique API keys")
    
    def _deduplicate_keys(self, keys: List[str]) -> List[str]:
        """Remove duplicate keys while preserving order."""
        seen = set()
        unique_keys = []
        for key in keys:
            if key not in seen:
                seen.add(key)
                unique_keys.append(key)
        return unique_keys
    
    def _initialize_keys(self):
        """Initialize usage tracking for all keys."""
        now = datetime.now().isoformat()
        
        for i, key in enumerate(self.api_keys):
            key_id = f"key_{i}"
            key_suffix = key[-4:] if len(key) > 4 else key
            
            if key_id not in self.key_usage:
                self.key_usage[key_id] = KeyUsage(
                    key_id=key_id,
                    key_suffix=key_suffix,
                    requests_today=0,
                    last_request_time=None,
                    quota_reset_time=None,
                    is_exhausted=False,
                    total_requests=0,
                    first_used=None
                )
        
        self._save_usage_data()
    
    def _load_usage_data(self):
        """Load usage data from persistent storage."""
        try:
            if self.usage_file.exists():
                with open(self.usage_file, 'r') as f:
                    data = json.load(f)
                    self.key_usage = {
                        key_id: KeyUsage.from_dict(usage_data)
                        for key_id, usage_data in data.items()
                    }
                    
                # Reset daily counters if it's a new day
                self._reset_daily_quotas_if_needed()
                
                logger.info(f"📊 Loaded usage data for {len(self.key_usage)} keys")
        except Exception as e:
            logger.warning(f"⚠️ Could not load usage data: {e}")
            self.key_usage = {}
    
    def _save_usage_data(self):
        """Save usage data to persistent storage."""
        try:
            data = {
                key_id: usage.to_dict()
                for key_id, usage in self.key_usage.items()
            }
            with open(self.usage_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"❌ Could not save usage data: {e}")
    
    def _reset_daily_quotas_if_needed(self):
        """Reset daily quotas if it's a new day."""
        now = datetime.now()
        today = now.date()
        
        for usage in self.key_usage.values():
            if usage.last_request_time:
                last_request_date = datetime.fromisoformat(usage.last_request_time).date()
                if last_request_date < today:
                    usage.requests_today = 0
                    usage.is_exhausted = False
                    usage.quota_reset_time = None
                    logger.info(f"🔄 Reset daily quota for key ending in {usage.key_suffix}")
    
    def get_current_api_key(self) -> str:
        """Get the currently active API key."""
        if not self.api_keys:
            raise ValueError("No API keys available")
        
        return self.api_keys[self.current_key_index]
    
    def record_request(self) -> str:
        """Record a request and return the current API key."""
        current_key = self.get_current_api_key()
        key_id = f"key_{self.current_key_index}"
        usage = self.key_usage[key_id]
        
        now = datetime.now().isoformat()
        
        # Update usage statistics
        usage.requests_today += 1
        usage.total_requests += 1
        usage.last_request_time = now
        
        if usage.first_used is None:
            usage.first_used = now
        
        self._save_usage_data()
        
        logger.debug(f"📊 Request #{usage.requests_today} today for key ending in {usage.key_suffix}")
        
        return current_key
    
    async def check_and_wait_if_needed(self):
        """Check if we need to wait for rate limit management (per-minute limits)."""
        # Calculate total requests across all keys today
        total_requests_today = sum(usage.requests_today for usage in self.key_usage.values())
        
        # Wait 40 seconds after every 10 requests to avoid per-minute rate limits
        if total_requests_today > 0 and total_requests_today % 10 == 0:
            logger.warning(f"🚨 API Quota: {total_requests_today} requests made today, pausing for 40 seconds to avoid per-minute limits...")
            
            # Import asyncio here to avoid circular imports
            import asyncio
            await asyncio.sleep(40)
            
            logger.info("✅ Quota pause complete, continuing...")
    
    def handle_rate_limit_error(self, error_message: str = "") -> bool:
        """
        Handle a rate limit error by rotating to the next available key.
        
        Returns:
            bool: True if successfully rotated to a new key, False if all keys exhausted
        """
        current_key_id = f"key_{self.current_key_index}"
        current_usage = self.key_usage[current_key_id]
        
        # Mark current key as exhausted
        current_usage.is_exhausted = True
        current_usage.quota_reset_time = (datetime.now() + timedelta(days=1)).isoformat()
        
        logger.warning(f"🚨 Rate limit hit for key ending in {current_usage.key_suffix}")
        logger.warning(f"🚨 Requests today: {current_usage.requests_today}")
        
        # Try to find an available key
        original_index = self.current_key_index
        
        for attempt in range(len(self.api_keys)):
            self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
            next_key_id = f"key_{self.current_key_index}"
            next_usage = self.key_usage[next_key_id]
            
            if not next_usage.is_exhausted:
                logger.info(f"🔄 Switching to key ending in {next_usage.key_suffix}")
                logger.info(f"🔄 New key has made {next_usage.requests_today} requests today")
                self._save_usage_data()
                return True
        
        # All keys are exhausted
        self.current_key_index = original_index
        logger.error(f"❌ All {len(self.api_keys)} API keys have reached their quotas!")
        return False
    
    def get_usage_summary(self) -> Dict[str, Any]:
        """Get a summary of usage across all keys."""
        total_requests_today = sum(usage.requests_today for usage in self.key_usage.values())
        total_requests_all_time = sum(usage.total_requests for usage in self.key_usage.values())
        available_keys = sum(1 for usage in self.key_usage.values() if not usage.is_exhausted)
        
        current_key_id = f"key_{self.current_key_index}"
        current_usage = self.key_usage.get(current_key_id)
        
        return {
            "total_keys": len(self.api_keys),
            "available_keys": available_keys,
            "exhausted_keys": len(self.api_keys) - available_keys,
            "current_key_suffix": current_usage.key_suffix if current_usage else "none",
            "current_key_requests_today": current_usage.requests_today if current_usage else 0,
            "total_requests_today": total_requests_today,
            "total_requests_all_time": total_requests_all_time,
            "keys_status": [
                {
                    "key_suffix": usage.key_suffix,
                    "requests_today": usage.requests_today,
                    "total_requests": usage.total_requests,
                    "is_exhausted": usage.is_exhausted,
                    "is_current": usage.key_id == current_key_id
                }
                for usage in self.key_usage.values()
            ]
        }
    
    def print_usage_summary(self):
        """Print a formatted usage summary."""
        summary = self.get_usage_summary()
        
        print(f"\n🔑 API KEY USAGE SUMMARY")
        print(f"{'═' * 50}")
        print(f"📊 Total Keys: {summary['total_keys']}")
        print(f"✅ Available: {summary['available_keys']}")
        print(f"❌ Exhausted: {summary['exhausted_keys']}")
        print(f"🎯 Current Key: ...{summary['current_key_suffix']} ({summary['current_key_requests_today']} requests today)")
        print(f"📈 Today Total: {summary['total_requests_today']} requests")
        print(f"📈 All Time: {summary['total_requests_all_time']} requests")
        
        print(f"\n🔑 INDIVIDUAL KEY STATUS:")
        for key_status in summary['keys_status']:
            status_icon = "🎯" if key_status['is_current'] else ("❌" if key_status['is_exhausted'] else "✅")
            print(f"   {status_icon} ...{key_status['key_suffix']}: {key_status['requests_today']} today, {key_status['total_requests']} total")
        
        print(f"{'═' * 50}")
    
    def force_switch_key(self) -> bool:
        """Manually switch to the next available key."""
        return self.handle_rate_limit_error("Manual switch requested")
    
    def reset_key_quota(self, key_suffix: str):
        """Manually reset the quota for a specific key (for testing)."""
        for usage in self.key_usage.values():
            if usage.key_suffix == key_suffix:
                usage.is_exhausted = False
                usage.requests_today = 0
                usage.quota_reset_time = None
                self._save_usage_data()
                logger.info(f"🔄 Manually reset quota for key ending in {key_suffix}")
                return True
        
        logger.warning(f"⚠️ Key ending in {key_suffix} not found")
        return False


# Global quota manager instance
_quota_manager: Optional[QuotaManager] = None

def get_quota_manager() -> QuotaManager:
    """Get the global quota manager instance."""
    global _quota_manager
    if _quota_manager is None:
        raise RuntimeError("Quota manager not initialized. Call initialize_quota_manager() first.")
    return _quota_manager

def initialize_quota_manager(api_keys: List[str], usage_file: str = "data/api_key_usage.json"):
    """Initialize the global quota manager."""
    global _quota_manager
    _quota_manager = QuotaManager(api_keys, usage_file)
    
    # Set the initial API key in the environment
    os.environ["GOOGLE_API_KEY"] = _quota_manager.get_current_api_key()
    
    return _quota_manager 