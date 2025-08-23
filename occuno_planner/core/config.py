import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional, List
from pydantic import Field, validator

class Settings(BaseSettings):
    # Application settings
    app_name: str = "Occuno Productivity Planner"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # API settings
    api_prefix: str = "/api/v1"
    
    # Data storage
    data_file_path: Path = Path(__file__).parent.parent / "data" / "user_data.json"
    
    # Google Gemini API Configuration (supports multiple keys for quota management)
    google_api_key: str = Field(default="AIzaSyA0DIcVTY7hxsiwnQfBE7mecsOx4E-ozPs", env="GEMINI_API_KEY")
    google_api_keys: List[str] = Field(default_factory=list, env="GOOGLE_API_KEYS")
    
    # Quota management
    quota_manager_enabled: bool = Field(default=True, env="QUOTA_MANAGER_ENABLED")
    
    # Updated to Gemini 2.5 Flash with thinking mode
    gemini_model: str = Field(default="models/gemini-2.5-flash", env="GEMINI_MODEL")
    gemini_thinking_model: str = Field(default="models/gemini-2.5-flash", env="GEMINI_THINKING_MODEL")
    
    # Agent Configuration
    planning_model: str = Field(default="models/gemini-2.5-flash", env="PLANNING_MODEL")
    executor_model: str = Field(default="models/gemini-2.5-flash", env="EXECUTOR_MODEL")
    enable_thinking_mode: bool = Field(default=True, env="ENABLE_THINKING_MODE")
    
    # Model parameters for enhanced performance
    llm_temperature: float = Field(default=0.7, env="MODEL_TEMPERATURE")
    llm_max_output_tokens: int = Field(default=8192, env="MODEL_MAX_OUTPUT_TOKENS")
    llm_top_p: float = Field(default=0.9, env="MODEL_TOP_P")
    llm_top_k: int = Field(default=40, env="MODEL_TOP_K")
    
    # Agent behavior settings
    max_agent_iterations: int = Field(default=100, env="MAX_AGENT_ITERATIONS")
    max_research_loops: int = Field(default=3, env="MAX_RESEARCH_LOOPS")
    enable_parallel_processing: bool = Field(default=True, env="ENABLE_PARALLEL_PROCESSING")
    
    # Performance optimizations
    request_timeout: int = Field(default=120, env="REQUEST_TIMEOUT")
    retry_attempts: int = Field(default=3, env="RETRY_ATTEMPTS")
    backoff_factor: float = Field(default=2.0, env="BACKOFF_FACTOR")
    
    # Gamification settings
    points_per_task: int = Field(default=25, env="POINTS_PER_TASK")
    points_per_objective: int = Field(default=100, env="POINTS_PER_OBJECTIVE")
    
    # Memory and data retention
    memory_retention_days: int = Field(default=30, env="MEMORY_RETENTION_DAYS")
    
    # Gamification settings
    streak_threshold_hours: int = 24
    
    @validator('google_api_keys', pre=True)
    def parse_api_keys(cls, v, values):
        """Parse API keys from various sources."""
        api_keys = []
        
        # Add the primary key if it exists
        primary_key = values.get('google_api_key')
        if primary_key:
            api_keys.append(primary_key)
        
        # Parse multiple keys if provided as comma-separated string
        if isinstance(v, str):
            keys = [key.strip() for key in v.split(",") if key.strip()]
            api_keys.extend(keys)
        elif isinstance(v, list):
            api_keys.extend(v)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_keys = []
        for key in api_keys:
            if key not in seen:
                seen.add(key)
                unique_keys.append(key)
        
        return unique_keys
    
    def get_all_api_keys(self) -> List[str]:
        """Get all configured API keys."""
        return self.google_api_keys if self.google_api_keys else [self.google_api_key] if self.google_api_key else []
    
    def add_api_key(self, api_key: str):
        """Add an additional API key for quota management."""
        if api_key not in self.google_api_keys:
            self.google_api_keys.append(api_key)
    
    class Config:
        env_file = Path(__file__).parent.parent / ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Allow extra fields to be ignored instead of causing errors

# Initialize settings
settings = Settings()

def get_settings() -> Settings:
    """Return the singleton settings instance (backward-compatible accessor)."""
    return settings

# Add the user's API keys for quota management
user_api_keys = [
    "AIzaSyDYBKFLbGpvan_B0EGNIYaN8dx3u-FiuJM",
    "AIzaSyBpqATZY57uWrtQND_3_seQmV_HXUhpDUo", 
    "AIzaSyA0DIcVTY7hxsiwnQfBE7mecsOx4E-ozPs"
]

# Add the keys to the configuration
for key in user_api_keys:
    settings.add_api_key(key) 