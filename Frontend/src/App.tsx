import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Login from "./pages/Login";
import DemoShell from "./demo/DemoShell";
import {
  DASHBOARD_BASE,
  DASHBOARD_SECTIONS,
  DEMO_BASE,
  sectionPath,
  type DashboardSectionId,
} from "./demo/routes.mts";

// Dashboard imports
import DashboardLayout from "./layouts/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Repositories from "./pages/dashboard/Repositories";
import RepositoryDetails from "./pages/dashboard/RepositoryDetails";
import Developer360 from "./pages/dashboard/Developer360";
import Skills from "./pages/dashboard/Skills";
import ProblemSolving from "./pages/dashboard/ProblemSolving";
import LearningAchievements from "./pages/dashboard/LearningAchievements";
import Growth from "./pages/dashboard/Growth";
import CareerReadiness from "./pages/dashboard/CareerReadiness";
import AiInsights from "./pages/dashboard/AiInsights";
import Settings from "./pages/dashboard/Settings";

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
  overview: <Overview />,
  repositories: <Repositories />,
  "developer-360": <Developer360 />,
  skills: <Skills />,
  "problem-solving": <ProblemSolving />,
  learning: <LearningAchievements />,
  growth: <Growth />,
  "career-readiness": <CareerReadiness />,
  "ai-insights": <AiInsights />,
  settings: <Settings />,
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
          <Route path="/login" element={<Login />} />

          {/* Public demo.

              The same page components as the dashboard, mounted under /demo and
              wrapped in DemoProvider. These routes are deliberately *outside*
              ProtectedRoute: the demo is public because its route and its data
              are public, not because a guard was weakened. Nothing below
              /dashboard changed. */}
          <Route path={DEMO_BASE} element={<DemoShell />}>
            <Route index element={<Navigate to={sectionPath(DEMO_BASE, "overview")} replace />} />
            {DASHBOARD_SECTIONS.map((section) => (
              <Route key={section.id} path={section.id} element={SECTION_PAGES[section.id]} />
            ))}
            <Route path="repositories/:repoId" element={<RepositoryDetails />} />
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
              <Route path="repositories/:repoId" element={<RepositoryDetails />} />
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
