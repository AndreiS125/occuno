"use client";

import HeroSection from "../components/hero-section";
import ProblemAgitation from "../components/problem-agitation";
import SolutionReveal from "../components/solution-reveal";
import AiShowcase from "../components/ai-showcase-new";
import FeaturesSection from "../components/features-section-new";
import PlanningFeaturesDemo from "../components/planning-features-demo";
import PricingSection from "../components/pricing-section-new";
import FinalCTA from "../components/final-cta";

export default function LandingTestPage() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Main Content */}
      <main>
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
              <h3 className="text-lg font-medium">Auxilium</h3>
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
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">&copy; 2024 Auxilium. Built for productivity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
