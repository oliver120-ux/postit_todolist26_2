import { PostItNote } from "./postit";

export const INITIAL_MOCK_NOTES: PostItNote[] = [
  {
    timestamp: "1728392400001",
    content: "Next.js 14 App Router 구조 파악 및 레이아웃 설정하기 🚀",
    category: "할 일",
    color: "#FEF08A", // 노란색
    datetime: "2026.10.08 10:15 목요일",
    state: "완료",
    order: 0,
  },
  {
    timestamp: "1728392400002",
    content: "드래그 앤 드롭으로 자유롭게 메모 위치 옮길 수 있는 캔버스 뷰 구상해보기!",
    category: "아이디어",
    color: "#FBCFE8", // 분홍색
    datetime: "2026.10.08 11:40 목요일",
    state: "미완료",
    order: 1,
  },
  {
    timestamp: "1728392400003",
    content: "우유랑 계란 사러 마트 들르기 (퇴근길 필수 코스)",
    category: "할 일",
    color: "#BBF7D0", // 초록색
    datetime: "2026.10.08 14:05 목요일",
    state: "미완료",
    order: 2,
  },
  {
    timestamp: "1728392400004",
    content: "즐겨듣는 로파이(Lofi) 플레이리스트 북마크 정리해두기 🎧",
    category: "기타",
    color: "#BFDBFE", // 파랑색
    datetime: "2026.10.08 16:20 목요일",
    state: "미완료",
    order: 3,
  },
];
