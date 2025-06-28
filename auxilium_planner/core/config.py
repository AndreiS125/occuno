import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import Field

class Settings(BaseSettings):
    # Application settings
    app_name: str = "Auxilium Productivity Planner"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # API settings
    api_prefix: str = "/api/v1"
    
    # Data storage
    data_file_path: Path = Path(__file__).parent.parent / "data" / "user_data.json"
    
    # Gamification settings
    points_per_task: int = 10
    points_per_objective: int = 50
    streak_threshold_hours: int = 24
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Allow extra fields to be ignored instead of causing errors

settings = Settings() 