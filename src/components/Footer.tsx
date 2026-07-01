import { Eye, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-muted/30 border-t border-border">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-display text-xl font-bold text-foreground">Lumina</span>
                <span className="font-display text-xl font-bold text-gradient">X</span>
              </div>
            </div>

            {/* Tagline */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span className="text-sm">De-Disabled • Inclusion for Social Impact</span>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © 2025 Team LuminaX. Chennai Institute of Technology.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
