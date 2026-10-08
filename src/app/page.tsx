"use client";

import { useEffect, useState } from "react";
import { StickyNote, Filter, RefreshCw, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { PostItInput } from "@/components/post-it-input";
import { PostItCard } from "@/components/post-it-card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  CategoryType,
  formatPostItDate,
  getRandomColor,
  PostItNote,
} from "@/types/postit";
import {
  fetchNotesFromSheet,
  createNoteInSheet,
  updateNoteInSheet,
  deleteNoteInSheet,
  updateOrdersInSheet,
} from "@/lib/sheet-api";

type FilterType = "전체" | CategoryType;
const FILTER_OPTIONS: FilterType[] = ["전체", "할 일", "아이디어", "기타"];

export default function Home() {
  const [notes, setNotes] = useState<PostItNote[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("전체");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px 이상 드래그해야 이동 시작 (버튼 클릭과 충돌 방지)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 1. 초기 로딩 시 구글 시트에서 전체 메모 목록 불러오기 (Read)
  const loadNotes = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchNotesFromSheet();
      setNotes(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("구글 시트 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  // 2. 메모 등록 시 구글 시트에 행 추가 (Create)
  const handleAddNote = async (content: string, category: CategoryType) => {
    const timestamp = String(Date.now());
    const datetime = formatPostItDate(new Date());
    const color = getRandomColor();
    const order = notes.length; // 마지막 순서 번호

    const newNote: PostItNote = {
      timestamp,
      datetime,
      category,
      content,
      color,
      state: "미완료",
      order,
    };

    // 낙관적 UI 업데이트 (화면에 먼저 반영)
    setNotes((prev) => [newNote, ...prev]);

    try {
      setIsSyncing(true);
      await createNoteInSheet(newNote);
    } catch (err) {
      console.error("추가 실패:", err);
      setErrorMessage("메모를 시트에 저장하지 못했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. 내용 수정 (Update)
  const handleEditNote = async (timestamp: string, newContent: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.timestamp === timestamp ? { ...n, content: newContent } : n))
    );

    try {
      setIsSyncing(true);
      await updateNoteInSheet({ timestamp, content: newContent });
    } catch (err) {
      console.error("수정 실패:", err);
      setErrorMessage("수정 사항을 시트에 동기화하지 못했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. 체크 버튼 클릭 시 state를 '완료'/'미완료'로 토글 (Update)
  const handleToggleComplete = async (timestamp: string) => {
    const target = notes.find((n) => n.timestamp === timestamp);
    if (!target) return;

    const nextState = target.state === "완료" ? "미완료" : "완료";

    setNotes((prev) =>
      prev.map((n) => (n.timestamp === timestamp ? { ...n, state: nextState } : n))
    );

    try {
      setIsSyncing(true);
      await updateNoteInSheet({ timestamp, state: nextState });
    } catch (err) {
      console.error("상태 변경 실패:", err);
      setErrorMessage("완료 상태를 시트에 동기화하지 못했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. 삭제 버튼 클릭 시 구글 시트에서 해당 행 즉시 제거 (Delete)
  const handleDeleteNote = async (timestamp: string) => {
    setNotes((prev) => prev.filter((n) => n.timestamp !== timestamp));

    try {
      setIsSyncing(true);
      await deleteNoteInSheet(timestamp);
    } catch (err) {
      console.error("삭제 실패:", err);
      setErrorMessage("메모를 시트에서 삭제하지 못했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  // 6. 드래그 앤 드롭으로 카드 순서 변경 시 order 값 시트 동기화
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = notes.findIndex((item) => item.timestamp === active.id);
      const newIndex = notes.findIndex((item) => item.timestamp === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(notes, oldIndex, newIndex).map((item, idx) => ({
          ...item,
          order: idx,
        }));

        setNotes(reordered);

        // 변경된 order 값들을 시트에 동기화
        try {
          setIsSyncing(true);
          const ordersToUpdate = reordered.map((item) => ({
            timestamp: item.timestamp,
            order: item.order,
          }));
          await updateOrdersInSheet(ordersToUpdate);
        } catch (err) {
          console.error("순서 동기화 실패:", err);
          setErrorMessage("순서 변경을 시트에 저장하지 못했습니다.");
        } finally {
          setIsSyncing(false);
        }
      }
    }
  };

  // 필터링 적용 (필터 적용 중일 땐 순서 왜곡 방지를 위해 드래그 비활성화 권장)
  const isFilterActive = selectedFilter !== "전체";
  const displayedNotes = notes.filter((note) => {
    if (!isFilterActive) return true;
    return note.category === selectedFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-zinc-900 transition-colors duration-200">
      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-400 text-zinc-950 shadow-sm flex items-center justify-center">
              <StickyNote className="w-5 h-5 fill-amber-200" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Post-it Todo List</span>
                {isSyncing && (
                  <span className="flex items-center text-[11px] font-normal text-amber-600 dark:text-amber-400 gap-1 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    시트 동기화 중...
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block">
                구글 스프레드시트 실시간 연동 포스트잇 보드
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 새로고침 버튼 */}
            <button
              onClick={loadNotes}
              disabled={isLoading || isSyncing}
              title="구글 시트에서 새로고침"
              className="p-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 에러 메시지 알림 배너 */}
      {errorMessage && (
        <div className="w-full bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 px-4 py-2 text-xs text-center border-b border-red-200 dark:border-red-900 flex items-center justify-center gap-2">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="underline font-bold ml-2 cursor-pointer"
          >
            닫기
          </button>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
        {/* 1. 입력 영역 (가운데 정렬) */}
        <section className="w-full flex justify-center mb-8">
          <PostItInput onAddNote={handleAddNote} />
        </section>

        {/* 2. 필터 및 상태 카운트 바 */}
        <section className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">
              전체 메모: {notes.length}개
            </span>
            <span>•</span>
            <span>완료: {notes.filter((n) => n.state === "완료").length}개</span>
            <span>•</span>
            <span>미완료: {notes.filter((n) => n.state === "미완료").length}개</span>
          </div>

          {/* 카테고리 필터 드롭다운 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <label
              htmlFor="filter-select"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400"
            >
              필터:
            </label>
            <select
              id="filter-select"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
              className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 3. 포스트잇 카드 그리드 with DnD */}
        <section className="w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                구글 스프레드시트에서 포스트잇을 불러오는 중...
              </p>
            </div>
          ) : displayedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-zinc-800 flex items-center justify-center text-amber-500 mb-3">
                <StickyNote className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                표시할 포스트잇이 없습니다
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                상단의 입력창에 새로운 메모나 할 일을 작성해보세요!
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayedNotes.map((n) => n.timestamp)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {displayedNotes.map((note) => (
                    <PostItCard
                      key={note.timestamp}
                      note={note}
                      isDraggable={!isFilterActive}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEditNote}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </main>

      {/* 세련된 푸터 영역 */}
      <footer className="w-full mt-auto border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/40 backdrop-blur-md py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-xs font-medium tracking-tight text-zinc-600 dark:text-zinc-400">
              Copyright INU Post-it Todo List by{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-200 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
                inu_acyoon0213
              </span>
            </p>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
            Powered by Next.js &amp; Google Apps Script
          </p>
        </div>
      </footer>
    </div>
  );
}
