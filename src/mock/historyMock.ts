export interface HistoryItem {
  id: number;
  datetime: string;
  vehicleNumber: string;
  action: '입차' | '출차' | '예약' | '예약취소';
  admin: string;
  status: '완료' | '처리중' | '오류';
}

export const historyListMock: HistoryItem[] = [
  {
    id: 1,
    datetime: '2026-08-31 10:24',
    vehicleNumber: '12가 3456',
    action: '입차',
    admin: '시스템',
    status: '완료',
  },
  {
    id: 2,
    datetime: '2026-08-31 10:05',
    vehicleNumber: '11바 2233',
    action: '출차',
    admin: '시스템',
    status: '완료',
  },
  {
    id: 3,
    datetime: '2026-08-31 09:40',
    vehicleNumber: '34나 7890',
    action: '예약',
    admin: '김관리',
    status: '완료',
  },
  {
    id: 4,
    datetime: '2026-08-31 09:12',
    vehicleNumber: '56다 1122',
    action: '예약취소',
    admin: '김관리',
    status: '처리중',
  },
];
