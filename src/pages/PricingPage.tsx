import { useState } from 'react';
import { motion } from 'motion/react';
import { AppleLogo, AppleButton } from '../components/Primitives';

function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      {/* Global Background Video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover pointer-events-none"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4" 
        />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-6xl mx-auto px-6 py-6"
      >
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <AppleLogo />
            <span className="font-semibold">Aura</span>
          </a>
          <div className="hidden md:flex gap-8">
            <a href="/" className="text-white/70 text-sm font-medium hover:text-white transition-colors">
              Back to Home
            </a>
          </div>
          <AppleButton />
        </div>
      </motion.nav>

      {/* Pricing Section */}
      <section className="c3-pricing-section">
        <svg className="absolute w-0 h-0">
          <filter id="c3-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.075" />
            </feComponentTransfer>
            <feComposite in2="SourceGraphic" operator="in" result="noise" />
            <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
          </filter>
        </svg>
        <div className="c3-watermark-container">
          <div className="c3-watermark-main">
            <span className="c3-watermark-line-1">Your email.</span>
            <span className="c3-watermark-line-2">Revitalized</span>
          </div>
        </div>
        <div className="c3-grid">
          {[
            {
              tier: 'Free',
              price: 'Free',
              desc: 'For creators taking their first steps with Forma.',
              features: [
                'Up to 3 projects in the cloud',
                'Image export up to 1080p',
                'Basic editing tools',
                'Free templates and icons',
                'Access via web and mobile app',
              ],
            },
            {
              tier: 'Standard',
              price: yearly ? '$99.99/y' : '$9.99/m',
              desc: 'For freelancers and small teams who need more freedom and flexibility.',
              features: [
                'Up to 50 projects in the cloud',
                'Export up to 4K',
                'Advanced editing toolkit',
                'Team collaboration (up to 5 members)',
                'Access to premium template library',
              ],
            },
            {
              tier: 'Pro',
              price: yearly ? '$199.99/y' : '$19.99/m',
              desc: 'For studios, agencies, and professional creators working with brands.',
              features: [
                'Unlimited projects',
                'Export up to 8K + animations',
                'AI-powered content generation tools',
                'Unlimited team members',
                'Brand customization',
              ],
              isPro: true,
            },
          ].map((plan) => (
            <div key={plan.tier} className={`c3-card ${plan.isPro ? 'c3-card-pro' : ''}`}>
              <p className="c3-tier-small">{plan.tier}</p>
              <p className="c3-tier-large">{plan.price}</p>
              <p className="c3-desc">{plan.desc}</p>
              <ul className="c3-list">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="c3-check">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>
          ))}
        </div>
        <div className="c3-toggle-wrap">
          <span className="text-sm text-white/70">Yearly</span>
          <button
            className={`c3-toggle ${yearly ? 'active' : ''}`}
            onClick={() => setYearly(!yearly)}
          >
            <div className="c3-toggle-knob" />
          </button>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-6">
            Ready to transform your inbox?
          </h2>
          <AppleButton />
        </motion.div>
      </section>
    </div>
  );
}

export default PricingPage;
