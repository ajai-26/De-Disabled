import { Mic, Eye, Shield, Fingerprint, Wifi, Zap } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Mic,
      title: "Audio Voting",
      description: "Voice-controlled interface for visually impaired users. Navigate and cast votes entirely through natural speech commands.",
      highlight: "For Blind Users"
    },
    {
      icon: Eye,
      title: "Visual Voting",
      description: "Eye-tracking technology powered by MediaPipe FaceMesh. Vote with just your gaze, perfect for motor-impaired citizens.",
      highlight: "Eye Tracking"
    },
    {
      icon: Shield,
      title: "Cryptographic Security",
      description: "Browser Web Crypto API encrypts all ballots locally. Receive a verifiable receipt hash for complete transparency.",
      highlight: "Zero Trust"
    },
    {
      icon: Wifi,
      title: "Offline Capable",
      description: "100% client-side processing with localStorage. Deployable in rural areas without internet infrastructure.",
      highlight: "No Server"
    },
    {
      icon: Fingerprint,
      title: "User Authentication",
      description: "Secure authentication flow before interface selection. Ensures vote integrity and prevents fraud.",
      highlight: "Verified"
    },
    {
      icon: Zap,
      title: "Instant Deployment",
      description: "Zero backend costs with instant deployment. Scalable for institutions and accessibility research.",
      highlight: "Zero Cost"
    }
  ];

  return (
    <section id="features" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border-glow mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">Dual Interface System</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Universal <span className="text-gradient">Accessibility</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vote through voice commands, eye movements, or traditional clicks – ensuring every citizen can participate independently.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative p-8 rounded-2xl bg-card border border-border hover-glow transition-all duration-300 overflow-hidden"
              >
                {/* Highlight badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {feature.highlight}
                  </span>
                </div>

                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
