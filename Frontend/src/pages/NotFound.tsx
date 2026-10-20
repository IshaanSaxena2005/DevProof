import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen font-sora antialiased bg-[#050505]">
      <Navbar />
      <main className="relative z-10 pt-32 pb-16">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">Page Not Found</h2>
          <p className="text-lg text-white/60 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold rounded-full px-6 py-3 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] shadow-[0_0_16px_rgba(119,252,117,0.25)] hover:shadow-[0_0_24px_rgba(119,252,117,0.45)]"
            style={{
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
