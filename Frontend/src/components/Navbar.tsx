import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Github } from "lucide-react";
import { Button } from "./ui/button";

const NAV_LINKS = ["Product", "How It Works", "Intelligence", "Evidence", "For Developers"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "py-3 bg-black/60 backdrop-blur-xl border-b border-white/5"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-2 text-foreground text-xl font-bold tracking-tight select-none group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center transition-colors group-hover:bg-primary/20 group-hover:border-primary/40">
                <div className="w-3 h-3 bg-primary rounded-sm shadow-[0_0_12px_rgba(119,252,117,0.8)]" />
              </div>
              <span>DevProof</span>
            </a>

            {/* Center nav links (Desktop) */}
            <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1 backdrop-blur-md">
              {NAV_LINKS.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-sm font-medium px-4 py-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                >
                  {link}
                </a>
              ))}
            </div>

            {/* Right section (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="#signin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </a>
              <Button
                variant="default"
                className="rounded-full shadow-[0_0_15px_rgba(119,252,117,0.3)] hover:shadow-[0_0_25px_rgba(119,252,117,0.5)] transition-all flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                Connect GitHub
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-2xl pt-24 px-6 md:hidden flex flex-col"
          >
            <div className="flex flex-col gap-6 text-center">
              {NAV_LINKS.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-xl font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link}
                </a>
              ))}
              <div className="h-px w-full bg-white/10 my-4" />
              <a
                href="#signin"
                className="text-xl font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </a>
              <Button
                variant="default"
                size="lg"
                className="w-full rounded-full mt-4 flex items-center justify-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Github className="w-5 h-5" />
                Connect GitHub
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
