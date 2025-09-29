from enum import Enum

class ObjectiveType(str, Enum):
    MAIN_OBJECTIVE = "main_objective"
    SUB_OBJECTIVE = "sub_objective"
    TASK = "task"
    HABIT = "habit"

class ObjectiveStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class EnergyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
