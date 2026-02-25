"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        setIsLoggedIn(true);
        router.push("/dashboard");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Server error. Is backend running?");
    }
  };

  const goToDashboard = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      alert("Please login first");
    }
  };

  const goToAnalytics = () => {
    if (isLoggedIn) {
      router.push("/analytics");
    } else {
      alert("Please login first");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b]">

      {/* 🔹 Top Navbar */}
      <div className="flex justify-center items-center px-8 py-4 bg-[#111827] border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">
          Electronic Shop Management System
        </h1>
      </div>

      {/* 🔹 Login Form */}
      <div className="flex justify-center items-center h-[85vh]">
        <form
          onSubmit={handleLogin}
          className="bg-[#1e293b] p-8 rounded-2xl shadow-2xl w-96 border border-gray-700"
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-white">
            ElectroShop Login
          </h2>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 mb-4 rounded-lg bg-[#0f172a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-6 rounded-lg bg-[#0f172a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Login
          </button>

          <p className="text-sm text-center mt-6 text-gray-400">
            Don’t have an account?{" "}
            <span
              onClick={() => router.push("/register")}
              className="text-blue-400 cursor-pointer hover:underline"
            >
              Register
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
