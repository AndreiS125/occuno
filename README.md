# Auxilium - AI-Powered Productivity Planner

<div align="center">

![Auxilium Logo](https://img.shields.io/badge/Auxilium-AI%20Productivity%20Planner-blue?style=for-the-badge&logo=robot)

**Your personal AI secretary who knows you better than you know yourself**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

## 🚀 Overview

Auxilium is an intelligent productivity planning system that combines the power of Google's Gemini AI with LangGraph's multi-agent architecture to help you manage objectives, tasks, and time effectively. Think of it as your personal AI secretary who understands your goals, energy patterns, and helps you stay motivated through gamification.

### ✨ Key Features

- **🤖 AI-Powered Planning**: Break down complex objectives into actionable tasks using intelligent agents
- **🧠 Smart Scheduling**: Get personalized scheduling advice based on energy levels and priorities
- **🌳 Hierarchical Objectives**: Organize goals with unlimited levels of sub-objectives and tasks
- **🏆 Gamification**: Earn points, maintain streaks, and unlock achievements
- **💬 Conversational Interface**: Natural language interaction with specialized AI agents
- **🎨 Beautiful UI**: Apple-inspired design with smooth animations and dark mode
- **📱 Responsive**: Works beautifully on all device sizes
- **🔄 RESTful API**: Full-featured API for integration with various frontends

## 🏗️ Architecture

Auxilium uses a modern, scalable architecture:

```
┌─────────────────┐    ┌──────────────────────┐    ┌────────────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   FastAPI Backend    │◄──►│ Agent Layer (LangGraph)│◄──►│ Data Store      │
│ (Next.js 14)    │    │ (Python, Pydantic)   │    │ (LangChain, Gemini API)│    │ (JSON File)     │
│ - React/TS      │    │ - API Endpoints      │    │ - Master Orchestrator  │    │ - User Profile  │
│ - Tailwind CSS  │    │ - Business Logic     │    │ - Specialized Agents   │    │ - Objectives    │
│ - Framer Motion │    │ - Gamification Engine│    │ - Agent Tools          │    │ - Achievements  │
└─────────────────┘    │ - Data Validation    │    └────────────────────────┘    └─────────────────┘
                       └──────────────────────┘
```

### 🤖 Multi-Agent System

- **Master Orchestrator**: Routes requests to appropriate specialized agents
- **Planning Agent**: Handles objective decomposition and strategic planning
- **Executor Agent**: Manages task creation, updates, and execution
- **Gamification System**: Tracks progress, awards points, and manages achievements

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd auxilium
```

### 2. Backend Setup

```bash
cd auxilium_planner

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Start the backend
python main.py
```

Backend will be running at http://localhost:8000

### 3. Frontend Setup

```bash
cd auxilium-frontend

# Install dependencies
npm install

# Set up environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local

# Start the frontend
npm run dev
```

Frontend will be running at http://localhost:3000

### 4. Verify Everything Works

1. Open http://localhost:3000 in your browser
2. You should see the Auxilium dashboard
3. Click "AI Assistant" to open the chat
4. Try: "Help me plan a project to learn Python in 3 months"

## 📖 Usage Examples

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

## 🎯 Key Features in Detail

### AI Chat Interface
- **Natural Language Planning**: "Break down my goal to write a novel"
- **Scheduling Advice**: "When should I work on my high-energy tasks?"
- **Quick Actions**: "Create a task to review my progress weekly"

### Dashboard
- **Hierarchical View**: Visual tree structure for goals and tasks
- **Progress Tracking**: Real-time completion statistics
- **Gamification**: Points, streaks, and achievements display

### Objective Management
- **Unlimited Hierarchy**: Create objectives within objectives
- **Energy Levels**: Tag tasks with energy requirements
- **Dependencies**: Link tasks that depend on each other
- **Status Tracking**: Track progress from planning to completion

## 🛠️ Development

### Project Structure

```
auxilium/
├── auxilium_planner/          # Backend (Python/FastAPI)
│   ├── agents/               # LangGraph agents and tools
│   ├── api/                  # FastAPI endpoints
│   ├── core/                 # Configuration and core utilities
│   ├── domain/               # Data models
│   ├── repositories/         # Data access layer
│   └── services/             # Business logic
├── auxilium-frontend/        # Frontend (Next.js/React)
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utility functions
│   │   └── types/           # TypeScript definitions
│   └── public/              # Static assets
└── docs/                    # Documentation
```

### API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

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

## 🎨 Design System

The frontend follows Apple's Human Interface Guidelines with:
- **Colors**: Dynamic color system with light/dark mode support
- **Typography**: System fonts (-apple-system, SF Pro Display)
- **Spacing**: Consistent 4px grid system
- **Animations**: Smooth, spring-based animations using Framer Motion
- **Components**: Glass morphism effects, subtle shadows, and gradients

## 🔧 Configuration

### Backend Configuration (`auxilium_planner/core/config.py`)
- `GEMINI_MODEL`: Gemini model to use (default: gemini-pro)
- `MAX_AGENT_ITERATIONS`: Maximum agent reasoning steps
- `POINTS_PER_TASK`: Base points for completing tasks
- `POINTS_PER_OBJECTIVE`: Base points for completing objectives

### Frontend Configuration
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000/api/v1)

## 🗄️ Data Storage

Currently uses JSON file storage (`auxilium_planner/data/user_data.json`) for simplicity. The architecture supports easy migration to databases in the future.

## 🚀 Future Enhancements

- **Calendar Integration**: Google Calendar, Outlook
- **Mobile Apps**: iOS and Android applications
- **Multi-user Support**: Authentication and collaboration features
- **Advanced Analytics**: Detailed insights and progress reports
- **Voice Interaction**: Voice commands and responses
- **Database Backend**: PostgreSQL integration
- **Real-time Features**: Live collaboration and updates

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines

1. Follow the existing code patterns and architecture
2. Maintain TypeScript type safety in the frontend
3. Use Tailwind CSS for styling
4. Add proper loading and error states
5. Ensure responsive design
6. Write tests for new features

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Google Gemini API** for powerful AI capabilities
- **LangChain** for the multi-agent framework
- **FastAPI** for the robust backend API
- **Next.js** for the modern frontend framework
- **Tailwind CSS** for the beautiful design system

---

<div align="center">

**Start your AI-powered productivity journey today! 🚀**

[Get Started](#quick-start) • [View Demo](#) • [Report Issues](https://github.com/your-repo/issues)

</div>