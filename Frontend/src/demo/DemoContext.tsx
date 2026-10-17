import { createContext, useContext, useEffect, useMemo, type DependencyList, type ReactNode } from "react";
import { setDemoActive } from "./mode.mts";
import { sampleData, type SampleData } from "./sampleData.mts";
import { useResource, type Resource } from "../lib/useResource";

/**
 * Demo mode, as a React fact rather than a global one.
 *
 * `DemoProvider` is mounted by the `/demo` route only, so "are we in the demo?"
 * is answered by the component tree. Anything outside that tree — the marketing
 * pages, `/login`, the authenticated dashboard — sees `isDemo: false` and behaves
 * exactly as it did before this existed. Nothing about the demo is stored, so a
 * reload of `/demo` re-arms it from the route and a reload of `/dashboard` never
 * has it.
 */

interface DemoContextValue {
  isDemo: boolean;
  /** The sample dataset, or null outside the demo. */
  sample: SampleData | null;
}

/** Outside the provider the answer is always "no", never a throw. */
const DemoContext = createContext<DemoContextValue>({ isDemo: false, sample: null });

export function DemoProvider({ children }: { children: ReactNode }) {
  /**
   * While the demo is mounted, the API client refuses writes (see lib/api.mts).
   * This is belt-and-braces on top of the per-page guards: a demo visitor has no
   * session, so a write could only ever 401 — but a request that cannot be
   * issued at all is a guarantee rather than an expectation.
   */
  useEffect(() => {
    setDemoActive(true);
    return () => setDemoActive(false);
  }, []);

  const value = useMemo<DemoContextValue>(() => ({ isDemo: true, sample: sampleData }), []);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  return useContext(DemoContext);
}

/** True only inside the demo route. */
export function useDemoMode(): boolean {
  return useDemo().isDemo;
}

/**
 * The route prefix this part of the app lives under.
 *
 * The dashboard's own components link with absolute paths, and the demo mounts
 * the same components under `/demo`, so they ask for the base instead of hard
 * coding one. A demo link that fell back to `/dashboard/...` would drop the
 * visitor into the login wall.
 */
export function useDashboardBase(): string {
  return useDemoMode() ? "/demo" : "/dashboard";
}

/**
 * `useResource`, demo-aware.
 *
 * In the demo the loader is never called: the sample value resolves instead, so
 * no page can accidentally fetch a protected endpoint (or a real user's data)
 * just because it is being shown in demo mode. Outside the demo this is exactly
 * `useResource` with the caller's loader.
 */
export function useDemoResource<T>(
  live: () => Promise<T>,
  sample: T,
  deps: DependencyList = []
): Resource<T> {
  const isDemo = useDemoMode();
  return useResource(isDemo ? () => Promise.resolve(sample) : live, [isDemo, ...deps]);
}
