export type CategoryType = "할 일" | "아이디어" | "기타";
export type StateType = "완료" | "미완료";

export interface PostItNote {
  timestamp: string; // 고유 ID 역할 (예: "1728392400000")
  datetime: string;  // 작성일시 (예: "2026.10.08 14:30 목요일")
  category: CategoryType;
  content: string;
  color: string;
  state: StateType;  // "완료" | "미완료"
  order: number;
}

export const POSTIT_COLORS = [
  "#FEF08A", // 노란색
  "#FBCFE8", // 분홍색
  "#BBF7D0", // 초록색
  "#BFDBFE", // 파랑색
];

export function getRandomColor(): string {
  const index = Math.floor(Math.random() * POSTIT_COLORS.length);
  return POSTIT_COLORS[index];
}

const DAYS_OF_WEEK = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export function formatPostItDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const dayName = DAYS_OF_WEEK[date.getDay()];

  return `${year}.${month}.${day} ${hours}:${minutes} ${dayName}`;
}
