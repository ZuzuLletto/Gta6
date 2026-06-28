"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Tarayıcı ve localStorage kontrolü
    const savedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

    const activeTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : systemTheme;
    setTheme(activeTheme as "light" | "dark");

    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 dark:border-white/10 light:border-black/10 bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 dark:text-text-primary text-text-primary transition-all duration-300 shadow-md"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4.5 w-4.5 text-neon-pink" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-neon-pink" />
      )}
    </button>
  );
}
