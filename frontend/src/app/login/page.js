"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeProvider";
import { Alert, Button, Card } from "@/components/ui/Primitives";
import { Field, Input } from "@/components/ui/Form";
import { BoltIcon, BoxIcon, ChartIcon, ReceiptIcon } from "@/components/ui/Icons";

const HIGHLIGHTS = [
  { icon: BoxIcon, title: "Live inventory", body: "Stock adjusts on every sale, with low-stock alerts." },
  { icon: ReceiptIcon, title: "Instant invoices", body: "Tax, discount and invoice number handled for you." },
  { icon: ChartIcon, title: "Real analytics", body: "Recharts dashboards plus Python-rendered statistics." },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Someone with a valid session should not sit on the login screen.
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/dashboard");
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(username.trim(), password);
      router.replace("/dashboard");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(
          caught.status === 401
            ? "Incorrect username or password."
            : caught.message || "Could not sign in."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ---------- Brand panel ---------- */}
      <div className="vl-grid-bg relative hidden flex-col justify-between border-r border-line bg-surface p-10 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-accent text-accent-ink">
            <BoltIcon size={21} />
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-ink">ElectroShop</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
              Voltline
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-[34px] font-bold leading-[1.15] tracking-tight text-ink">
            Run the whole shop from{" "}
            <span className="vl-brand-text">one console</span>.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Inventory, billing, expenditure and analytics, backed by a Django REST
            Framework API.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent">
                  <Icon size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="text-xs text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-faint">
          Django · DRF · SimpleJWT · Next.js · Tailwind · Recharts · Matplotlib · Seaborn
        </p>
      </div>

      {/* ---------- Form panel ---------- */}
      <div className="flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="mb-6 flex w-full max-w-sm items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent text-accent-ink">
              <BoltIcon size={18} />
            </span>
            <span className="text-sm font-bold tracking-tight text-ink">ElectroShop</span>
          </div>
          <ThemeToggle />
        </div>

        <Card current className="w-full max-w-sm p-6 sm:p-7">
          <h2 className="text-xl font-bold tracking-tight text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Welcome back. Enter your shop credentials.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {error && <Alert tone="error">{error}</Alert>}

            <Field label="Username" required>
              <Input
                name="username"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="your username"
              />
            </Field>

            <Field label="Password" required>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              className="w-full"
              disabled={!username.trim() || !password}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            No account yet?{" "}
            <Link href="/register" className="font-semibold text-accent hover:underline">
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
