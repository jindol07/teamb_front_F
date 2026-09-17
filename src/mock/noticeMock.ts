export interface Notice {
  id: number;
  title: string;
  writer: string;
  createdAt: string;
  views: number;
  category: string;                 // 공지 유형
  isPinned: boolean;                // 상단 고정 여부
  isImportant: boolean;             // 중요 공지 여부
  attachmentName: string | null;    // 첨부파일 이름
  attachmentUrl: string | null;     // 첨부파일 경로
  content: string;
}

export const noticeListMock: Notice[] = [
  {
    id: 1,
    title: '9월 정기 주차장 소독 안내',
    content: '9월 정기 주차장 소독 작업을 실시합니다.',
    writer: '관리자',
    createdAt: '2026-08-28',
    views: 128,

    category: '시설점검',
    isPinned: true,
    isImportant: true,
    attachmentName: '9월_주차장_소독안내.pdf',
    attachmentUrl: '/files/9월_주차장_소독안내.pdf',
  },

  {
    id: 2,
    title: '추석 연휴 주차장 운영시간 변경 안내',
    content: '추석 연휴 주차장 운영시간이 변경됩니다.',
    writer: '관리자',
    createdAt: '2026-08-25',
    views: 342,

    category: '이용안내',
    isPinned: true,
    isImportant: true,
    attachmentName: null,
    attachmentUrl: null,
  },

  {
    id: 3,
    title: '주차 예약 시스템 점검 완료 안내',
    content: '주차 예약 시스템의 점검이 완료되었습니다.',
    writer: '관리자',
    createdAt: '2026-08-20',
    views: 97,

    category: '시설점검',
    isPinned: false,
    isImportant: false,
    attachmentName: null,
    attachmentUrl: null,
  },

  {
    id: 4,
    title: '전기차 충전구역 신설 안내',
    content: '전기차 충전구역 신설.',
    writer: '관리자',
    createdAt: '2026-08-15',
    views: 210,
    category: '이용안내',
    isPinned: false,
    isImportant: false,
    attachmentName: '전기차_충전구역_안내.pdf',
    attachmentUrl: '/files/전기차_충전구역_안내.pdf',
  },

  {
    id: 5,
    title: '주차요금 정산 시스템 안내',
    content: '주차요금 정산 시스템이 업데이트되었습니다.',
    writer: '관리자',
    createdAt: '2026-08-10',
    views: 156,
    category: '주차요금',
    isPinned: false,
    isImportant: true,
    attachmentName: '주차요금_안내.pdf',
    attachmentUrl: '/files/주차요금_안내.pdf',
  },
];