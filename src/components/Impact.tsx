import { TrendingUp, Globe, DollarSign, Clock } from "lucide-react";

const Impact = () => {
  const stats = [
    {
      icon: Globe,
      value: "15%",
      label: "Global Population",
      description: "Citizens with disabilities who can now vote independently"
    },
    {
      icon: DollarSign,
      value: "$0",
      label: "Backend Cost",
      description: "Zero server infrastructure required"
    },
    {
      icon: Clock,
      value: "100%",
      label: "Client-Side",
      description: "Complete browser-based processing"
    },
    {
      icon: TrendingUp,
      value: "∞",
      label: "Scalability",
      description: "Deployable anywhere, anytime"
    }
  ];

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border-glow mb-6">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">Social Impact</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Transforming <span className="text-gradient">Democracy</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Empowering every citizen to exercise their fundamental right to vote, regardless of physical abilities.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl bg-card border border-border text-center hover-glow transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="w-7 h-7 text-primary" />
                </div>
                <p className="font-display text-4xl md:text-5xl font-bold text-gradient mb-2">
                  {stat.value}
                </p>
                <p className="font-display text-lg font-semibold text-foreground mb-2">
                  {stat.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>

          {/* Impact statement */}
          <div className="mt-16 p-8 md:p-12 rounded-2xl bg-card-gradient border border-border glow-effect">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                Expected Outcome
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A fully functional, accessible voting demonstration platform that enables 
                <span className="text-primary"> independent voting for all citizens</span> regardless of physical abilities, 
                while serving as an educational tool for UX researchers studying inclusive design patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Impact;
