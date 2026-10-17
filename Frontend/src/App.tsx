import type { ReactElement, ReactNode } from "react";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import GlobalBackground from "./components/GlobalBackground";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ProductProofStrip from "./components/ProductProofStrip";
import CoreValueSection from "./components/CoreValueSection";
import RepositoryIntelligenceSection from "./components/RepositoryIntelligenceSection";
import Developer360Section from "./components/Developer360Section";
import GrowthCareerSection from "./components/GrowthCareerSection";
import AiSection from "./components/AiSection";
import HowItWorksSection from "./components/HowItWorksSection";
import PrivacySecuritySection from "./components/PrivacySecuritySection";
import FinalCtaSection from "./components/FinalCtaSection";
import Footer from "./components/Footer";

// Auth
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import {
  DASHBOARD_BASE,
  DASHBOARD_SECTIONS,
  DEMO_BASE,
  sectionPath,
  type DashboardSectionId,
} from "./demo/routes.mts";

// Dashboard imports
import DashboardLayout from "./layouts/DashboardLayout";

/**
 * Every page behind the landing page is lazily loaded.
 *
 * The landing page is the entry point for visitors who may never sign in, and
 * the dashboard pages plus demo fixtures were statically imported here — which
 * put all ten of them, their services and the sample dataset into the main
 * chunk every first paint downloaded. The Spline scene was already its own
 * lazy chunk (see GlobalBackground); this is the same idea one level up.
 *
 * `lazy()` keeps the compile-time exhaustiveness of SECTION_PAGES: a new
 * section id still fails to typecheck until it is listed below.
 */
const Login = lazy(() => import("./pages/Login"));
const DemoShell = lazy(() => import("./demo/DemoShell"));
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const Repositories = lazy(() => import("./pages/dashboard/Repositories"));
const RepositoryDetails = lazy(() => import("./pages/dashboard/RepositoryDetails"));
const Developer360 = lazy(() => import("./pages/dashboard/Developer360"));
const Skills = lazy(() => import("./pages/dashboard/Skills"));
const ProblemSolving = lazy(() => import("./pages/dashboard/ProblemSolving"));
const LearningAchievements = lazy(() => import("./pages/dashboard/LearningAchievements"));
const Growth = lazy(() => import("./pages/dashboard/Growth"));
const CareerReadiness = lazy(() => import("./pages/dashboard/CareerReadiness"));
const AiInsights = lazy(() => import("./pages/dashboard/AiInsights"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));

/** Spinner matching the session-restore one in ProtectedRoute. */
function RouteLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Loading page">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

/** Boundary for one lazily-loaded route element. */
function PageBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

/**
 * One page per section id. Both route tables read from this, so a section added to
 * `DASHBOARD_SECTIONS` fails to compile until it is mounted here — and the demo
 * and the authenticated dashboard therefore always render the same ten pages.
 *
 * The two tables below expand `DASHBOARD_SECTIONS` inline rather than through a
 * shared wrapper component: `<Routes>` only accepts `<Route>` children (a custom
 * component throws "is not a <Route> component"), so the map has to sit inside
 * each table.
 */
const SECTION_PAGES: Record<DashboardSectionId, ReactElement> = {
  overview: (
    <PageBoundary>
      <Overview />
    </PageBoundary>
  ),
  repositories: (
    <PageBoundary>
      <Repositories />
    </PageBoundary>
  ),
  "developer-360": (
    <PageBoundary>
      <Developer360 />
    </PageBoundary>
  ),
  skills: (
    <PageBoundary>
      <Skills />
    </PageBoundary>
  ),
  "problem-solving": (
    <PageBoundary>
      <ProblemSolving />
    </PageBoundary>
  ),
  learning: (
    <PageBoundary>
      <LearningAchievements />
    </PageBoundary>
  ),
  growth: (
    <PageBoundary>
      <Growth />
    </PageBoundary>
  ),
  "career-readiness": (
    <PageBoundary>
      <CareerReadiness />
    </PageBoundary>
  ),
  "ai-insights": (
    <PageBoundary>
      <AiInsights />
    </PageBoundary>
  ),
  settings: (
    <PageBoundary>
      <Settings />
    </PageBoundary>
  ),
};

function LandingPage() {
  return (
    <div className="relative min-h-screen font-sora antialiased">
      {/* Interactive Spline/WebGL — fixed continuous background */}
      <GlobalBackground />

      {/* Content scrolls above; Spline mouse events stay global */}
      <div className="relative z-10">
        <Navbar />
        <main>
          <HeroSection />
          <ProductProofStrip />
          <HowItWorksSection />
          <RepositoryIntelligenceSection />
          <CoreValueSection />
          <Developer360Section />
          <AiSection />
          <GrowthCareerSection />
          <PrivacySecuritySection />
          <FinalCtaSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Every route change starts at the top — the dashboard scrolls in a
            <main> container, which ScrollToTop resets explicitly. */}
        <ScrollToTop />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <PageBoundary>
                <Login />
              </PageBoundary>
            }
          />

          {/* Public demo.

              The same page components as the dashboard, mounted under /demo and
              wrapped in DemoProvider. These routes are deliberately *outside*
              ProtectedRoute: the demo is public because its route and its data
              are public, not because a guard was weakened. Nothing below
              /dashboard changed. */}
          <Route
            path={DEMO_BASE}
            element={
              <PageBoundary>
                <DemoShell />
              </PageBoundary>
            }
          >
            <Route index element={<Navigate to={sectionPath(DEMO_BASE, "overview")} replace />} />
            {DASHBOARD_SECTIONS.map((section) => (
              <Route key={section.id} path={section.id} element={SECTION_PAGES[section.id]} />
            ))}
            <Route
              path="repositories/:repoId"
              element={
                <PageBoundary>
                  <RepositoryDetails />
                </PageBoundary>
              }
            />
            <Route path="*" element={<Navigate to={sectionPath(DEMO_BASE, "overview")} replace />} />
          </Route>

          {/* Everything below requires a session. ProtectedRoute renders an
              Outlet, so the dashboard shell nests inside it. */}
          <Route element={<ProtectedRoute />}>
            <Route path={DASHBOARD_BASE} element={<DashboardLayout />}>
              <Route index element={<Navigate to={sectionPath(DASHBOARD_BASE, "overview")} replace />} />
              {DASHBOARD_SECTIONS.map((section) => (
                <Route key={section.id} path={section.id} element={SECTION_PAGES[section.id]} />
              ))}
              <Route path="repositories/:repoId" element={<PageBoundary><RepositoryDetails /></PageBoundary>} />
              <Route path="*" element={<Navigate to={sectionPath(DASHBOARD_BASE, "overview")} replace />} />
            </Route>
          </Route>

          {/* Fallback to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
