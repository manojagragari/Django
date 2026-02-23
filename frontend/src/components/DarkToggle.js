"use client";
import { useEffect, useState } from "react";

export default function DarkToggle() {
  const [dark, setDark] = useState(false);

  // Initialize state based on current HTML class
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
    const isNowDark = html.classList.contains("dark");
    localStorage.setItem("theme", isNowDark ? "dark" : "light");
    setDark(isNowDark);
  };

  return (
    <button
      onClick={toggleDarkMode}
      aria-pressed={dark}
      className="px-3 py-1 rounded bg-gray-800 text-white dark:bg-white dark:text-black transition-colors duration-300"
    >
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
