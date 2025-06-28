import type { Metadata } from "next";
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
  title: "Auxilium - Productivity Planner",
  description: "Plan, organize, and achieve your goals with smart task management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeLoader />
          <NotificationManager />
          <CalendarViewProvider>
            <div className="min-h-screen bg-background">
              <NavigationWrapper />
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </div>
          </CalendarViewProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'bg-card text-card-foreground border border-border',
              style: {
                background: 'var(--card)',
                color: 'var(--card-foreground)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
} 