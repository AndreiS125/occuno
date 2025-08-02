"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import HeroSection from "./components/hero-section";
import ProblemSection from "./components/problem-section";
import AiShowcase from "./components/ai-showcase";
import FeaturesSection from "./components/features-section";
import PricingSection from "./components/pricing-section";
import CTASection from "./components/cta-section";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Simplified scroll animations
  useGSAP(() => {
    // Simple reveal animations for sections
    gsap.utils.toArray(".landing-section").forEach((section: any) => {
      gsap.fromTo(section,
        {
          opacity: 0,
          y: 50
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 90%",
            end: "top 60%",
            toggleActions: "play none none none",
          },
        }
      );
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection className="landing-section" />
        <ProblemSection className="landing-section" />
        <AiShowcase className="landing-section" />
        <FeaturesSection className="landing-section" />
        <PricingSection className="landing-section" />
        <CTASection className="landing-section" />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gradient">Auxilium</h3>
              <p className="text-muted-foreground">
                AI-powered planning that thinks 10 steps ahead.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/30 text-center text-muted-foreground">
            <p>&copy; 2024 Auxilium. Built for the future of productivity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 