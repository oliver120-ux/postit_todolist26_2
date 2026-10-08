"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-2 px-3 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all text-zinc-700 dark:text-zinc-200 cursor-pointer"
      title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-label="테마 전환 토글"
    >
      {isDark ? (
        <>
          <Moon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-medium">다크 모드</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium">라이트 모드</span>
        </>
      )}
    </button>
  );
}
