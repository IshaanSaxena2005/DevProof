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

export default function App() {
  return (
    <div className="relative min-h-screen font-sora antialiased">
      <GlobalBackground />

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
