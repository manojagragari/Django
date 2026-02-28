"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");

    // Optional: call backend logout
    if (refreshToken) {
      await fetch(`${API_BASE}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    }
  } catch (err) {
    console.log("Logout API error (safe to ignore)");
  }

  // Clear tokens
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  // Redirect
  router.replace("/login");
};

  return children;
}
