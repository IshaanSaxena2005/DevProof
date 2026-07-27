import { Button } from "./ui/button";

const NAV_LINKS = ["Services", "About Us", "Projects", "Team", "Contacts"] as const;

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="flex items-center justify-between px-8 lg:px-16 py-5">
        {/* Logo */}
        <a
          href="/"
          className="text-foreground text-xl font-semibold tracking-tight select-none"
          style={{ color: "hsl(var(--foreground))" }}
        >
          SENTINEL
        </a>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm uppercase tracking-widest transition-colors"
              style={{
                color: "hsl(var(--muted-foreground))",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color =
                  "hsl(var(--foreground))")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color =
                  "hsl(var(--muted-foreground))")
              }
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA button */}
        <Button
          variant="navCta"
          size="lg"
          className="hidden md:inline-flex rounded-lg uppercase text-xs tracking-widest px-6"
        >
          Get Quote
        </Button>
      </nav>
    </header>
  );
}
