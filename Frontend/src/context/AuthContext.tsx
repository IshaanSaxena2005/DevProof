import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { authService } from "../services/auth";
import { DEMO_BASE } from "../demo/routes.mts";
import type { User } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  /** True only during the initial session bootstrap. */
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-read the session, e.g. after returning from the GitHub OAuth redirect. */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Reads the current session from the auth cookie. A 401 is the normal
   * "not logged in" answer, not a failure worth surfacing.
   */
  const refresh = useCallback(async () => {
    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
    } catch {
      // 401 (no session) and network failure both mean "treat as signed out".
      setUser(null);
    }
  }, []);

  // True while the URL is under /demo. Read during render so the mount-time
  // bootstrap below sees the route the app actually opened on.
  const location = useLocation();
  const onDemoRoute =
    location.pathname === DEMO_BASE || location.pathname.startsWith(`${DEMO_BASE}/`);

  /** Set when the mount bootstrap was skipped because the demo was open. */
  const restoreSessionRef = useRef(false);

  // Bootstrap once on mount so a page refresh keeps the user signed in — but
  // not on the public demo. The demo is synthetic and needs no session;
  // bootstrapping one just to render it would call a protected endpoint on
  // behalf of a visitor who has no account, and could put a real signed-in
  // account behind pages whose identity is sample data. The skip is remembered
  // and undone by the effect below, so leaving the demo restores the same
  // "signed in or not" answer the cookie would give anywhere else.
  useEffect(() => {
    if (onDemoRoute) {
      restoreSessionRef.current = true;
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      await refresh();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  // The first navigation out of the demo runs the session check the mount
  // skipped. A visitor who reached the demo from an already-bootstrapped page
  // never needs it: their session is still in memory, untouched.
  useEffect(() => {
    if (onDemoRoute || !restoreSessionRef.current) return;
    restoreSessionRef.current = false;

    let active = true;
    (async () => {
      await refresh();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [onDemoRoute, refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const data = await authService.register(email, password, name);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Clear locally even if the request failed — the user asked to leave.
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an <AuthProvider>");
  return ctx;
}
