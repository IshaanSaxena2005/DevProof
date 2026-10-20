import { ReactNode } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface PublicPageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function PublicPageLayout({ children, title, description }: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen font-sora antialiased bg-[#050505]">
      <Navbar />
      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <header className="mb-12">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-primary transition-colors mb-6"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{title}</h1>
            {description && (
              <p className="text-lg text-white/60 max-w-2xl leading-relaxed">{description}</p>
            )}
          </header>
          <div className="prose prose-invert prose-lg max-w-none">{children}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
