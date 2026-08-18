"use client";

/**
 * Persistent application shell: brand rail, section navigation, top bar.
 *
 * Replaces the old arrangement where the only way to reach analytics was a
 * "Go to Analysis" button parked inside the dashboard body, and there was no
 * indication of which section you were in.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeProvider";
import { Button, cx } from "@/components/ui/Primitives";
import {
  BoltIcon,
  BoxIcon,
  CartIcon,
  ChartIcon,
  CloseIcon,
  GridIcon,
  LogoutIcon,
  MenuIcon,
  UserIcon,
  WalletIcon,
} from "@/components/ui/Icons";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon, blurb: "Today at a glance" },
  { href: "/inventory", label: "Inventory", icon: BoxIcon, blurb: "Stock & categories" },
  { href: "/sales", label: "Sales", icon: CartIcon, blurb: "Billing & invoices" },
  { href: "/expenses", label: "Expenses", icon: WalletIcon, blurb: "Shop expenditure" },
  { href: "/analytics", label: "Analytics", icon: ChartIcon, blurb: "Charts & forecasts" },
];

function Brand({ compact = false }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent text-accent-ink">
        <BoltIcon size={19} />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-tight text-ink">ElectroShop</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            Voltline
          </span>
        </span>
      )}
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, blurb }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cx(
              "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors",
              active
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-raised hover:text-ink"
            )}
          >
            {active && (
              <span
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent"
                aria-hidden="true"
              />
            )}
            <Icon size={17} className="shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block text-sm font-semibold">{label}</span>
              <span
                className={cx(
                  "block truncate text-[11px]",
                  active ? "text-accent/70" : "text-faint"
                )}
              >
                {blurb}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard({ user, role, onLogout, loggingOut }) {
  return (
    <div className="rounded-[12px] border border-line bg-raised p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <UserIcon size={15} />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-ink">{user?.username ?? "—"}</p>
          <p className="text-[11px] text-faint">{role ?? "Staff"}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        icon={LogoutIcon}
        onClick={onLogout}
        loading={loggingOut}
        className="mt-2.5 w-full justify-start hover:text-negative"
      >
        Sign out
      </Button>
    </div>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const current = NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface p-4 lg:flex">
        <div className="px-1 pb-5">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
        <div className="mt-auto pt-4">
          <UserCard
            user={user}
            role={role}
            onLogout={handleLogout}
            loggingOut={loggingOut}
          />
        </div>
      </aside>

      {/* ---------- Mobile drawer ---------- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="vl-rise absolute inset-y-0 left-0 flex w-[min(19rem,85vw)] flex-col border-r border-line bg-surface p-4">
            <div className="flex items-center justify-between px-1 pb-5">
              <Brand />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-1.5 text-faint hover:bg-raised hover:text-ink"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            <div className="mt-auto pt-4">
              <UserCard
                user={user}
                role={role}
                onLogout={handleLogout}
                loggingOut={loggingOut}
              />
            </div>
          </aside>
        </div>
      )}

      {/* ---------- Main column ---------- */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line-strong text-muted hover:border-accent hover:text-accent lg:hidden"
          >
            <MenuIcon size={17} />
          </button>

          <div className="lg:hidden">
            <Brand compact />
          </div>

          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-semibold text-ink">
              {current?.label ?? "ElectroShop"}
            </p>
            <p className="truncate text-[11px] text-faint">{current?.blurb}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="vl-grid-bg min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>

        <footer className="border-t border-line px-4 py-4 text-center text-[11px] text-faint sm:px-6">
          ElectroShop Management System · Django REST Framework + Next.js
        </footer>
      </div>
    </div>
  );
}
