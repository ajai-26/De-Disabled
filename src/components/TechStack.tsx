import { Code2, Layers, Cpu, Database } from "lucide-react";

const TechStack = () => {
  const technologies = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Language" },
    { name: "MediaPipe", category: "Vision AI" },
    { name: "Web Speech API", category: "Voice" },
    { name: "Web Crypto API", category: "Security" },
    { name: "localStorage", category: "Storage" },
  ];

  const workflow = [
    {
      icon: Layers,
      step: "Input",
      description: "User authentication → Interface selection (Audio/Visual)"
    },
    {
      icon: Cpu,
      step: "Process",
      description: "MediaPipe FaceMesh tracks eye movements; Web Speech API handles voice commands"
    },
    {
      icon: Database,
      step: "Output",
      description: "Encrypted vote with verifiable receipt hash; Admin dashboard displays real-time analytics"
    }
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Top border glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border-glow mb-6">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">Architecture</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Built with <span className="text-gradient">Modern Tech</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Leveraging cutting-edge browser APIs for a completely serverless, secure voting experience.
            </p>
          </div>

          {/* Workflow visualization */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {workflow.map((item, index) => (
              <div key={index} className="relative">
                <div className="p-8 rounded-2xl bg-card-gradient border border-border h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-display font-bold text-primary">{String(index + 1).padStart(2, '0')}</span>
                      <span className="text-lg font-display font-semibold text-foreground">{item.step}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
                
                {/* Connector line */}
                {index < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-border to-primary/30" />
                )}
              </div>
            ))}
          </div>

          {/* Tech badges */}
          <div className="flex flex-wrap justify-center gap-4">
            {technologies.map((tech, index) => (
              <div 
                key={index}
                className="group px-6 py-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105"
              >
                <div className="text-center">
                  <p className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                    {tech.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tech.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechStack;
