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
      {/* Premium Aurora Background */}
      <div className="absolute inset-0 aurora-bg" />

      {/* Soft noise for texture */}
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Occuno orbital motif (control + precision) */}
      <div className="pointer-events-none absolute inset-0">
        {/* Concentric control rings */}
        <div className="orbital-ring size-[1200px] -left-1/3 -top-1/4 rotate-12" />
        <div className="orbital-ring size-[900px] -right-1/4 -top-1/3 -rotate-6" />
        <div className="orbital-ring size-[700px] -left-16 bottom-[-280px] rotate-45" />
        {/* Complex paint-spill gradient shapes */}
        <div className="paint-spill-1 w-[680px] h-[480px] left-[5%] top-[8%]" />
        <div className="paint-spill-2 w-[520px] h-[620px] right-[8%] top-[15%]" />
        <div className="paint-spill-3 w-[740px] h-[560px] left-[60%] bottom-[-180px]" />
        <div className="paint-spill-4 w-[420px] h-[380px] left-[15%] bottom-[20%]" />
        {/* Additional paint-spill shapes */}
        <div className="paint-spill-1 w-[380px] h-[320px] right-[25%] top-[35%]" />
        <div className="paint-spill-2 w-[460px] h-[380px] left-[35%] top-[55%]" />
        <div className="paint-spill-3 w-[320px] h-[280px] right-[15%] bottom-[30%]" />
        <div className="paint-spill-4 w-[540px] h-[420px] left-[45%] top-[25%]" />
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
      <footer className="relative z-20 border-t border-border bg-background">
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