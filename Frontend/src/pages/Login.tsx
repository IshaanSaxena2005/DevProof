import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ApiError, BASE_URL } from "../lib/api";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5 0-1.4-.5-2.5-1.5-3.4.1-.3.4-1.6-.1-3.3 0 0-1.2-.4-3.8 1.4a12.8 12.8 0 0 0-7 0C6.2 2.6 5 3 5 3c-.5 1.7-.2 3 .1 3.3C4.1 7.2 3.6 8.3 3.6 9.7c0 5 3 6.2 6 6.5-.4.4-.8 1-.9 2-.9.4-3.2.1-4.6-1.3 0 0-.8-1.5-2.2-1.5 0 0-1.4 0 0 1.3 1.2 1.5 2 3.2 2 3.2 1.4 2 4 1.5 4 1.5"/>
  </svg>
);

type Mode = "login" | "register";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { login, register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where the guard bounced us from, so login returns the user there.
  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/dashboard/overview";

  const isRegister = mode === "register";

  // Already signed in (or just signed in) — don't show the form again.
  if (!loading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  function switchMode(next: Mode) {
    setMode(next);
    setFormError(null);
    setFieldErrors({});
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
  }

  // Pure clientside validations
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (isRegister && password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (isRegister) {
      if (!name.trim()) {
        errors.name = "Name is required";
      }
      if (!confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setFormError(null);

    try {
      if (isRegister) {
        await register(email, password, name.trim());
      } else {
        await login(email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        // Prefer per-field messages from the Zod validator when present.
        const mapped: Record<string, string> = {};
        for (const key of ["email", "password", "name"]) {
          const msg = error.fieldError(key);
          if (msg) mapped[key] = msg;
        }
        setFieldErrors(mapped);
        if (Object.keys(mapped).length === 0) setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please check your credentials and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all focus:bg-white/[0.05] ${
      fieldErrors[field]
        ? "border-red-500/50 focus:border-red-500/70"
        : "border-white/10 focus:border-primary/40"
    }`;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-16 font-sora">
      {/* Ambient background wash — cheap, no WebGL on the auth screen. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(119,252,117,0.08) 0%, transparent 55%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center transition-all group-hover:border-primary/50">
            <div className="w-3 h-3 bg-primary rounded-sm shadow-[0_0_8px_rgba(119,252,117,0.8)]" />
          </div>
          <span className="text-white text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
            DevProof
          </span>
        </Link>

        <div className="glass-panel-static p-7 md:p-8">
          <h1 className="text-xl font-bold text-white tracking-tight mb-1">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-[13px] mb-7" style={{ color: "var(--text-secondary)" }}>
            {isRegister
              ? "Start turning your work into verifiable evidence."
              : "Sign in to view your engineering evidence."}
          </p>

          {/* GitHub OAuth — full page navigation, not fetch, so the backend can
              redirect to GitHub and set the auth cookie on its way back. */}
          <a
            href={submitting ? undefined : `${BASE_URL}/auth/github`}
            className={`w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white/90 transition-all hover:bg-white/[0.08] hover:border-white/20 ${submitting ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            <GithubIcon className="w-4 h-4" />
            Continue with GitHub
          </a>

          <div className="flex items-center gap-3 my-6">
            <span className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
              or
            </span>
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  disabled={submitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  className={inputClass("name")}
                />
                {fieldErrors.name && <FieldMessage>{fieldErrors.name}</FieldMessage>}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass("email")}
              />
              {fieldErrors.email && <FieldMessage>{fieldErrors.email}</FieldMessage>}
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? "At least 8 characters" : "••••••••"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className={inputClass("password")}
              />
              {fieldErrors.password && <FieldMessage>{fieldErrors.password}</FieldMessage>}
            </div>

            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  disabled={submitting}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={inputClass("confirmPassword")}
                />
                {fieldErrors.confirmPassword && <FieldMessage>{fieldErrors.confirmPassword}</FieldMessage>}
              </div>
            )}

            {formError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[13px] text-red-300/90 leading-relaxed">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(119,252,117,0.25)] hover:shadow-[0_0_24px_rgba(119,252,117,0.45)]"
              style={{
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting
                ? isRegister ? "Creating account…" : "Signing in…"
                : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? "login" : "register")}
              className="font-semibold text-primary hover:underline"
            >
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function FieldMessage({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[12px] text-red-400/90">{children}</p>;
}
