import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-white/[0.06] py-10 md:py-12 section-veil-strong">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-10">
          <div className="md:col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-2.5 text-white text-lg font-bold tracking-tight select-none">
              <div
                className="w-7 h-7 rounded-md border border-white/10 flex items-center justify-center"
                style={{ background: "rgba(119,252,117,0.1)" }}
              >
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--primary))" }} />
              </div>
              <span className="text-white">DevProof</span>
            </div>
            <p className="text-sm font-light max-w-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Developer Intelligence &amp; Growth Analytics Platform
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">Platform</h3>
            <ul className="flex flex-col gap-3 text-sm" style={{ color: "var(--text-tertiary)" }}>
              <li>
                <Link to="/product" className="hover:text-primary transition-colors duration-200">
                  Product
                </Link>
              </li>
              <li>
                <Link to="/repository-intelligence" className="hover:text-primary transition-colors duration-200">
                  Repository Intelligence
                </Link>
              </li>
              <li>
                <Link to="/developer-360" className="hover:text-primary transition-colors duration-200">
                  Developer 360
                </Link>
              </li>
              <li>
                <Link to="/growth" className="hover:text-primary transition-colors duration-200">
                  Growth
                </Link>
              </li>
              <li>
                <Link to="/career-readiness" className="hover:text-primary transition-colors duration-200">
                  Career Readiness
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">Resources</h3>
              <ul className="flex flex-col gap-3 text-sm" style={{ color: "var(--text-tertiary)" }}>
                <li>
                  <Link to="/documentation" className="hover:text-primary transition-colors duration-200">
                    Documentation
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/IshaanSaxena2005/DevProof"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors duration-200"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">Legal</h3>
              <ul className="flex flex-col gap-3 text-sm" style={{ color: "var(--text-tertiary)" }}>
                <li>
                  <Link to="/privacy" className="hover:text-primary transition-colors duration-200">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-primary transition-colors duration-200">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            © 2026 DevProof
          </span>
          <span className="text-xs font-light" style={{ color: "var(--text-tertiary)" }}>
            From claims to engineering evidence
          </span>
        </div>
      </div>
    </footer>
  );
}
