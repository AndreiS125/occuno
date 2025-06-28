# LLM-Powered Productivity Planner: Architectural Plan

## 1. Overview

This document outlines the architecture for an LLM-powered planning, productivity, and time-management tool. The system is designed to be AI-first, leveraging LangChain and the Gemini API for its intelligent features. It will feature a FastAPI backend, a LangGraph-based multi-agent system for LLM orchestration, and initial data persistence via a single JSON file. Gamification is a core aspect, with scores and achievements calculated programmatically.

**Core Tenets:**
*   **AI-Driven Planning**: LLMs assist in decomposing objectives, scheduling, and providing insights.
*   **Gamification**: Encourage engagement through points, streaks, and achievements.
*   **Modular Design**: FastAPI for clear API boundaries, LangGraph for flexible agent workflows.
*   **Rich Context for LLMs**: Maximize LLM performance by providing comprehensive context.
*   **Iterative Development**: Start with a single-user model and file-based storage, allowing for future expansion.

## 2. Overall System Architecture

```
+-----------------+      +----------------------+      +------------------------+      +-----------------+
|   Frontend(s)   |<---->|   FastAPI Backend    |<---->| Agent Layer (LangGraph)|<---->| Data Store      |
| (Web, Mobile,   |      | (Python, Pydantic)   |      | (LangChain, Gemini API)|      | (JSON File)     |
|  Desktop - TBD) |      | - API Endpoints      |      | - Master Orchestrator  |      | - User Profile  |
+-----------------+      | - Business Logic     |      | - Specialized Agents   |      | - Objectives    |
                         | - Gamification Engine|      | - Agent Tools          |      | - Achievements  |
                         | - Data Validation    |      +------------------------+      +-----------------+
                         +----------------------+
```

*   **Frontend(s)**: (Future development) Various user interfaces will interact with the backend via a RESTful API.
*   **FastAPI Backend**:
    *   Exposes API endpoints for frontend interactions.
    *   Handles data validation using Pydantic.
    *   Contains non-LLM business logic (e.g., direct data manipulations).
    *   Hosts the Gamification Engine.
    *   Communicates with the Agent Layer for LLM-dependent tasks.
*   **Agent Layer (LangGraph)**:
    *   Manages the multi-agent system responsible for intelligent operations.
    *   Uses LangGraph to define and execute complex agent workflows.
    *   Integrates with Gemini API via LangChain.
    *   Agents use "Tools" to interact with the backend, data store, and each other.
*   **Data Store**:
    *   Initially, a single JSON file (`user_data.json`) storing all application data (user profile, objectives, achievements).
    *   Managed by a repository layer in the backend.

## 3. Data Models (Python Classes for JSON Serialization)

These models will be defined in `domain/models.py`.

```python
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from enum import Enum

# --- Enums ---
class ObjectiveType(str, Enum):
    ROOT = "ROOT" # A massive goal e.g. win a science fair
    SUB_OBJECTIVE = "SUB_OBJECTIVE" # a subobjective e.g. develop a prototype of the science fair
    EVENT = "TASK" # Actual thing, that has no subobjectives, e.g. "Code the agent logic for the prototype"
    HABIT = "HABIT" # Something that has to be done every day (or some other time) for some quantity e.g. do 20 pushups once every few days

class ObjectiveStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class EnergyLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

# --- Gamification Models ---
class AchievementDefinition:
    id: UUID
    name: str
    description: str
    criteria_code: str # Python code snippet or DSL to evaluate for unlocking
    icon: Optional[str] = None
    points_value: int = 0

class UserAchievement:
    achievement_id: UUID
    unlocked_at: datetime

class UserProfile:
    id: UUID = uuid4() # Assuming single user, but good practice
    username: str = "default_user"
    created_at: datetime = datetime.utcnow()
    
    # Gamification
    overall_score: int = 0
    current_streak_days: int = 0 # e.g., days with a completed major task
    last_streak_check_date: Optional[datetime] = None
    achievements: List[UserAchievement] = []
    
    # Preferences & Patterns (can be expanded by LLM insights later)
    preferred_work_hours: Optional[Dict[str, Any]] = None # e.g., {"start": "09:00", "end": "17:00"}

# --- Core Objective Models ---
class BaseObjective:
    id: UUID = uuid4()
    title: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    degree: int = 0 # Depth in the hierarchy
    objective_type: ObjectiveType
    
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    due_date: Optional[datetime] = None
    
    priority_score: float = 0.5 # Normalized 0-1, can be AI-adjusted
    complexity_score: float = 0.5 # Normalized 0-1, can be AI-adjusted
    energy_requirement: EnergyLevel = EnergyLevel.MEDIUM
    
    status: ObjectiveStatus = ObjectiveStatus.NOT_STARTED
    completion_percentage: float = 0.0 # 0-100
    
    context_tags: List[str] = []
    dependencies: List[UUID] = [] # IDs of objectives this one depends on
    
    # AI Planning Data
    ai_generated: bool = False
    decomposition_rationale: Optional[str] = None
    success_criteria: List[str] = []
    
    # Gamification Related
    points_awarded_for_completion: int = 0
    completion_timeliness_score: Optional[float] = None # e.g., -1 (late) to 1 (early)

    reccuring: "Information about how and when it is recurring"

class Objective(BaseObjective):
    objective_type: ObjectiveType = ObjectiveType.SUB_OBJECTIVE # Default, can be ROOT


class Task(BaseObjective):
    objective_type: ObjectiveType = ObjectiveType.EVENT
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None

    stimated_duration: Optional[timedelta] = None
    actual_duration: Optional[timedelta] = None
    actionable_steps: List[str] = []


# --- Data Store Structure (Conceptual for user_data.json) ---
# {
#   "user_profile": UserProfile,
#   "objectives": List[Union[Objective, Task, Event, Milestone]],
#   "achievement_definitions": List[AchievementDefinition]
# }
```

## 4. Data Flow Examples

**A. User Creates a New Objective (via API, LLM for decomposition):**
1.  **Frontend**: User submits "I want to learn Python for Data Science in 3 months".
2.  **FastAPI Backend (`/objectives/` POST endpoint)**:
    *   Validates input.
    *   Recognizes this might need decomposition.
    *   Prepares context: User profile, existing related objectives (if any), conversation history.
    *   Invokes `MasterOrchestratorAgent` in LangGraph with the request and context.
3.  **Agent Layer (LangGraph)**:
    *   `MasterOrchestratorAgent` receives task. Routes to `PlanningAgent`.
    *   `PlanningAgent` (using Gemini LLM):
        *   Receives system prompt, context, and user request.
        *   LLM decides to decompose.
        *   LLM AI Message: Calls `create_objective_tool` with data for "Phase 1: Python Basics".
        *   Tool Execution: `create_objective_tool` interacts with `ObjectiveRepository` to save the new sub-objective to `user_data.json`. Returns new objective ID.
        *   Tool Message (result) fed back to LLM.
        *   LLM continues, calls `create_objective_tool` for "Phase 2: NumPy & Pandas", etc.
        *   Finally, LLM generates a summary of the decomposed plan.
4.  **FastAPI Backend**:
    *   Receives the structured plan (list of new objectives) from the agent.
    *   Persists any final state if not already done by tools.
    *   Optionally, invokes `GamificationEngine` (e.g., award points for "Proactive Planning").
    *   Returns the new objective(s) and LLM summary to the frontend.

**B. User Marks a Task as Complete (Programmatic update & Gamification):**
1.  **Frontend**: User marks task "T123" as complete.
2.  **FastAPI Backend (`/tasks/{task_id}/complete` PUT endpoint)**:
    *   Validates `task_id`.
    *   Calls `ObjectiveService` to update the task's status to `COMPLETED` and set `completion_percentage` to 100 in `user_data.json`.
    *   Records `actual_duration` if provided.
    *   Calls `GamificationService.process_task_completion(task_id)`.
3.  **Gamification Engine (`GamificationService`)**:
    *   Retrieves task details.
    *   Calculates `completion_timeliness_score`.
    *   Awards base points for completion.
    *   Adds bonus/penalty based on timeliness.
    *   Updates `UserProfile.overall_score`.
    *   Checks if any achievements are unlocked by this completion (e.g., "Task Master: Complete 10 tasks").
    *   Updates `UserProfile.achievements` and `overall_score` if new achievements are unlocked.
    *   Updates `UserProfile.current_streak_days` and `last_streak_check_date`.
    *   Saves updated `UserProfile` to `user_data.json`.
4.  **FastAPI Backend**: Returns success response with updated task data and user score to frontend.

## 5. Agent Architecture with LangGraph

The agent system will be built using LangGraph, allowing for flexible and stateful multi-agent collaborations.

**LangGraph State:**
The graph will operate on a shared state object, which might include:
*   `current_user_query: str`
*   `conversation_history: List[Tuple[str, str]]` (user, ai messages)
*   `active_objective_ids: List[UUID]`
*   `user_profile_summary: Dict`
*   `scratchpad: Dict` (for inter-agent messages or temporary data)
*   `tool_call_request: Optional[Dict]`
*   `tool_call_response: Optional[Any]`
*   `final_response_for_user: Optional[str]`

**Nodes (Agents/Processors):**
1.  **`MasterOrchestratorNode`**:
    *   Entry point for user requests requiring LLM processing.
    *   Parses user intent.
    *   Routes to specialized agents (nodes) based on intent.
    *   Gathers results from other agents to formulate the final response.
    *   Manages conversation flow.

2.  **`PlanningAgentNode`**:
    *   Focus: Objective decomposition, strategic planning, defining success criteria.
    *   LLM-driven. Uses tools to create/modify objectives.
    *   Example tasks: "Break down 'Launch X' into sub-objectives."

3.  **`SchedulingAgentNode`**:
    *   Focus: Advising on time management, suggesting optimal times for tasks/events based on user patterns (future), energy levels, and deadlines.
    *   LLM-driven. Uses tools to fetch calendar data (if integrated) and objective details.
    *   Example tasks: "When is the best time to work on this high-focus task?"

4.  **`MonitoringAgentNode` (Future Enhancement)**:
    *   Focus: Proactive checks on progress, deadline reminders, identifying potential bottlenecks.
    *   Could be triggered periodically or by system events.

5.  **`ReflectionAgentNode` (Future Enhancement)**:
    *   Focus: Helping user review progress, learn from past performance, adjust strategies.
    *   LLM-driven. Example: "Let's review my progress this week."

6.  **`DataInteractionNode` (Programmatic)**:
    *   Not an LLM agent itself, but a node that executes tool calls identified by LLM agents (e.g., writing to the database, fetching data). This clearly separates LLM decision from action execution.

**Edges:**
Conditional edges in LangGraph will manage the flow:
*   `MasterOrchestratorNode` -> `PlanningAgentNode` (if intent is "plan" or "decompose").
*   `PlanningAgentNode` -> `DataInteractionNode` (if LLM requested a tool call like `create_objective`).
*   `DataInteractionNode` -> `PlanningAgentNode` (with tool execution result).
*   `PlanningAgentNode` -> `MasterOrchestratorNode` (when planning is complete).

**Agent Tools:**
Tools are Python functions that agents can "call". The LLM decides *which* tool to call and with *what* arguments. The LangGraph orchestrator executes the tool.

*   **Data Access Tools (e.g., in `agents/tools/data_access_tools.py`)**:
    * All objectives (and sub-items) will be passed to the llm context fully. No need to use tools.
 
*   **Data Modification Tools (e.g., in `agents/tools/objective_tools.py`)**:
    *   `create_objective(objective_data: dict) -> dict`: Creates a new objective. LLM provides the data. Backend service handles saving and returns the created object.
    *   `update_objective(objective_id: str, updates: dict) -> dict`: Modifies an existing objective.
    *   `delete_objective(objective_id: str) -> bool`.
    *   `mark_objective_status(objective_id: str, status: str, completion_percentage: Optional[float]=None) -> dict`: Specific tool for status changes.

*   **Gamification Interaction Tools (e.g., in `agents/tools/gamification_tools.py`)**:
    *   `get_user_score_and_achievements() -> dict`.
    *   `log_user_action_for_gamification(action_type: str, details: dict)`: For LLM to note an action that might have gamification implications if not directly tied to a CRUD operation (e.g., "User asked for a complex plan").

*   **System & Utility Tools (e.g., in `agents/tools/system_tools.py`)**:
    *   `get_current_datetime() -> str`. However, it is already provided in the system message. No need to call tools.
    *   `request_clarification_from_user(question: str) -> str`: (Special tool that routes back to user for more input).

**Inter-Agent Communication:**
Within LangGraph, one agent (node) can pass data to another agent through the shared graph state or the `MasterOrchestratorAgent` can explicitly route tasks sequentially. Direct "tool calls" from one agent to invoke another are also possible by designing tools that trigger other agent graphs/chains.

## 6. Gamification Engine

This is a programmatic module within the FastAPI backend (`services/gamification_service.py`).

**Responsibilities:**
*   Calculate and update user's `overall_score`.
*   Manage `current_streak_days`.
*   Unlock achievements based on predefined criteria.

**Scoring Logic (Examples - to be refined):**
*   **Task/Objective Completion**:
    *   Base points (e.g., +10 for a task, +50 for a major objective).
    *   Complexity bonus: `base_points * (1 + complexity_score)`.
    *   Priority bonus: `base_points * (1 + priority_score)`.
    *   Timeliness:
        *   On-time/Early: `+ (due_date - completion_date).days * points_per_day_early` (capped).
        *   Late: `- (completion_date - due_date).days * points_per_day_late` (capped).
*   **Streak Bonus**:
    *   +X points for each consecutive day a significant task (e.g., >1hr estimated, or high priority) is completed. Reset if a day is missed.
*   **Planning Actions**:
    *   +Y points for decomposing a complex objective.
    *   +Z points for setting due dates for all sub-tasks of an objective.

**Achievements (`achievement_definitions.json` or similar, loaded by the service):**
*   Example Definition:
    ```json
    {
      "id": "ACH_001",
      "name": "Morning Hustler",
      "description": "Complete 3 tasks before 9 AM in a single week.",
      "criteria_code": "user.completed_tasks_before_9am_this_week >= 3", // Simplified representation
      "points_value": 50
    }
    ```
*   The `GamificationService` will have methods that are called after relevant actions (e.g., `on_task_completed`, `on_objective_created`). These methods will check if any achievement criteria are met.

## 7. Core Features Summary

*   **Hierarchical Objective Management**: Root Objectives, Sub-Objectives, Tasks, Events, Milestones with unlimited decomposition.
*   **AI-Assisted Planning**: LLM-powered decomposition of large goals.
*   **AI-Assisted Scheduling Advice**: LLM suggestions for time management.
*   **Conversational Interface**: Interact with the system via natural language.
*   **Gamification**:
    *   Points system for actions and completions.
    *   Streaks for consistent engagement.
    *   Unlockable achievements.
*   **Analytics**: Display of scores, completed tasks, progress towards objectives (frontend TBD).
*   **Extra features (frontend only)** Pomodoro timer, website/app blocking integrations.

.

This explicit inclusion of tool calls and results in the history is critical for the LLM to maintain state and reasoning.

## 9. Proposed Directory Structure

```
auxilium_planner/
├── main.py                   # FastAPI app definition, startup, LangGraph wiring
├── api/
│   ├── __init__.py
│   ├── endpoints/            # FastAPI routers for different resources
│   │   ├── objectives_api.py
│   │   ├── user_api.py
│   │   └── gamification_api.py
│   └── schemas.py            # Pydantic models for API request/response validation
├── core/
│   ├── __init__.py
│   ├── config.py             # Application settings (e.g., API keys, file paths)
│   └── dependencies.py       # FastAPI dependencies
├── data/
│   └── user_data.json        # Initial data store
├── domain/
│   ├── __init__.py
│   ├── models.py             # Core Pydantic data models (Objective, UserProfile etc.)
│   └── enums.py              # Enumerations
├── agents/
│   ├── __init__.py
│   ├── agent_graph.py        # LangGraph definition and main state
│   ├── master_orchestrator_agent.py
│   ├── planning_agent.py
│   ├── scheduling_agent.py
│   ├── ... (other specialized agent nodes)
│   └── tools/                # Directory for agent tool functions
│       ├── __init__.py
│       ├── data_access_tools.py
│       ├── objective_manipulation_tools.py
│       └── system_utility_tools.py
|   └── prompts/              # Directory where prompt templates for agents lie in .md format
        ├── planning_prompt.txt
        ├──conversation_prompt.txt
├── services/                 # Business logic layer (non-LLM)
│   ├── __init__.py
│   ├── objective_service.py  # CRUD for objectives, interacts with repository
│   ├── user_profile_service.py
│   └── gamification_service.py # Calculates scores, unlocks achievements
├── repositories/             # Data access layer
│   ├── __init__.py
│   ├── file_repository.py    # Generic JSON file read/write logic
│   ├── objective_repository.py
│   └── user_profile_repository.py
├── tests/                    # Unit and integration tests
│   └── ...
├── .env                      # Environment variables (e.g., GEMINI_API_KEY)
├── requirements.txt
└── README.md                 # This architectural plan
```

## 10. Development Roadmap Hints (For the Implementing LLM)

1.  **Setup Core Structure**: Implement the directory layout, FastAPI basics, Pydantic models (`domain/models.py`).
2.  **Data Persistence**: Implement `repositories/file_repository.py` and specific repositories for objectives and user profile. Basic CRUD operations for objectives without LLM involvement.
3.  **Gamification Engine (Programmatic Part)**: Implement `services/gamification_service.py` with basic scoring and achievement logic. Create API endpoints to test this.
4.  **LangChain & LangGraph Setup**:
    *   Integrate Gemini API.
    *   Define initial `agent_graph.py` with `MasterOrchestratorNode` and one simple agent (e.g., an EchoAgent).
    *   Create basic data access tools.
5.  **Implement `PlanningAgent`**:
    *   Develop prompts for objective decomposition.
    *   Implement `create_objective_tool` and `update_objective_tool`.
    *   Wire it into the LangGraph.
    *   Connect FastAPI endpoint to trigger the `PlanningAgent`.
6.  **Build out other Agents and Tools**: Iteratively add `SchedulingAgent`, etc., and their respective tools.
7.  **Refine Context Management**: Ensure rich context is passed to all LLM calls.
8.  **Testing**: Add unit and integration tests throughout the development process.
9.  **Frontend Integration**: Once backend APIs are stable, a frontend can be developed.

This plan provides a comprehensive starting point. The implementing LLM should ask for clarifications if any part is ambiguous. The focus should be on modularity, clear separation of concerns, and leveraging LangChain/LangGraph effectively for the AI components. 