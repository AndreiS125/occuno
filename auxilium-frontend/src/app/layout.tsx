import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { NavigationWrapper, CalendarViewProvider } from "@/components/layout/navigation";
import { Toaster } from "react-hot-toast";
import { ThemeLoader } from "@/components/theme-loader";
import { NotificationManager } from "@/components/notification-manager";
import { ConditionalLayout } from "@/components/layout/conditional-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auxilium - Advanced Productivity Planner",
  description: "Next-generation productivity command center with AI-powered task management, intelligent scheduling, and comprehensive goal tracking",
  keywords: ["productivity", "planning", "goals", "tasks", "calendar", "analytics"],
  authors: [{ name: "Auxilium Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#22c5c2" },
    { media: "(prefers-color-scheme: dark)", color: "#22c5c2" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          <ThemeLoader />
          <NotificationManager />
          
          <CalendarViewProvider>
            <div className="min-h-screen bg-background relative">
              {/* Simplified background - no interfering elements */}
              <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/5 pointer-events-none" />
              
              {/* Main content */}
              <div className="relative z-10">
                <NavigationWrapper />
                <ConditionalLayout>
                  {children}
                </ConditionalLayout>
              </div>
            </div>
          </CalendarViewProvider>
          
          {/* Enhanced toast notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'glass-card text-card-foreground border border-primary/20',
              style: {
                background: 'var(--glass-bg)',
                color: 'var(--card-foreground)',
                border: '1px solid rgba(34, 197, 194, 0.2)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              },
              duration: 4000,
              success: {
                iconTheme: {
                  primary: 'hsl(var(--primary))',
                  secondary: 'white',
                },
                style: {
                  border: '1px solid rgba(34, 197, 194, 0.4)',
                  boxShadow: '0 0 20px rgba(34, 197, 194, 0.3)',
                }
              },
              error: {
                iconTheme: {
                  primary: 'hsl(var(--destructive))',
                  secondary: 'white',
                },
                style: {
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
                }
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
} 