import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

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
            ? "py-3 bg-black/60 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-3.5 text-white select-none group shrink-0"
            >
              <img
                src="/logo.png"
                alt="DevProof"
                className="w-16 h-16 rounded-lg object-cover transition-all group-hover:shadow-[0_0_24px_rgba(119,252,117,0.55)]"
              />
              <span className="text-3xl font-black tracking-tight group-hover:text-primary transition-colors">DevProof</span>
            </a>

            {/* Center nav links (Desktop) */}
            <div className="hidden lg:flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-1.5 py-1 backdrop-blur-xl shadow-inner">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[13px] font-medium px-4 py-1.5 rounded-full text-white/65 hover:text-white hover:bg-white/[0.08] transition-all whitespace-nowrap"
                  style={{ transitionDuration: "0.2s" }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right section (Desktop) */}
            <div className="hidden lg:flex items-center gap-5 shrink-0">
              <Link
                to="/login"
                className="text-[13px] font-medium text-white/60 hover:text-white transition-colors py-1"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 text-[13px] font-bold rounded-full px-5 py-2.5 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] shadow-[0_0_16px_rgba(119,252,117,0.25)] hover:shadow-[0_0_24px_rgba(119,252,117,0.45)] hover:brightness-115"
                style={{
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                <GithubIcon className="w-4 h-4" />
                Connect GitHub
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-white/70 hover:text-white transition-all rounded-lg hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 animate-fade-in" /> : <Menu className="w-5 h-5 animate-fade-in" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-2xl pt-24 px-8 lg:hidden flex flex-col justify-between pb-12"
          >
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xl font-medium text-white/75 hover:text-white transition-colors py-3.5 border-b border-white/[0.06]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <Link
                to="/login"
                className="text-base font-medium text-white/65 hover:text-white transition-colors text-center py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2.5 text-base font-semibold rounded-full py-4 transition-all duration-300 active:scale-[0.97] shadow-[0_0_20px_rgba(119,252,117,0.2)] text-center"
                style={{
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <GithubIcon className="w-5 h-5" />
                Connect GitHub
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
