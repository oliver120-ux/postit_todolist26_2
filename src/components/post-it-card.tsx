"use client";

import { useState } from "react";
import { Check, CheckCircle2, Edit2, Trash2, CheckSquare, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PostItNote } from "@/types/postit";

interface PostItCardProps {
  note: PostItNote;
  onToggleComplete: (timestamp: string) => void;
  onEdit: (timestamp: string, newContent: string) => void;
  onDelete: (timestamp: string) => void;
  isDraggable?: boolean;
}

const CATEGORY_BADGES: Record<string, { bg: string; text: string }> = {
  "할 일": { bg: "bg-blue-600/15", text: "text-blue-900 dark:text-blue-950 font-bold" },
  아이디어: { bg: "bg-purple-600/15", text: "text-purple-900 dark:text-purple-950 font-bold" },
  기타: { bg: "bg-zinc-700/15", text: "text-zinc-900 dark:text-zinc-950 font-bold" },
};

export function PostItCard({
  note,
  onToggleComplete,
  onEdit,
  onDelete,
  isDraggable = true,
}: PostItCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.timestamp,
    disabled: !isDraggable || isEditing,
  });

  const style = {
    backgroundColor: note.color,
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEdit(note.timestamp, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(note.content);
    setIsEditing(false);
  };

  const isCompleted = note.state === "완료";
  const badgeStyle = CATEGORY_BADGES[note.category] || CATEGORY_BADGES["기타"];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`animate-stick-in postit-shadow relative flex flex-col justify-between rounded-xl p-4 min-h-[220px] transition-transform duration-200 select-none ${
        isDragging ? "shadow-2xl scale-105" : "hover:-translate-y-1.5"
      } ${isCompleted ? "opacity-75 saturate-75" : ""}`}
    >
      {/* 상단 핀 / 핸들 / 카테고리 뱃지 및 액션 버튼들 */}
      <div className="flex items-start justify-between gap-2 border-b border-black/10 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          {/* 드래그 핸들 */}
          {isDraggable && (
            <button
              {...attributes}
              {...listeners}
              type="button"
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-black/40 hover:text-black/80 rounded transition-colors touch-none"
              title="드래그하여 순서 변경"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full backdrop-blur-sm ${badgeStyle.bg} ${badgeStyle.text}`}
          >
            {note.category}
          </span>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex items-center gap-1">
          {/* 완료 체크 버튼 */}
          <button
            onClick={() => onToggleComplete(note.timestamp)}
            title={isCompleted ? "미완료로 변경" : "완료 체크"}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isCompleted
                ? "bg-emerald-600/30 text-emerald-950 hover:bg-emerald-600/40"
                : "bg-black/5 text-zinc-800 hover:bg-black/15"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-800" />
            ) : (
              <Check className="w-4 h-4 opacity-70" />
            )}
          </button>

          {/* 편집 버튼 */}
          <button
            onClick={() => {
              if (isEditing) {
                handleSaveEdit();
              } else {
                setIsEditing(true);
              }
            }}
            title={isEditing ? "저장" : "편집"}
            className="p-1.5 rounded-md bg-black/5 text-zinc-800 hover:bg-black/15 transition-colors cursor-pointer"
          >
            {isEditing ? (
              <CheckSquare className="w-4 h-4 text-blue-800" />
            ) : (
              <Edit2 className="w-4 h-4 opacity-70" />
            )}
          </button>

          {/* 삭제 버튼 */}
          <button
            onClick={() => onDelete(note.timestamp)}
            title="메모 삭제"
            className="p-1.5 rounded-md bg-black/5 text-zinc-800 hover:bg-red-500/20 hover:text-red-900 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* 본문 메모 내용 (일반 / 편집 모드) */}
      <div className="flex-1 flex flex-col justify-start overflow-hidden">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleSaveEdit();
              }
              if (e.key === "Escape") {
                handleCancelEdit();
              }
            }}
            autoFocus
            rows={4}
            className="w-full h-full p-2 bg-white/70 text-zinc-950 rounded-lg text-sm font-medium resize-none border border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30"
          />
        ) : (
          <p
            className={`text-sm font-medium leading-relaxed break-words whitespace-pre-wrap text-zinc-900 ${
              isCompleted ? "line-through text-zinc-600/70" : ""
            }`}
          >
            {note.content}
          </p>
        )}
      </div>

      {/* 하단 영역: 좌측 하단 연월일 시간 요일 표시 (작은 글씨로 흐릿하게) 및 완료 상태 표시 */}
      <div className="mt-4 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] text-zinc-700/60 font-medium">
        <span className="tracking-tight select-text" title="작성일시">
          {note.datetime || "2026.10.08 14:30 목요일"}
        </span>
        {isCompleted && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-700/20 text-emerald-950">
            완료됨
          </span>
        )}
      </div>
    </div>
  );
}
