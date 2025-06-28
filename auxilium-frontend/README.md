# Auxilium Frontend

A modern, Apple-inspired web interface for the Auxilium AI Productivity Planner.

## Features

- 🎨 **Apple-like Design**: Clean, minimalist interface with smooth animations
- 🤖 **AI Chat Interface**: Natural language interaction with your productivity assistant
- 📊 **Dashboard**: Real-time statistics and progress tracking
- 🎯 **Hierarchical Objectives**: Visual tree structure for goals and tasks
- 🏆 **Gamification**: Points, streaks, and achievements
- 🌓 **Dark Mode**: Automatic theme switching based on system preferences
- 📱 **Responsive**: Works beautifully on all device sizes

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Apple-inspired design system
- **State Management**: React Query (TanStack Query)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: Custom components with Radix UI primitives

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on http://localhost:8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Design System

The design follows Apple's Human Interface Guidelines with:

- **Colors**: Dynamic color system with light/dark mode support
- **Typography**: System fonts (-apple-system, SF Pro Display)
- **Spacing**: Consistent 4px grid system
- **Animations**: Smooth, spring-based animations
- **Components**: Glass morphism effects, subtle shadows, and gradients

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── chat/        # AI chat interface
│   ├── dashboard/   # Dashboard components
│   ├── gamification/# Score and achievement components
│   ├── objectives/  # Objective management components
│   └── ui/          # Reusable UI components
├── lib/             # Utility functions and API client
├── hooks/           # Custom React hooks
└── types/           # TypeScript type definitions
```

## Key Components

### Dashboard
- Real-time statistics grid
- Quick action cards for common tasks
- Hierarchical objective tree view

### AI Chat Interface
- Slide-out panel design
- Message history with role indicators
- Loading states and error handling
- Toast notifications for actions

### Objective Management
- Expandable tree structure
- Status badges and progress bars
- Energy level indicators
- Due date tracking

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api/v1` |

## Contributing

1. Follow the existing design patterns
2. Maintain TypeScript type safety
3. Use Tailwind CSS for styling
4. Add proper loading and error states
5. Ensure responsive design

## License

Part of the Auxilium Productivity Planner project. 