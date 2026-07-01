import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Showcase from "@/components/Showcase";
import Features from "@/components/Features";
import TechStack from "@/components/TechStack";
import Impact from "@/components/Impact";
import Team from "@/components/Team";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Problem />
      <Showcase />
      <Features />
      <TechStack />
      <Impact />
      <Team />
      <Footer />
    </main>
  );
};

export default Index;
