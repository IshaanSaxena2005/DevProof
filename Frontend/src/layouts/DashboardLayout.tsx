import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4";

export default function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white relative">
      {/* ── Full-screen video background ── */}
      <video
        key={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
        src={VIDEO_URL}
      />

      {/* Dark overlay to keep UI readable on top of video */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(3,3,3,0.72) 0%, rgba(3,3,3,0.60) 50%, rgba(3,3,3,0.78) 100%)",
        }}
      />

      {/* Sidebar - Desktop (always visible on lg screens) */}
      <div className="hidden lg:block shrink-0 h-full relative z-10">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop veil */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            {/* Drawer container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 z-50 lg:hidden shadow-2xl"
            >
              <Sidebar onClose={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* Ambient Top Glow */}
        <div
          className="absolute top-0 right-0 w-[50vw] h-[50vh] rounded-full blur-[140px] opacity-[0.07] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(119, 252, 117, 0.18) 0%, transparent 80%)",
          }}
        />

        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Scrollable sub-views container */}
        <main className="flex-1 overflow-y-auto px-6 py-8 relative z-10">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
