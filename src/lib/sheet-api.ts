import { PostItNote } from "@/types/postit";

const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "";

/**
 * 1. 전체 메모 목록 조회 (Read)
 */
export async function fetchNotesFromSheet(): Promise<PostItNote[]> {
  if (!SCRIPT_URL) {
    console.warn("NEXT_PUBLIC_GOOGLE_SCRIPT_URL이 설정되어 있지 않습니다.");
    return [];
  }

  try {
    const res = await fetch(`${SCRIPT_URL}?action=read`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`시트 조회 요청 실패: ${res.status}`);
    }

    const result = await res.json();
    if (result.status === "success" && Array.isArray(result.data)) {
      // order 기준 오름차순 정렬 및 타입 보정
      const notes: PostItNote[] = result.data.map((item: any, index: number) => {
        let datetimeStr = String(item.datetime || "").trim();
        // 만약 datetime이 비어있다면 timestamp를 기반으로 변환
        if (!datetimeStr && item.timestamp) {
          const numTs = Number(item.timestamp);
          if (!isNaN(numTs)) {
            const { formatPostItDate } = require("@/types/postit");
            datetimeStr = formatPostItDate(new Date(numTs));
          }
        }

        return {
          timestamp: String(item.timestamp),
          datetime: datetimeStr,
          category: (["할 일", "아이디어", "기타"].includes(item.category)
            ? item.category
            : "기타") as PostItNote["category"],
          content: String(item.content || ""),
          color: String(item.color || "#FEF08A"),
          state: (item.state === "완료" || item.state === "completed" || item.state === true || item.state === "true")
            ? "완료"
            : "미완료",
          order: Number(item.order !== undefined && item.order !== "" ? item.order : index),
        };
      });

      notes.sort((a, b) => a.order - b.order);
      return notes;
    }

    return [];
  } catch (error) {
    console.error("fetchNotesFromSheet 에러:", error);
    throw error;
  }
}

/**
 * GAS POST 요청 전송 헬퍼
 * Google Apps Script Web App은 302 리다이렉트 후 응답하므로 redirect: 'follow' 필요
 * Content-Type text/plain으로 전송하여 CORS preflight(OPTIONS) 방지
 */
async function sendSheetPost(payload: any) {
  if (!SCRIPT_URL) return;

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    return await res.json().catch(() => ({ status: "success" }));
  } catch (error) {
    console.error("sendSheetPost 에러:", error);
    throw error;
  }
}

/**
 * 2. 메모 추가 (Create)
 */
export async function createNoteInSheet(note: PostItNote) {
  return await sendSheetPost({
    action: "create",
    data: {
      timestamp: note.timestamp,
      datetime: note.datetime,
      category: note.category,
      content: note.content,
      color: note.color,
      state: note.state,
      order: note.order,
    },
  });
}

/**
 * 3. 메모 수정 (Update)
 */
export async function updateNoteInSheet(data: Partial<PostItNote> & { timestamp: string }) {
  return await sendSheetPost({
    action: "update",
    data,
  });
}

/**
 * 4. 메모 삭제 (Delete)
 */
export async function deleteNoteInSheet(timestamp: string) {
  return await sendSheetPost({
    action: "delete",
    timestamp,
  });
}

/**
 * 5. 순서 저장 (Order)
 */
export async function updateOrdersInSheet(orders: { timestamp: string; order: number }[]) {
  return await sendSheetPost({
    action: "order",
    orders,
  });
}
