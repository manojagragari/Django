// lib/authFetch.js
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://django-394y.onrender.com/api";

/**
 * Wrapper for fetch with JWT auth and automatic refresh.
 * @param {string} url - Full endpoint URL (API_BASE + endpoint)
 * @param {object} options - fetch options (method, body, headers)
 * @param {object} router - Next.js router for redirects
 * @returns {Promise<Response|null>}
 */
export const authFetch = async (url, options = {}, router) => {
  try {
    let accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken) {
      router.push("/login");
      return null;
    }

    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    let res = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });

    // Token expired? Try refresh
    if (res.status === 401 && refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem("access_token", data.access);

        res = await fetch(url, {
          ...options,
          headers: { ...defaultHeaders, Authorization: `Bearer ${data.access}`, ...options.headers },
        });
      } else {
        // Refresh failed → log out
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
        return null;
      }
    }

    // Try to parse JSON safely
    let data = {};
    try {
      data = await res.clone().json();
    } catch (_) {}

    // Log any non-ok responses for debugging
    if (!res.ok) {
      console.error(`API ERROR: ${url}`, res.status, data);
    }

    return res;
  } catch (err) {
    console.error("authFetch Error:", err);
    router.push("/login");
    return null;
  }
};

export { API_BASE };
