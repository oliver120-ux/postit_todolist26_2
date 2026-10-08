"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { CategoryType } from "@/types/postit";

interface PostItInputProps {
  onAddNote: (content: string, category: CategoryType) => void;
}

const CATEGORIES: CategoryType[] = ["할 일", "아이디어", "기타"];

export function PostItInput({ onAddNote }: PostItInputProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CategoryType>("할 일");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddNote(content.trim(), category);
    setContent("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-lg border border-zinc-200 dark:border-zinc-700/60 backdrop-blur-md transition-all duration-200"
    >
      <div className="flex flex-col gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 할 일이나 떠오르는 아이디어를 적어보세요..."
          rows={3}
          className="w-full p-3 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 rounded-xl resize-none outline-none border border-transparent focus:border-amber-400 dark:focus:border-amber-500 transition-colors text-sm placeholder:text-zinc-400"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSubmit(e);
            }
          }}
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          {/* 카테고리 선택 드롭다운 */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="category-select"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400"
            >
              카테고리:
            </label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-medium px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 등록 버튼 */}
          <button
            type="submit"
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>포스트잇 붙이기</span>
          </button>
        </div>
      </div>
    </form>
  );
}
