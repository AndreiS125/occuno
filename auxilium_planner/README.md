# Auxilium - AI-Powered Productivity Planner

Auxilium is an intelligent productivity planning system that combines the power of Google's Gemini AI with LangGraph's multi-agent architecture to help you manage objectives, tasks, and time effectively. It features gamification elements to keep you motivated and engaged.

## Features

- **AI-Powered Planning**: Break down complex objectives into actionable tasks using intelligent agents
- **Smart Scheduling**: Get personalized scheduling advice based on energy levels and priorities
- **Hierarchical Objectives**: Organize goals with unlimited levels of sub-objectives and tasks
- **Gamification**: Earn points, maintain streaks, and unlock achievements
- **Conversational Interface**: Natural language interaction with specialized AI agents
- **RESTful API**: Full-featured API for integration with various frontends

## Architecture

Auxilium uses a multi-agent system built with LangGraph:

- **Master Orchestrator**: Routes requests to appropriate specialized agents
- **Planning Agent**: Handles objective decomposition and strategic planning
- **Scheduling Agent**: Provides time management and scheduling advice
- **Gamification System**: Tracks progress, awards points, and manages achievements

## Installation

1. Clone the repository:
```bash
cd /Users/andrei/auxilium/auxilium_planner
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env and add your Gemini API key
```

4. Run the application:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Key Endpoints

#### Agent Interaction
- `POST /api/v1/agent/chat` - Chat with the AI assistant
- `GET /api/v1/agent/conversation/{id}` - Get conversation history

#### Objectives Management
- `GET /api/v1/objectives` - List all objectives
- `POST /api/v1/objectives` - Create new objective
- `PUT /api/v1/objectives/{id}` - Update objective
- `POST /api/v1/objectives/{id}/complete` - Mark as complete

#### User & Gamification
- `GET /api/v1/user/profile` - Get user profile
- `GET /api/v1/user/gamification/stats` - Get gamification statistics

## Usage Examples

### Creating an Objective via AI
```bash
curl -X POST http://localhost:8000/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me plan a project to learn machine learning in 3 months"
  }'
```

### Getting Scheduling Advice
```bash
curl -X POST http://localhost:8000/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I work on today? I have high energy in the morning."
  }'
```

## Configuration

Key settings in `core/config.py`:
- `GEMINI_MODEL`: Gemini model to use (default: gemini-pro)
- `MAX_AGENT_ITERATIONS`: Maximum agent reasoning steps
- `POINTS_PER_TASK`: Base points for completing tasks
- `POINTS_PER_OBJECTIVE`: Base points for completing objectives

## Data Storage

Currently uses JSON file storage (`data/user_data.json`) for simplicity. The architecture supports easy migration to databases in the future.

## Development

### Project Structure
```
auxilium_planner/
├── agents/           # LangGraph agents and tools
├── api/              # FastAPI endpoints
├── core/             # Configuration and core utilities
├── domain/           # Data models
├── repositories/     # Data access layer
└── services/         # Business logic (gamification, etc.)
```

### Adding New Agents

1. Create agent prompt in `agents/prompts/`
2. Implement agent class in `agents/`
3. Add to agent graph in `agent_system.py`
4. Update orchestrator routing logic

## Future Enhancements

- Calendar integration (Google Calendar, Outlook)
- Mobile and desktop apps
- Multi-user support with authentication
- Advanced analytics and insights
- Voice interaction
- Database backend (PostgreSQL)
- Real-time collaboration features

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is open source and available under the MIT License. 