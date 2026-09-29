import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll on navigation so every dashboard page opens at the top.
 *
 * The dashboard scrolls in `<main class="overflow-y-auto main-scroll">`
 * (DashboardLayout), not the window — so this targets the .main-scroll
 * element directly and falls back to window scrolling elsewhere (e.g. login).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.querySelector<HTMLElement>(".main-scroll")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}
