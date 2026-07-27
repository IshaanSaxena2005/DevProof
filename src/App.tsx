import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Search, Sparkles, Menu, Reply, Forward, Archive, Trash2, MoreHorizontal, Paperclip, ChevronRight
} from 'lucide-react';
import { AppleLogo, LogoMark, AppleButton, SectionEyebrow } from './components/Primitives';

const gradientStyle = {
  backgroundImage: 'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  filter: 'url(#c3-noise)',
};

function App() {
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

      {/* Vertical Guide Lines */}
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-white/10 z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-white/10 z-[5]" />

      {/* Root SVG Noise Filter */}
      <svg className="absolute w-0 h-0">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      {/* Section 1 - Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-6xl mx-auto px-6 py-6"
      >
        <div className="flex items-center justify-between">
          <LogoMark />
          <div className="hidden md:flex gap-8">
            {['Solutions', 'Blog', 'Documentation', 'Careers'].map((link, i) => (
              <motion.a
                key={link}
                href="#"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="text-white/70 text-sm font-medium hover:text-white transition-colors"
              >
                {link}
              </motion.a>
            ))}
            <Link
              to="/pricing"
              className="text-white/70 text-sm font-medium hover:text-white transition-colors"
            >
              Pricing
            </Link>
          </div>
          <div className="hidden md:block">
            <AppleButton />
          </div>
          <button className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </motion.nav>

      {/* Section 2 - Hero */}
      <section className="pt-16 md:pt-28 pb-20 text-center flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-7xl font-semibold tracking-tight leading-[0.9]"
        >
          Your email.
          <br />
          <span className="animate-shiny" style={gradientStyle}>
            Revitalized
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-white/60 max-w-md text-base leading-[1.5]"
        >
          Aura is the premier inbox platform for the current era. It leverages powerful AI to organize, prioritize, and refine your messages into total clarity.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <AppleButton />
          <span className="text-xs text-white/40">Download for Intel / Apple Silicon</span>
        </motion.div>
      </section>

      {/* Section 3 - macOS Menu Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="h-10 bg-black/40 backdrop-blur-md border-t border-b border-white/10"
      >
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <AppleLogo className="w-3.5 h-3.5" />
            <span className="font-semibold">Aura</span>
            {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((item, i) => (
              <span
                key={item}
                className={`text-white/70 hover:text-white cursor-pointer ${
                  i > 2 ? 'hidden sm:inline' : ''
                } ${i > 3 ? 'hidden md:inline' : ''}`}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Search className="w-3.5 h-3.5" />
            <span className="text-white/70">Wed May 6 1:09 PM</span>
          </div>
        </div>
      </motion.div>

      {/* Section 4 - Inbox Mockup */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl"
        >
          {/* Title Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-xs text-white/50">Aura — Inbox</span>
          </div>
          {/* Body */}
          <div className="grid grid-cols-12 h-[520px]">
            {/* Sidebar */}
            <div className="col-span-3 border-r border-white/10 bg-black/30 p-4">
              <button className="w-full rounded-lg bg-white text-black text-xs font-semibold px-3 py-2 flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-4 h-4" />
                Compose with Aura
              </button>
              <nav className="space-y-1">
                {[
                  { label: 'Inbox', count: 12, active: true },
                  { label: 'Starred', count: 3 },
                  { label: 'Sent' },
                  { label: 'Drafts', count: 2 },
                  { label: 'Archive' },
                  { label: 'Trash' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${
                      item.active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-sm">{item.label}</span>
                    {item.count && <span className="text-xs">{item.count}</span>}
                  </div>
                ))}
              </nav>
              <div className="mt-8">
                <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Labels</p>
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#00d2ff]" />
                  <div className="w-3 h-3 rounded-full bg-[#A4F4FD]" />
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                </div>
              </div>
            </div>
            {/* Message List */}
            <div className="col-span-4 border-r border-white/10">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-white/40">
                  <Search className="w-4 h-4" />
                  <span className="text-sm">Search mail</span>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { name: 'Linear', subject: 'Weekly product digest', preview: 'Your team shipped 23 issues this week...', time: '9:41 AM', unread: true, active: true },
                  { name: 'Sophia Chen', subject: 'Re: Q3 roadmap review', preview: 'Thanks for sending the deck over. I had a few thoughts...', time: '8:12 AM', unread: true },
                  { name: 'Figma', subject: 'Marcus commented on your file', preview: 'Love the new direction on the landing hero.', time: 'Yesterday' },
                  { name: 'Stripe', subject: 'Payout of $12,480.00 sent', preview: 'Your payout is on its way to your bank...', time: 'Yesterday' },
                  { name: 'Vercel', subject: 'Deployment ready for aura-web', preview: 'Preview is live at aura-web-g3f.vercel.app', time: 'Mon' },
                  { name: 'GitHub', subject: '[aura/core] PR #482 approved', preview: 'david-lim approved your pull request.', time: 'Mon' },
                ].map((msg, i) => (
                  <div
                    key={i}
                    className={`p-4 cursor-pointer ${
                      msg.active ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-sm font-medium ${msg.unread ? 'text-white' : 'text-white/70'}`}>
                        {msg.name}
                      </span>
                      <span className="text-xs text-white/40">{msg.time}</span>
                    </div>
                    <p className={`text-sm mb-1 ${msg.unread ? 'text-white font-medium' : 'text-white/60'}`}>
                      {msg.subject}
                    </p>
                    <p className="text-xs text-white/40 truncate">{msg.preview}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Reader */}
            <div className="col-span-5 p-6">
              <div className="flex items-center gap-2 mb-6">
                <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center">
                  <Reply className="w-4 h-4 text-white/60" />
                </button>
                <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center">
                  <Forward className="w-4 h-4 text-white/60" />
                </button>
                <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center">
                  <Archive className="w-4 h-4 text-white/60" />
                </button>
                <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-white/60" />
                </button>
                <div className="flex-1" />
                <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center">
                  <MoreHorizontal className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Weekly product digest</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d2ff] to-[#0B2551] flex items-center justify-center text-xs font-semibold">
                    L
                  </div>
                  <div>
                    <p className="text-sm">Linear <span className="text-white/50">to me · 9:41 AM</span></p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#00d2ff]/20 text-[#00d2ff]">Work</span>
                  </div>
                </div>
              </div>
              <div className="liquid-glass rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" style={{ color: '#A4F4FD' }} />
                  <span className="text-sm font-medium">Summary by Aura</span>
                </div>
                <p className="text-sm text-white/70">
                  Your team closed 23 issues, merged 14 PRs, and shipped 2 features. Top contributor: Marcus. No action needed.
                </p>
              </div>
              <div className="space-y-4 text-sm text-white/70">
                <p>Hi team,</p>
                <p>Here is your weekly digest of everything happening across your projects. This was a strong week with significant progress on the Q3 roadmap.</p>
                <p>Twenty-three issues were closed, fourteen pull requests were merged, and two customer-facing features went out. The velocity trend continues to climb.</p>
                <p>Let me know if you would like a deeper breakdown by project or contributor.</p>
                <p className="text-white/50">— The Linear team</p>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-sm text-white/60">
                <Paperclip className="w-4 h-4" />
                digest-may-6.pdf
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 5 - FeatureTriage */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <SectionEyebrow label="Triage" tag="AI-native" />
            <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
              Clear your inbox
              <br />
              in a single pass.
            </h2>
            <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
              Aura reads every message, understands intent, and routes the noise away from the signal. Focus on what moves your day forward — the rest handles itself.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Auto-categorize', 'Snooze for later', 'Silent newsletters', 'One-tap unsubscribe'].map((chip) => (
                <span
                  key={chip}
                  className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]"
                >
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>
          <div className="liquid-glass rounded-2xl p-5">
            <p className="text-xs text-white/50 mb-4">Today · 42 messages triaged</p>
            <div className="space-y-3">
              {[
                { label: 'Priority', count: 4, color: '#ffffff', items: ['Sophia Chen — Q3 review', 'David Lim — contract signoff'] },
                { label: 'Follow-up', count: 7, color: '#e5e5e5', items: ['Marcus — design review', 'Figma — comment thread'] },
                { label: 'Updates', count: 18, color: '#a3a3a3', items: ['Vercel — deploy ready', 'GitHub — PR #482 merged'] },
                { label: 'Archived', count: 13, color: '#525252', items: ['Stripe payout · Newsletter · Receipts'] },
              ].map((category) => (
                <div key={category.label} className="liquid-glass rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: category.color }}>
                      {category.label}
                    </span>
                    <span className="text-xs text-white/40">{category.count}</span>
                  </div>
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <p key={item} className="text-xs text-white/60">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 - LogoCloud */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-20">
        <p className="text-center text-xs uppercase tracking-widest text-white/40">
          Trusted by the world's most thoughtful teams
        </p>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
          {['Linear', 'Vercel', 'Figma', 'Stripe', 'Ramp', 'Notion', 'Loom', 'Arc'].map((logo, i) => (
            <motion.span
              key={logo}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="text-sm font-semibold tracking-tight text-white/50 hover:text-white cursor-pointer transition-colors"
            >
              {logo}
            </motion.span>
          ))}
        </div>
      </section>

      {/* Section 7 - Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "Aura gave our leadership team four hours of their week back. It reads like email from the future.",
              name: "Parker Wilf",
              role: "Group Product Manager",
              company: "MERCURY",
            },
            {
              quote: "The command palette alone has changed how I process messages. I can't imagine going back to a traditional client.",
              name: "Andrew von Rosenbach",
              role: "Senior Engineering Program Manager",
              company: "COHERE",
            },
            {
              quote: "Triage that actually understands context. Our team stopped dreading Monday morning inboxes.",
              name: "Mathies Christensen",
              role: "Engineering Manager",
              company: "LUNAR",
            },
          ].map((testimonial, i) => (
            <figure key={i} className="liquid-glass rounded-2xl p-6">
              <blockquote className="text-sm text-white/80 leading-[1.6]">
                "{testimonial.quote}"
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-white/10">
                <p className="text-sm font-semibold">{testimonial.name}</p>
                <p className="text-xs text-white/50">{testimonial.role}</p>
                <p className="text-xs text-white font-semibold tracking-wide mt-1">{testimonial.company}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Section 8 - Pricing */}
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

      {/* Section 9 - FinalCTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        <motion.div
          className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
              Close the tabs.
              <br />
              Open your day.
            </h2>
            <p className="mt-6 text-white/60 max-w-md mx-auto text-sm leading-[1.6]">
              Join thousands of builders, founders, and operators who treat email like a tool — not an obligation.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <AppleButton />
              <button className="rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 flex items-center gap-2 transition-colors">
                Talk to sales
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default App;
