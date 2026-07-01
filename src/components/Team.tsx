import { Users, GraduationCap, Mail } from "lucide-react";

const Team = () => {
  const teamMembers = [
    { name: "Arul Aravind", role: "Team Leader" },
    { name: "Ajai Kumar", role: "Team Member" },
    { name: "Harish", role: "Team Member" },
    { name: "Asvat", role: "Team Member" },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Top border glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border-glow mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">The Innovators</span>
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Team <span className="text-gradient">LuminaX</span>
            </h2>
          </div>

          {/* Institution card */}
          <div className="p-8 rounded-2xl bg-card-gradient border border-border mb-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Chennai Institute of Technology
            </h3>
            <p className="text-muted-foreground mb-4">
              Machine Learning Track • Eduskills Academy
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a 
                href="mailto:arularavind.aiml2024@citchennai.net" 
                className="hover:text-primary transition-colors"
              >
                arularavind.aiml2024@citchennai.net
              </a>
            </div>
          </div>

          {/* Team grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl bg-secondary/30 border border-border hover:border-primary/30 transition-all duration-300 text-center"
              >
                {/* Avatar placeholder */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300">
                  <span className="font-display text-xl font-bold text-primary">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h4 className="font-display font-semibold text-foreground mb-1">
                  {member.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;
