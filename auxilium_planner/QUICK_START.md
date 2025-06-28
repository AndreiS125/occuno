# Auxilium Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Prerequisites
- Python 3.8 or higher
- Gemini API key from Google AI Studio

### 2. Setup

```bash
# Navigate to the project directory
cd /Users/andrei/auxilium/auxilium_planner

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp env.example .env
```

### 3. Configure API Key

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### 4. Verify Setup

```bash
python test_setup.py
```

### 5. Start the Server

```bash
python main.py
```

The API will be available at: http://localhost:8000

### 6. Test the API

Open http://localhost:8000/docs for interactive API documentation.

## 🎯 First Steps

### 1. Chat with the AI Assistant

```bash
curl -X POST http://localhost:8000/api/v1/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me plan a project to build a mobile app"
  }'
```

### 2. View Your Profile

```bash
curl http://localhost:8000/api/v1/user/profile
```

### 3. List Your Objectives

```bash
curl http://localhost:8000/api/v1/objectives
```

## 🎮 Using the System

### Planning Example
"I want to learn Python programming in 2 months"
- The AI will break this down into phases
- Create sub-objectives for each phase
- Suggest specific tasks with deadlines

### Scheduling Example
"What should I focus on today?"
- The AI will look at your objectives
- Consider priorities and deadlines
- Suggest an optimal schedule

### Quick Commands
- "Plan: [your goal]" - Create and decompose an objective
- "Schedule today" - Get today's schedule
- "Mark [task] complete" - Complete a task
- "Show my progress" - View gamification stats

## 🏆 Gamification

- **Points**: Earn points for completing tasks
- **Streaks**: Maintain daily productivity streaks
- **Achievements**: Unlock achievements for milestones

## 🔧 Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY not found"**
   - Make sure your .env file exists
   - Check the API key is correctly set

2. **"Import error"**
   - Run `pip install -r requirements.txt` again
   - Make sure you're in the correct directory

3. **"Connection refused"**
   - Check if the server is running
   - Verify port 8000 is not in use

### Need Help?

- Check the full README.md
- Review API docs at http://localhost:8000/docs
- Look at example requests in the API documentation

## 🚀 Next Steps

1. Explore the API endpoints
2. Try different planning scenarios
3. Set up your preferences
4. Start tracking your objectives!

Happy planning with Auxilium! 🎯 