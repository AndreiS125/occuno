"""
Utility Tools for AI Agents

These tools provide utility functions:
- Get current time
- Planning tool for creating action plans
- Final response tool for completing agent interactions
"""

from datetime import datetime
import json
from typing import Any, Dict

from langchain_core.tools import tool
from core.logging_config import get_logger
from .objective_tools import safe_json_dumps

logger = get_logger("utility_tools")


@tool
async def get_current_time() -> str:
    """
    Get the current date and time.
    
    Returns:
        JSON string containing current date and time information
    """
    try:
        now = datetime.utcnow()
        local_now = datetime.now()
        
        time_info = {
            "utc_datetime": now.isoformat(),
            "local_datetime": local_now.isoformat(),
            "utc_date": now.strftime("%Y-%m-%d"),
            "local_date": local_now.strftime("%Y-%m-%d"),
            "utc_time": now.strftime("%H:%M:%S"),
            "local_time": local_now.strftime("%H:%M:%S"),
            "day_of_week": local_now.strftime("%A"),
            "month": local_now.strftime("%B"),
            "year": local_now.year,
            "timezone_info": {
                "utc_offset": str(local_now.utctimetuple().tm_hour - now.hour),
                "is_utc": False
            }
        }
        
        return safe_json_dumps(time_info, indent=2)
    
    except Exception as e:
        logger.error(f"Error getting current time: {e}")
        return safe_json_dumps({"error": f"Failed to get current time: {str(e)}"})


@tool
async def final_response(analysis: str, summary: str) -> str:
    """
    Used by the Planning Agent to provide detailed analysis and summary.
    This marks the end of the planning phase.
    
    Args:
        analysis: Detailed analysis including times, IDs, tasks, burnout assessment, etc.
        summary: Brief summary of the analysis for memory storage
    
    Returns:
        JSON string confirming the analysis was recorded
    """
    try:
        response_info = {
            "type": "planning_analysis_complete",
            "timestamp": datetime.utcnow().isoformat(),
            "analysis_provided": True,
            "summary_provided": True,
            "analysis_length": len(analysis),
            "summary_length": len(summary),
            "message": "Planning analysis complete. Proceeding to execution phase.",
            "metadata": {
                "agent": "Planning Agent",
                "phase": "Analysis Complete"
            },
            # Store the actual content for extraction
            "analysis_content": analysis,
            "summary_content": summary
        }
        
        logger.info(f"Planning Agent completed analysis (analysis: {len(analysis)} chars, summary: {len(summary)} chars)")
        
        return safe_json_dumps(response_info, indent=2)
    
    except Exception as e:
        logger.error(f"Error in final_response: {e}")
        return safe_json_dumps({"error": f"Failed to record analysis: {str(e)}"})


@tool  
async def plan(plan_details: str) -> str:
    """
    Used by the Executor Agent to create a detailed action plan.
    This is the first tool the executor should call.
    
    Args:
        plan_details: Detailed plan of actions to be taken
    
    Returns:
        JSON string with the plan details and continuation signal
    """
    try:
        logger.info(f"Executor Agent created action plan ({len(plan_details)} chars)")
        
        plan_response = {
            "type": "execution_plan_created",
            "timestamp": datetime.utcnow().isoformat(),
            "plan_provided": True,
            "plan_length": len(plan_details),
            "message": "Execution plan created successfully. Proceeding with implementation.",
            "metadata": {
                "agent": "Executor Agent",
                "phase": "Planning Complete"
            },
            # Store the actual plan content for display
            "plan_content": plan_details,
            "status": "Continue"
        }
        
        return safe_json_dumps(plan_response, indent=2)
    
    except Exception as e:
        logger.error(f"Error in plan tool: {e}")
        return safe_json_dumps({"error": f"Failed to create plan: {str(e)}"})


@tool
async def final_response_to_user(response_content: str, action_summary: str) -> str:
    """
    Provide the final response to the user and complete the agent interaction.
    
    Args:
        response_content: The main response content for the user
        action_summary: Summary of actions taken (optional)
    
    Returns:
        JSON string with the final response and metadata
    """
    try:
        final_response = {
            "type": "final_response",
            "timestamp": datetime.utcnow().isoformat(),
            "response_content": response_content,
            "action_summary": action_summary,
            "interaction_complete": True,
            "metadata": {
                "response_length": len(response_content),
                "has_action_summary": bool(action_summary),
                "completion_time": datetime.utcnow().isoformat()
            },
            # Store the actual content for extraction
            "response_content_data": response_content,
            "action_summary_content": action_summary
        }
        
        logger.info(f"Final response provided to user (length: {len(response_content)} chars)")
        
        return safe_json_dumps(final_response, indent=2)
    
    except Exception as e:
        logger.error(f"Error providing final response: {e}")
        return safe_json_dumps({"error": f"Failed to provide final response: {str(e)}"})


@tool
async def log_agent_action(agent_name: str, action: str, details: str = "") -> str:
    """
    Log an agent action for debugging and monitoring.
    
    Args:
        agent_name: Name of the agent (Planning or Executor)
        action: Action being performed
        details: Additional details about the action
    
    Returns:
        JSON string confirming the action was logged
    """
    try:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "agent": agent_name,
            "action": action,
            "details": details,
            "logged": True
        }
        
        logger.info(f"[{agent_name}] {action}" + (f" - {details}" if details else ""))
        
        return safe_json_dumps(log_entry, indent=2)
    
    except Exception as e:
        logger.error(f"Error logging agent action: {e}")
        return safe_json_dumps({"error": f"Failed to log action: {str(e)}"})


@tool
async def validate_date_format(date_string: str) -> str:
    """
    Validate and parse a date string to ensure it's in the correct format.
    
    Args:
        date_string: Date string to validate (should be ISO format)
    
    Returns:
        JSON string with validation results
    """
    try:
        # Try to parse the date string
        parsed_date = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        
        validation_result = {
            "valid": True,
            "original_string": date_string,
            "parsed_date": parsed_date.isoformat(),
            "formatted_date": parsed_date.strftime("%Y-%m-%d %H:%M:%S"),
            "date_only": parsed_date.strftime("%Y-%m-%d"),
            "time_only": parsed_date.strftime("%H:%M:%S"),
            "day_of_week": parsed_date.strftime("%A"),
            "is_future": parsed_date > datetime.utcnow(),
            "is_past": parsed_date < datetime.utcnow()
        }
        
        return safe_json_dumps(validation_result, indent=2)
    
    except ValueError as e:
        return safe_json_dumps({
            "valid": False,
            "original_string": date_string,
            "error": f"Invalid date format: {str(e)}",
            "expected_format": "ISO format (YYYY-MM-DDTHH:MM:SS)"
        }, indent=2)
    
    except Exception as e:
        logger.error(f"Error validating date: {e}")
        return safe_json_dumps({"error": f"Failed to validate date: {str(e)}"}) 