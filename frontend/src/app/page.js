"use client";

/**
 * Landing route.
 *
 * Previously `/` held a second, byte-for-byte copy of the login page, so there
 * were two login screens and no single place that decided where a visitor
 * belongs. Now it waits for the session check and routes once.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";
import { BoltIcon } from "@/components/ui/Icons";

export default function LandingPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-accent text-accent-ink">
        <BoltIcon size={24} />
      </span>
      <p className="text-sm text-muted">Loading ElectroShop…</p>
    </div>
  );
}
