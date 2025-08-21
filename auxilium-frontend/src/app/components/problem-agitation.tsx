"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Brain, 
  Target,
  TrendingDown,
  AlertTriangle,
  ArrowDown,
  X
} from "lucide-react";

interface ProblemAgitationProps {
  className?: string;
}

export default function ProblemAgitation({ className }: ProblemAgitationProps) {
  const [currentProblem, setCurrentProblem] = useState(0);

  const problems = [
    {
      scenario: "Sunday Evening",
      time: "6:47 PM",
      thought: "I need to plan my week...",
      cascade: [
        "Open 5 different planning apps",
        "Spend 2 hours choosing the 'perfect' system", 
        "Get overwhelmed by options",
        "Give up and wing it Monday morning"
      ],
      impact: "Another week of reactive chaos"
    },
    {
      scenario: "Big Project Launch",
      time: "Monday Morning",
      thought: "This project is huge, where do I start?",
      cascade: [
        "Break down into 'phases'",
        "Get stuck on dependencies",
        "Research best practices for hours",
        "Still no clear next action"
      ],
      impact: "Deadline approaches, nothing shipped"
    },
    {
      scenario: "Career Change",
      time: "Late Night",
      thought: "I want to transition to tech...",
      cascade: [
        "Create massive learning plan",
        "Get paralyzed by skill requirements",
        "Bookmark 47 courses",
        "Never start any of them"
      ],
      impact: "Dreams stay dreams"
    }
  ];

  // Auto-cycle through problems
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProblem((prev) => (prev + 1) % problems.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={`py-24 px-6 bg-destructive/5 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl lg:text-6xl font-light leading-tight">
            <span className="text-foreground">
              The Planning
            </span>
            <br />
            <span className="text-destructive font-medium">
              Death Spiral
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            You're not lazy. You're not disorganized. You're trapped in the planning paradox that's stealing your potential.
          </p>
        </div>

        {/* Interactive Problem Cascade */}
        <div className="max-w-4xl mx-auto mb-16">
          {/* Scenario Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-card border border-border rounded-lg p-2 flex space-x-2">
              {problems.map((problem, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentProblem(index)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    currentProblem === index 
                      ? 'bg-destructive text-destructive-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {problem.scenario}
                </button>
              ))}
            </div>
          </div>

          {/* Problem Cascade Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProblem}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Initial Thought */}
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">
                  {problems[currentProblem].scenario} • {problems[currentProblem].time}
                </div>
                <div className="text-lg font-medium bg-card border border-border rounded-lg p-4 inline-block">
                  "{problems[currentProblem].thought}"
                </div>
              </div>

              {/* Cascade Steps */}
              <div className="space-y-4">
                {problems[currentProblem].cascade.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.3 }}
                    className="flex items-center space-x-4"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-destructive/20 rounded-full flex-shrink-0">
                      <span className="text-sm font-medium text-destructive">{index + 1}</span>
                    </div>
                    <div className="flex-1 bg-card border border-border rounded-lg p-4">
                      <p className="text-sm">{step}</p>
                    </div>
                    {index < problems[currentProblem].cascade.length - 1 && (
                      <ArrowDown className="w-4 h-4 text-destructive/60" />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Impact */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: problems[currentProblem].cascade.length * 0.3 }}
                className="text-center pt-6"
              >
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 inline-block">
                  <div className="flex items-center space-x-2 mb-2">
                    <X className="w-5 h-5 text-destructive" />
                    <span className="text-sm font-medium text-destructive uppercase tracking-wide">Result</span>
                  </div>
                  <p className="text-lg font-medium text-destructive">
                    {problems[currentProblem].impact}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* The Real Cost */}
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl lg:text-3xl font-medium">
              <span className="text-destructive">The Real Cost</span> of Planning Paralysis
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              While you're stuck in planning loops, others are building empires with AI.
            </p>
          </div>

          {/* Cost Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <Clock className="w-8 h-8 text-destructive mx-auto" />
              <h4 className="font-semibold text-destructive">5+ Hours Weekly</h4>
              <p className="text-sm text-muted-foreground">Lost to planning instead of doing</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <TrendingDown className="w-8 h-8 text-destructive mx-auto" />
              <h4 className="font-semibold text-destructive">Missed Opportunities</h4>
              <p className="text-sm text-muted-foreground">While competitors move fast</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
              <h4 className="font-semibold text-destructive">Decision Fatigue</h4>
              <p className="text-sm text-muted-foreground">Exhausted before you start</p>
            </div>
          </div>

          {/* Transition to Solution */}
          <div className="pt-8 space-y-4">
            <p className="text-xl font-medium">
              What if there was a better way?
            </p>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <ArrowDown className="w-6 h-6 text-primary" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
