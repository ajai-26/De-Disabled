import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Eye, Mic, Shield, ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import InitializationLoader from "./InitializationLoader";

const Hero = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGetStarted = () => {
    setIsLoading(true);
  };

  const handleLoadingComplete = () => {
    navigate("/vote");
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && <InitializationLoader onComplete={handleLoadingComplete} />}
      </AnimatePresence>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground)) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}
        />

        <div className="container relative z-10 px-4 py-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border-glow mb-8 animate-fade-up">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Inclusion for Social Impact</span>
            </div>

            {/* Main heading */}
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <span className="text-foreground">Lumina</span>
              <span className="text-gradient">X</span>
            </h1>

            <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-semibold text-foreground/90 mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              De-Disabled
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-up" style={{ animationDelay: '0.3s' }}>
              A browser-based electronic voting system with <span className="text-primary">zero server dependencies</span>. 
              Featuring voice commands, eye-tracking technology, and cryptographic security for 
              <span className="text-accent"> universal accessibility</span>.
            </p>

            {/* Feature icons */}
            <div className="flex flex-wrap justify-center gap-6 mb-12 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
                <Mic className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Voice Commands</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
                <Eye className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Eye Tracking</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Encrypted Ballots</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg font-semibold rounded-xl glow-effect transition-all duration-300 hover:scale-105 group"
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Get Started
              </Button>
              <Button 
                onClick={scrollToFeatures}
                size="lg"
                variant="outline"
                className="border-border hover:border-primary/50 px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                Explore Features
              </Button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
