"use client";

/**
 * Session state for the whole app.
 *
 * The bug this replaces: the dashboard guard only checked that *some* string
 * sat in localStorage under "access_token". An expired, revoked or hand-typed
 * value walked straight into the app, and the user was never asked to sign in
 * again until an API call happened to fail.
 *
 * Here the only thing that proves a session is a 2xx from GET /auth/me/. Until
 * that call resolves the status is "loading" and guarded routes render nothing,
 * so there is no flash of a dashboard the user is not entitled to see.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, api, onSessionExpired, tokenStore } from "./api";

const AuthContext = createContext(null);

const STATUS = {
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  ANONYMOUS: "anonymous",
};

export function AuthProvider({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState(STATUS.LOADING);
  const [user, setUser] = useState(null);

  // Guards against a late-resolving validation overwriting a newer state.
  const generation = useRef(0);

  const applyAnonymous = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus(STATUS.ANONYMOUS);
  }, []);

  /** Ask the server who we are. This is the single source of truth. */
  const validateSession = useCallback(async () => {
    const current = ++generation.current;

    if (!tokenStore.access && !tokenStore.refresh) {
      if (current === generation.current) applyAnonymous();
      return false;
    }

    try {
      const profile = await api.auth.me();
      if (current !== generation.current) return false;
      setUser(profile);
      setStatus(STATUS.AUTHENTICATED);
      return true;
    } catch (error) {
      if (current !== generation.current) return false;

      // A network blip must not log the user out; only a real auth failure does.
      if (error instanceof ApiError && error.status === 0) {
        setStatus(STATUS.ANONYMOUS);
        return false;
      }
      applyAnonymous();
      return false;
    }
  }, [applyAnonymous]);

  // Validate once on mount.
  //
  // Deferred by a microtask so the state updates land in a callback rather than
  // synchronously in the effect body, which would cascade an extra render.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) validateSession();
    });
    return () => {
      cancelled = true;
    };
  }, [validateSession]);

  // The API layer shouts when a refresh fails mid-flight; land the user on the
  // login screen instead of leaving a half-broken dashboard on screen.
  useEffect(() => {
    return onSessionExpired(() => {
      setUser(null);
      setStatus(STATUS.ANONYMOUS);
      router.replace("/login");
    });
  }, [router]);

  // Signing out in one tab signs out the others.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key && !event.key.startsWith("electroshop.")) return;
      if (!tokenStore.access && !tokenStore.refresh) {
        setUser(null);
        setStatus(STATUS.ANONYMOUS);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api.auth.login(username, password);
    tokenStore.save({ access: data.access, refresh: data.refresh });
    generation.current += 1;
    setUser(data.user ?? null);
    setStatus(STATUS.AUTHENTICATED);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.auth.register(payload);
    tokenStore.save({ access: data.access, refresh: data.refresh });
    generation.current += 1;
    setUser(data.user ?? null);
    setStatus(STATUS.AUTHENTICATED);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh;
    generation.current += 1;

    // Blacklist server side first, so the refresh token cannot be replayed.
    // Failure here is not fatal: the local session still ends.
    if (refresh) {
      try {
        await api.auth.logout(refresh);
      } catch {
        /* already expired, or the server is unreachable */
      }
    }

    applyAnonymous();
    router.replace("/login");
  }, [applyAnonymous, router]);

  const value = useMemo(
    () => ({
      status,
      user,
      isLoading: status === STATUS.LOADING,
      isAuthenticated: status === STATUS.AUTHENTICATED,
      isAdmin: Boolean(user?.is_admin),
      role: user?.role ?? null,
      login,
      register,
      logout,
      revalidate: validateSession,
    }),
    [status, user, login, register, logout, validateSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}

export { STATUS as AUTH_STATUS };
