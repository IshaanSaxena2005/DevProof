import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5 0-1.4-.5-2.5-1.5-3.4.1-.3.4-1.6-.1-3.3 0 0-1.2-.4-3.8 1.4a12.8 12.8 0 0 0-7 0C6.2 2.6 5 3 5 3c-.5 1.7-.2 3 .1 3.3C4.1 7.2 3.6 8.3 3.6 9.7c0 5 3 6.2 6 6.5-.4.4-.8 1-.9 2-.9.4-3.2.1-4.6-1.3 0 0-.8-1.5-2.2-1.5 0 0-1.4 0 0 1.3 1.2 1.5 2 3.2 2 3.2 1.4 2 4 1.5 4 1.5"/>
  </svg>
);

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Evidence", href: "#evidence" },
  { label: "Developers", href: "#career" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "py-3 bg-black/45 backdrop-blur-2xl border-b border-white/[0.08]"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <a
              href="/"
              className="flex items-center gap-2.5 text-white text-lg font-bold tracking-tight select-none group shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center transition-all group-hover:bg-primary/20 group-hover:border-primary/50 group-hover:shadow-[0_0_12px_rgba(119,252,117,0.3)]">
                <div className="w-3 h-3 bg-primary rounded-sm shadow-[0_0_8px_rgba(119,252,117,0.8)]" />
              </div>
              <span className="text-white">DevProof</span>
            </a>

            <div className="hidden lg:flex items-center gap-0.5 glass-chip px-2 py-1.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[13px] font-medium px-4 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-4 shrink-0">
              <a
                href="#signin"
                className="text-[13px] font-medium text-white/65 hover:text-white transition-colors"
              >
                Sign In
              </a>
              <button
                className="flex items-center gap-2 text-[13px] font-semibold rounded-full px-5 py-2 transition-all active:scale-[0.97] shadow-[0_0_14px_rgba(119,252,117,0.3)] hover:shadow-[0_0_22px_rgba(119,252,117,0.5)] hover:brightness-110"
                style={{
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                <GithubIcon className="w-4 h-4" />
                Connect GitHub
              </button>
            </div>

            <button
              className="lg:hidden p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-2xl pt-24 px-8 lg:hidden flex flex-col"
          >
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xl font-medium text-white/75 hover:text-white transition-colors py-3 border-b border-white/8"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <a
                href="#signin"
                className="text-base font-medium text-white/65 hover:text-white transition-colors text-center py-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </a>
              <button
                className="w-full flex items-center justify-center gap-2 text-base font-semibold rounded-full py-4 transition-all active:scale-[0.97]"
                style={{
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <GithubIcon className="w-5 h-5" />
                Connect GitHub
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
