"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  // Initialize theme from local storage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem("spy-dashboard-theme");
    if (savedTheme === "light") {
      setIsDark(false);
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("spy-dashboard-theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("spy-dashboard-theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle-btn"
      aria-label="Toggle Light/Dark Mode"
    >
      {isDark ? <Sun size={20} color="var(--text-active)" /> : <Moon size={20} color="var(--text-active)" />}
    </button>
  );
}
