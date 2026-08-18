"use client";

/**
 * Route guard for every signed-in page.
 *
 * The old guard read localStorage and then returned `children` unconditionally,
 * so protected content rendered for one paint even when the token was invalid,
 * and an expired token never triggered a re-login.
 *
 * Here nothing renders until the session has been confirmed against
 * GET /auth/me/, and an unauthenticated visitor is redirected.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";
import AppShell from "@/components/layout/AppShell";
import { BoltIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Primitives";

function SessionSplash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-accent text-accent-ink">
        <BoltIcon size={24} />
      </span>
      <Spinner label="Checking your session…" />
    </div>
  );
}

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Render neither the shell nor the page until the session is proven.
  if (isLoading || !isAuthenticated) {
    return <SessionSplash />;
  }

  return <AppShell>{children}</AppShell>;
}
