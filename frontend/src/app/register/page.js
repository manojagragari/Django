"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [group, setGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingRegister, setLoadingRegister] = useState(false);

  // 🔹 Fetch Groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/groups/");

        if (!res.ok) {
          throw new Error("Failed to fetch groups");
        }

        const data = await res.json();
        console.log("Groups received:", data);

        setGroups(data);
      } catch (err) {
        console.error("Group fetch error:", err);
        setError("Unable to load roles");
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  // 🔹 Register Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!group) {
      setError("Please select a role");
      return;
    }

    setLoadingRegister(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          group,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.detail || "Registration failed");
        return;
      }

      // Store tokens
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      router.push("/dashboard");
    } catch (err) {
      console.error("Register error:", err);
      setError("Server error");
    } finally {
      setLoadingRegister(false);
    }
  };

  return (
  <div className="flex justify-center items-center h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b]">
    <form
      onSubmit={handleRegister}
      className="bg-[#1e293b] p-8 rounded-2xl shadow-2xl w-96 border border-gray-700"
    >
      <h2 className="text-3xl font-bold mb-6 text-center text-white">
        Create Account
      </h2>

      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
      )}

      <input
        type="text"
        placeholder="Username"
        className="w-full p-3 mb-4 rounded-lg bg-[#0f172a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full p-3 mb-4 rounded-lg bg-[#0f172a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <select
        className="w-full p-3 mb-6 rounded-lg bg-[#0f172a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        value={group}
        onChange={(e) => setGroup(e.target.value)}
        disabled={loadingGroups}
      >
        <option value="">
          {loadingGroups ? "Loading roles..." : "Select Role"}
        </option>

        {groups.length > 0 &&
          groups.map((g) => (
            <option key={g.name} value={g.name}>
              {g.name}
            </option>
          ))}
      </select>

      <button
        type="submit"
        disabled={loadingRegister}
        className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 disabled:opacity-50"
      >
        {loadingRegister ? "Registering..." : "Register"}
      </button>

      <p className="text-sm text-center mt-6 text-gray-400">
        Already have an account?{" "}
        <span
          onClick={() => router.push("/login")}
          className="text-blue-400 cursor-pointer hover:underline"
        >
          Login
        </span>
      </p>
    </form>
  </div>
);
}
