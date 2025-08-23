"use client";

import HeroSection from "./components/hero-section";
import ProblemAgitation from "./components/problem-agitation";
import SolutionReveal from "./components/solution-reveal";
import AiShowcase from "./components/ai-showcase-new";
import FeaturesSection from "./components/features-section-new";
import PlanningFeaturesDemo from "./components/planning-features-demo";
import PricingSection from "./components/pricing-section-new";
import FinalCTA from "./components/final-cta";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Prominent Background Grid Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
            linear-gradient(180deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Diagonal Lines */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 45px,
              rgba(59, 130, 246, 0.12) 45px,
              rgba(59, 130, 246, 0.12) 47px
            )
          `
        }} />
      </div>

      {/* Floating Dots Pattern */}
      <div className="absolute inset-0 opacity-25">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-primary rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection />
        <ProblemAgitation />
        <SolutionReveal />
        <AiShowcase />
        <FeaturesSection />
        <PlanningFeaturesDemo />
        <PricingSection />
        <FinalCTA />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Occuno</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered planning that actually works.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">&copy; 2024 Occuno. Built for productivity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 