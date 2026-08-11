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
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Platform</h4>
            <ul className="flex flex-col gap-3 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              {["Product", "Repository Intelligence", "Developer 360", "Growth", "Career Readiness"].map(
                (l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-primary transition-colors duration-200">
                      {l}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Resources</h4>
              <ul className="flex flex-col gap-3 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                {["Documentation", "GitHub"].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-primary transition-colors duration-200">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Legal</h4>
              <ul className="flex flex-col gap-3 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                {["Privacy", "Terms"].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-primary transition-colors duration-200">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            © 2026 DevProof
          </span>
          <span className="text-xs font-light" style={{ color: "var(--text-tertiary)" }}>
            Real repositories • Measurable signals • Explainable insights
          </span>
        </div>
      </div>
    </footer>
  );
}
