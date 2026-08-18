/**
 * Single HTTP layer for the whole app.
 *
 * Responsibilities:
 *   - hold the JWT pair in localStorage behind one small interface
 *   - attach the Authorization header
 *   - refresh a expired access token once, even if ten requests fail at the
 *     same time (single-flight), and replay the original requests
 *   - surface backend errors as a typed ApiError with per-field messages
 *
 * The old code duplicated fetch/refresh logic in every page and treated
 * "a token string exists" as proof of a valid session. Nothing here trusts the
 * stored token; only a 2xx from the server counts.
 */

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const ACCESS_KEY = "electroshop.access";
const REFRESH_KEY = "electroshop.refresh";

// Keys used by the previous version, migrated on first load so an already
// signed-in user is not kicked out by the upgrade.
const LEGACY_ACCESS_KEY = "access_token";
const LEGACY_REFRESH_KEY = "refresh_token";

/* ------------------------------------------------------------------ */
/* Token store                                                         */
/* ------------------------------------------------------------------ */
const isBrowser = () => typeof window !== "undefined";

export const tokenStore = {
  get access() {
    if (!isBrowser()) return null;
    return (
      window.localStorage.getItem(ACCESS_KEY) ||
      window.localStorage.getItem(LEGACY_ACCESS_KEY)
    );
  },
  get refresh() {
    if (!isBrowser()) return null;
    return (
      window.localStorage.getItem(REFRESH_KEY) ||
      window.localStorage.getItem(LEGACY_REFRESH_KEY)
    );
  },
  save({ access, refresh }) {
    if (!isBrowser()) return;
    if (access) window.localStorage.setItem(ACCESS_KEY, access);
    if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    if (!isBrowser()) return;
    [ACCESS_KEY, REFRESH_KEY, LEGACY_ACCESS_KEY, LEGACY_REFRESH_KEY].forEach((key) =>
      window.localStorage.removeItem(key)
    );
  },
};

/* ------------------------------------------------------------------ */
/* Errors                                                             */
/* ------------------------------------------------------------------ */
export class ApiError extends Error {
  constructor(message, { status = 0, errors = {}, isAuthError = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.isAuthError = isAuthError;
  }

  /** Flatten field errors into lines suitable for a form summary. */
  fieldMessages() {
    return Object.entries(this.errors || {})
      .filter(([key]) => key !== "detail")
      .flatMap(([key, value]) => {
        const messages = Array.isArray(value) ? value : [value];
        const label = key === "non_field_errors" ? "" : `${key}: `;
        return messages.map((message) => `${label}${message}`);
      });
  }
}

/* ------------------------------------------------------------------ */
/* Session expiry broadcast                                           */
/* ------------------------------------------------------------------ */
const sessionExpiredHandlers = new Set();

/** AuthProvider subscribes so it can clear state and redirect to /login. */
export function onSessionExpired(handler) {
  sessionExpiredHandlers.add(handler);
  return () => sessionExpiredHandlers.delete(handler);
}

function broadcastSessionExpired() {
  tokenStore.clear();
  sessionExpiredHandlers.forEach((handler) => {
    try {
      handler();
    } catch {
      /* a bad subscriber must not break the others */
    }
  });
}

/* ------------------------------------------------------------------ */
/* Refresh (single-flight)                                            */
/* ------------------------------------------------------------------ */
let refreshInFlight = null;

async function refreshAccessToken() {
  // If a refresh is already running, every other caller waits on that same
  // promise instead of firing a second refresh and racing token rotation.
  if (refreshInFlight) return refreshInFlight;

  const refresh = tokenStore.refresh;
  if (!refresh) return null;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data?.access) return null;

      // ROTATE_REFRESH_TOKENS is on server side, so store the new refresh too;
      // keeping the old one would fail on the next refresh.
      tokenStore.save({ access: data.access, refresh: data.refresh });
      return data.access;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/* ------------------------------------------------------------------ */
/* Core request                                                       */
/* ------------------------------------------------------------------ */
async function parseBody(response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  if (type.startsWith("image/")) return await response.blob();
  const text = await response.text();
  return text || null;
}

function buildQuery(params) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function request(
  path,
  { method = "GET", body, params, auth = true, retry = true, raw = false } = {}
) {
  const url = `${API_BASE}${path}${buildQuery(params)}`;

  const headers = {};
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (raw) headers.Accept = "image/png";

  if (auth) {
    const access = tokenStore.access;
    if (access) headers.Authorization = `Bearer ${access}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and that the backend is running.",
      { status: 0 }
    );
  }

  // Access token expired: refresh once, then replay this exact request.
  if (response.status === 401 && auth && retry) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      return request(path, { method, body, params, auth, retry: false, raw });
    }
    broadcastSessionExpired();
    throw new ApiError("Your session has expired. Please sign in again.", {
      status: 401,
      isAuthError: true,
    });
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    const detail =
      (payload && typeof payload === "object" && payload.detail) ||
      (typeof payload === "string" && payload) ||
      `Request failed (${response.status})`;

    throw new ApiError(detail, {
      status: response.status,
      errors: (payload && typeof payload === "object" && payload.errors) || {},
      isAuthError: response.status === 401,
    });
  }

  return payload;
}

/* ------------------------------------------------------------------ */
/* Endpoints, grouped to mirror the backend URL modules               */
/* ------------------------------------------------------------------ */
export const api = {
  raw: request,

  auth: {
    login: (username, password) =>
      request("/auth/login/", { method: "POST", body: { username, password }, auth: false }),

    register: (payload) =>
      request("/auth/register/", { method: "POST", body: payload, auth: false }),

    /** The session check. A 401 here means the stored token is genuinely dead. */
    me: () => request("/auth/me/"),

    logout: (refresh) => request("/auth/logout/", { method: "POST", body: { refresh } }),

    groups: () => request("/auth/groups/", { auth: false }),
  },

  categories: {
    list: () => request("/catalog/categories/"),
    create: (payload) => request("/catalog/categories/", { method: "POST", body: payload }),
    update: (id, payload) =>
      request(`/catalog/categories/${id}/`, { method: "PATCH", body: payload }),
    remove: (id) => request(`/catalog/categories/${id}/`, { method: "DELETE" }),
  },

  products: {
    list: (params) => request("/catalog/products/", { params }),
    create: (payload) => request("/catalog/products/", { method: "POST", body: payload }),
    update: (id, payload) =>
      request(`/catalog/products/${id}/`, { method: "PATCH", body: payload }),
    remove: (id) => request(`/catalog/products/${id}/`, { method: "DELETE" }),
    lowStock: () => request("/catalog/products/low-stock/"),
  },

  sales: {
    list: (params) => request("/sales/", { params }),
    create: (payload) => request("/sales/", { method: "POST", body: payload }),
    update: (id, payload) => request(`/sales/${id}/`, { method: "PATCH", body: payload }),
    remove: (id) => request(`/sales/${id}/`, { method: "DELETE" }),
    invoice: (id) => request(`/sales/${id}/invoice/`),
  },

  expenses: {
    list: (params) => request("/expenses/", { params }),
    create: (payload) => request("/expenses/", { method: "POST", body: payload }),
    update: (id, payload) => request(`/expenses/${id}/`, { method: "PATCH", body: payload }),
    remove: (id) => request(`/expenses/${id}/`, { method: "DELETE" }),
    categories: () => request("/expenses/categories/"),
  },

  analytics: {
    summary: () => request("/analytics/summary/"),
    salesDaily: () => request("/analytics/sales/daily/"),
    salesWeekly: () => request("/analytics/sales/weekly/"),
    salesMonthly: () => request("/analytics/sales/monthly/"),
    salesByCategory: () => request("/analytics/sales/by-category/"),
    payments: () => request("/analytics/payments/"),
    topProducts: (limit = 5) => request("/analytics/top-products/", { params: { limit } }),
    expensesDaily: () => request("/analytics/expenses/daily/"),
    expensesWeekly: () => request("/analytics/expenses/weekly/"),
    expensesByCategory: () => request("/analytics/expenses/by-category/"),
    profitTrend: () => request("/analytics/profit-trend/"),

    /** Catalogue of the Python-rendered charts. */
    charts: () => request("/analytics/charts/"),

    /**
     * Server-rendered PNG. These endpoints require the Authorization header,
     * which an <img src> cannot send, so the image is fetched as a blob and
     * handed to the DOM as an object URL.
     */
    chartBlob: (slug, theme = "dark") =>
      request(`/analytics/charts/${slug}/`, { params: { theme }, raw: true }),
  },
};

export default api;
