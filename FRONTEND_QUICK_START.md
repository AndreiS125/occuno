# Auxilium Complete Setup Guide

Quick guide to get both backend and frontend running in 5 minutes.

## Prerequisites

- Python 3.8+
- Node.js 18+
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Backend Setup

1. Navigate to backend directory:
```bash
cd auxilium_planner
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
```

5. Start the backend:
```bash
python main.py
```

Backend will be running at http://localhost:8000

## Frontend Setup

1. Open a new terminal and navigate to frontend:
```bash
cd auxilium-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
```

4. Start the frontend:
```bash
npm run dev
```

Frontend will be running at http://localhost:3000

## Verify Everything Works

1. Open http://localhost:3000 in your browser
2. You should see the Auxilium dashboard
3. Click "AI Assistant" to open the chat
4. Try: "Help me plan a project to learn Python in 3 months"
5. The AI will create objectives for you

## Quick Features Tour

### AI Chat
- Natural language planning: "Break down my goal to write a novel"
- Scheduling advice: "When should I work on my high-energy tasks?"
- Quick actions: "Create a task to review my progress weekly"

### Dashboard
- View all your objectives in a hierarchical tree
- Track completion progress
- See your gamification score and streak

### Quick Actions
- **New Objective**: Manually create goals
- **AI Planning**: Let AI decompose complex goals
- **Schedule Tasks**: Get AI scheduling recommendations
- **Quick Task**: Add simple one-off tasks

## Troubleshooting

### Backend Issues
- Ensure Python 3.8+ is installed
- Check GEMINI_API_KEY is set correctly
- Verify port 8000 is not in use

### Frontend Issues
- Ensure Node.js 18+ is installed
- Clear browser cache if styles look wrong
- Check console for API connection errors

### API Connection Issues
- Ensure backend is running before starting frontend
- Check NEXT_PUBLIC_API_URL in frontend .env.local
- Verify CORS is enabled in backend (it is by default)

## Next Steps

1. Create your first objective through the AI chat
2. Explore the hierarchical view of objectives
3. Complete tasks to earn points and maintain streaks
4. Use AI to break down complex goals into manageable tasks

Enjoy your AI-powered productivity journey! 🚀 