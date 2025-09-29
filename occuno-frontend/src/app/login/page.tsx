"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Zap, ArrowRight, Brain, Sparkles, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogle } = useAuth();


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 relative overflow-hidden">
      {/* Prominent Background Grid Pattern */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(180deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Diagonal Lines */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 35px,
              rgba(59, 130, 246, 0.15) 35px,
              rgba(59, 130, 246, 0.15) 37px
            )
          `
        }} />
      </div>

      {/* Curvy Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
          <defs>
            <linearGradient id="curve-gradient-login" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Top Curve */}
          <path
            d="M 0 100 Q 400 50 800 150 T 1200 100 L 1200 0 L 0 0 Z"
            fill="url(#curve-gradient-login)"
          />
          
          {/* Bottom Curve */}
          <path
            d="M 0 700 Q 400 750 800 650 T 1200 700 L 1200 800 L 0 800 Z"
            fill="url(#curve-gradient-login)"
          />
        </svg>
      </div>

      {/* Floating Dots Pattern */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="flex min-h-screen relative z-10">
        {/* Left side - Hero section */}
        <div className="flex-1 hidden lg:flex lg:flex-col lg:justify-center lg:px-12">
          <div className="max-w-xl mx-auto">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-6 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                Welcome Back to Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  AI Planning Hub
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Continue your journey towards effortless productivity and intelligent goal achievement.
              </p>
              
              <div className="grid grid-cols-1 gap-6 mt-8">
                {[
                  {
                    icon: Brain,
                    title: "Smart Planning",
                    description: "AI-powered task breakdown and scheduling",
                    color: "text-blue-600"
                  },
                  {
                    icon: Target,
                    title: "Goal Tracking",
                    description: "Real-time progress monitoring and insights",
                    color: "text-purple-600"
                  },
                  {
                    icon: Clock,
                    title: "Time Optimization",
                    description: "Intelligent calendar integration and planning",
                    color: "text-indigo-600"
                  },
                  {
                    icon: Sparkles,
                    title: "Adaptive AI",
                    description: "Learning system that improves with usage",
                    color: "text-violet-600"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex-shrink-0">
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/20 dark:border-gray-700/50">
              <div className="px-8 py-10">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Sign in to continue your planning journey
                  </p>
                </div>

                {/* Google OAuth Button (only login option) */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { loginWithGoogle(); }}
                  className="w-full flex items-center justify-center space-x-2 py-3 mb-6 bg-white/50 hover:bg-white/70 border-gray-200 dark:border-gray-600"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </Button>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Don't have an account?{' '}
                      <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">
                        Sign up
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
