import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import GlobalBackground from "./components/GlobalBackground";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ProductProofStrip from "./components/ProductProofStrip";
import CoreValueSection from "./components/CoreValueSection";
import EvidenceSystemSection from "./components/EvidenceSystemSection";
import RepositoryIntelligenceSection from "./components/RepositoryIntelligenceSection";
import Developer360Section from "./components/Developer360Section";
import GrowthAnalyticsSection from "./components/GrowthAnalyticsSection";
import CareerIntelligenceSection from "./components/CareerIntelligenceSection";
import AiSection from "./components/AiSection";
import HowItWorksSection from "./components/HowItWorksSection";
import PrivacySecuritySection from "./components/PrivacySecuritySection";
import FinalCtaSection from "./components/FinalCtaSection";
import Footer from "./components/Footer";

// Auth
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

// Dashboard imports
import DashboardLayout from "./layouts/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Repositories from "./pages/dashboard/Repositories";
import RepositoryDetails from "./pages/dashboard/RepositoryDetails";
import Developer360 from "./pages/dashboard/Developer360";
import Skills from "./pages/dashboard/Skills";
import ProblemSolving from "./pages/dashboard/ProblemSolving";
import Credentials from "./pages/dashboard/Credentials";
import Growth from "./pages/dashboard/Growth";
import CareerReadiness from "./pages/dashboard/CareerReadiness";
import AiInsights from "./pages/dashboard/AiInsights";
import Settings from "./pages/dashboard/Settings";

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
          <CoreValueSection />
          <EvidenceSystemSection />
          <RepositoryIntelligenceSection />
          <Developer360Section />
          <GrowthAnalyticsSection />
          <CareerIntelligenceSection />
          <AiSection />
          <HowItWorksSection />
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
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Everything below requires a session. ProtectedRoute renders an
              Outlet, so the dashboard shell nests inside it. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="repositories" element={<Repositories />} />
              <Route path="repositories/:repoId" element={<RepositoryDetails />} />
              <Route path="developer-360" element={<Developer360 />} />
              <Route path="skills" element={<Skills />} />
              <Route path="problem-solving" element={<ProblemSolving />} />
              <Route path="credentials" element={<Credentials />} />
              <Route path="growth" element={<Growth />} />
              <Route path="career-readiness" element={<CareerReadiness />} />
              <Route path="ai-insights" element={<AiInsights />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
            </Route>
          </Route>

          {/* Fallback to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
