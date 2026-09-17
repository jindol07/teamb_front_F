export interface RecentEntry {
  id: number;
  vehicleNumber: string;
  time: string;
}

// 최근 입차 차량
export const recentEntriesMock: RecentEntry[] = [
  { id: 1, vehicleNumber: '12가 3456', time: '10:24' },
  { id: 2, vehicleNumber: '34나 7890', time: '10:12' },
  { id: 3, vehicleNumber: '90마 5566', time: '09:58' },
];

// 최근 출차 차량
export const recentExitsMock: RecentEntry[] = [
  { id: 1, vehicleNumber: '11바 2233', time: '10:05' },
  { id: 2, vehicleNumber: '22사 4455', time: '09:47' },
  { id: 3, vehicleNumber: '33아 6677', time: '09:30' },
];

export interface DashboardStats {
  todayReservationCount: number;
  unresolvedAlerts: number;
  usageRate: number; // %
}

export const dashboardStatsMock: DashboardStats = {
  todayReservationCount: 24,
  unresolvedAlerts: 2,
  usageRate: 69,
};
