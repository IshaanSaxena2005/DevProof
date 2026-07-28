import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white relative">
      {/* Sidebar - Desktop (always visible on lg screens) */}
      <div className="hidden lg:block shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile Drawer (rendered inside a portal or AnimatePresence overlay) */}
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#030303]">
        {/* Ambient Top Glow in Dashboard */}
        <div
          className="absolute top-0 right-0 w-[50vw] h-[50vh] rounded-full blur-[140px] opacity-10 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(119, 252, 117, 0.15) 0%, transparent 80%)"
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
