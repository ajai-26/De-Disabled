import heroEyeTech from "@/assets/hero-eye-tech.jpg";

const Showcase = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Top border glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Image showcase with glow effect */}
          <div className="relative rounded-2xl overflow-hidden glow-effect">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-transparent z-10" />
            
            <img 
              src={heroEyeTech} 
              alt="Eye tracking technology visualization - neural networks and digital interface representing accessible voting technology"
              className="w-full h-auto object-cover"
            />
            
            {/* Floating text overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20">
              <div className="max-w-2xl">
                <h3 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
                  Vision-Powered <span className="text-gradient">Accessibility</span>
                </h3>
                <p className="text-muted-foreground text-lg">
                  MediaPipe FaceMesh provides real-time eye tracking, enabling hands-free navigation 
                  and voting for users with motor impairments.
                </p>
              </div>
            </div>
          </div>

          {/* Dual interface cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="p-8 rounded-2xl bg-card-gradient border border-border hover-glow transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">Audio Mode</span>
              </div>
              <h4 className="font-display text-xl font-semibold text-foreground mb-3">
                Voice-Controlled Voting
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Navigate through candidates and cast your vote using natural speech commands. 
                Perfect for visually impaired users seeking complete independence in the voting booth.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card-gradient border border-border hover-glow transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-4 h-4 rounded-full bg-accent animate-pulse" />
                <span className="text-sm font-medium text-accent uppercase tracking-wider">Visual Mode</span>
              </div>
              <h4 className="font-display text-xl font-semibold text-foreground mb-3">
                Eye-Tracking Interface
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Select candidates by simply looking at them. Gaze detection with dwell-time confirmation 
                ensures accurate selections without any physical interaction required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Showcase;
