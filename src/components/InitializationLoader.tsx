import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Mic, Shield, Cpu, CheckCircle } from "lucide-react";

interface InitializationLoaderProps {
  onComplete: () => void;
}

const InitializationLoader = ({ onComplete }: InitializationLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { icon: Eye, label: "Initializing Eye Tracking Module", sublabel: "MediaPipe FaceMesh" },
    { icon: Mic, label: "Loading Voice Recognition", sublabel: "Web Speech API" },
    { icon: Shield, label: "Establishing Secure Connection", sublabel: "Web Crypto API" },
    { icon: Cpu, label: "Preparing Voting Interface", sublabel: "Neural Processing" },
  ];

  useEffect(() => {
    const stepDuration = 1200;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
        }
        return Math.min(newProgress, 100);
      });
    }, (stepDuration * steps.length) / 100);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [onComplete, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-full h-full"
          >
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute inset-12 bg-accent/5 rounded-full blur-2xl" />
          </motion.div>
        </div>
        
        {/* Scanning lines */}
        <motion.div
          animate={{ y: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        />
      </div>

      <div className="relative z-10 w-full max-w-lg px-8">
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl font-bold mb-2">
            <span className="text-foreground">Lumina</span>
            <span className="text-gradient">X</span>
          </h1>
          <p className="text-sm text-muted-foreground">De-Disabled</p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            const Icon = step.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: index <= currentStep ? 1 : 0.3, 
                  x: 0 
                }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary/10 border-primary/50' 
                    : isComplete 
                      ? 'bg-card border-border' 
                      : 'bg-transparent border-border/50'
                }`}
              >
                <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? 'bg-primary/20' : isComplete ? 'bg-accent/20' : 'bg-muted'
                }`}>
                  {isComplete ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <CheckCircle className="w-5 h-5 text-accent" />
                    </motion.div>
                  ) : (
                    <>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      {isActive && (
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute inset-0 rounded-lg bg-primary/20"
                        />
                      )}
                    </>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.sublabel}</p>
                </div>
                {isActive && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">Initializing Systems</span>
            <span className="text-xs text-primary font-mono">{progress}%</span>
          </div>
        </div>

        {/* Matrix-style code rain effect */}
        <div className="absolute -bottom-20 left-0 right-0 h-20 overflow-hidden opacity-20 pointer-events-none">
          <div className="font-mono text-xs text-primary/50 whitespace-pre leading-tight animate-pulse">
            {`> init_facemesh_module()\n> load_speech_recognition()\n> encrypt_ballot_storage()\n> ready_for_input...`}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InitializationLoader;
