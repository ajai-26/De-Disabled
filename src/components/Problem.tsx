import { AlertTriangle, Users, Server, Ban } from "lucide-react";

const Problem = () => {
  const problems = [
    {
      icon: Ban,
      title: "Exclusion of Citizens",
      description: "Traditional voting systems lack accessibility features, excluding citizens with disabilities from the democratic process."
    },
    {
      icon: Users,
      title: "15% Affected",
      description: "Approximately 15% of the global population has disabilities, yet most voting systems lack multimodal interfaces."
    },
    {
      icon: Server,
      title: "Complex Infrastructure",
      description: "Existing e-voting solutions require expensive backend infrastructure and raise security concerns."
    }
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Subtle glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">The Challenge</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Democracy Should Be <span className="text-gradient">Accessible to All</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Current voting systems create barriers that prevent millions from participating in their democratic right.
            </p>
          </div>

          {/* Problem cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((problem, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl bg-card-gradient border border-border hover-glow transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-6 group-hover:bg-destructive/20 transition-colors">
                  <problem.icon className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {problem.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {problem.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;
