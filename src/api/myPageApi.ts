import axios from 'axios';
import { userApi } from './axios';

export interface ChargeItem { id: number; type_name: string; amount: number; description: string | null; }
export interface OfficeCharge {
  id: number;
  year_month: string;
  total_amount: number;
  mileage_discount_amount: number;
  final_amount: number;
  status_code: string;
  status_name: string;
  items: ChargeItem[];
}
export interface CurrentCharges { year_month: string; mileage_balance: number; charges: OfficeCharge[]; }
export interface ParkingUsage {
  id: number; vehicle_number: string; entry_at: string; exit_at: string | null; parking_type_name: string;
}
export interface AcceptedReport {
  id: number; vehicle_number: string; type_name: string; status_name: string;
  review_reason: string | null; created_at: string; reviewed_at: string | null;
}
export interface VehiclePenalty {
  id: number; vehicle_number: string; type_name: string; penalty_amount: number;
  reason: string | null; imposed_at: string;
}
export interface MyPageResult<T> { content: T[]; number: number; total_pages: number; total_elements: number; }
type ServerPage<T> = MyPageResult<T> & { totalPages?: number; totalElements?: number };
// 서버 페이지 응답의 메타데이터 이름을 프론트의 공통 형식으로 정리한다.
const pageResult = <T,>(page: ServerPage<T>): MyPageResult<T> => ({
  content: page.content, number: page.number,
  total_pages: page.total_pages ?? page.totalPages ?? 0,
  total_elements: page.total_elements ?? page.totalElements ?? 0,
});

export const myPageApi = {
  // 관리자 코드는 변경하지 않고 당월 미반영 패널티를 관리비에 합산한다.
  async synchronizePenalties(signal?: AbortSignal) {
    return (await userApi.post<CurrentCharges>('/api/mypage/charges/current/penalties', undefined, { signal })).data;
  },
  // 본인 소속 차량의 실제 패널티 부과 금액과 위반 유형명을 조회한다.
  async penalties(page: number, signal?: AbortSignal) {
    return pageResult((await userApi.get<ServerPage<VehiclePenalty>>('/api/mypage/penalties', {
      params: { page, size: 10 }, signal,
    })).data);
  },
  // 현재 비밀번호와 새 비밀번호 확인 값을 서버의 변경 API에 전달한다.
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    await userApi.patch('/api/mypage/password', {
      current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword,
    });
  },
  // 현재 비밀번호와 탈퇴 확인 문구를 서버에 보내 회원 탈퇴를 요청한다.
  async withdraw(currentPassword: string, confirmation: string) {
    await userApi.post('/api/mypage/withdrawal', {
      current_password: currentPassword, confirmation,
    });
  },
  // 현재 사용자의 당월 관리비·상세 항목·마일리지 잔액을 조회한다.
  async charges(signal?: AbortSignal) {
    return (await userApi.get<CurrentCharges>('/api/mypage/charges/current', { signal })).data;
  },
  // 청구 ID와 금액·기존 누적 할인액을 전달해 관리비 마일리지 사용을 요청한다.
  async useMileage(chargeId: number, amount: number, expectedDiscountAmount: number) {
    return (await userApi.post<CurrentCharges>(`/api/mypage/charges/${chargeId}/mileage`, {
      amount, expected_discount_amount: expectedDiscountAmount,
    })).data;
  },
  // 현재 사용자의 주차 이용 내역을 지정한 페이지로 조회한다.
  async parking(page: number, signal?: AbortSignal) {
    return pageResult((await userApi.get<ServerPage<ParkingUsage>>('/api/mypage/parking-usages', {
      params: { page, size: 10 }, signal,
    })).data);
  },
  // 현재 사용자 차량에 대한 승인 신고 내역을 지정한 페이지로 조회한다.
  async reports(page: number, signal?: AbortSignal) {
    return pageResult((await userApi.get<ServerPage<AcceptedReport>>('/api/mypage/accepted-reports', {
      params: { page, size: 10 }, signal,
    })).data);
  },
};

// 서버 오류에서 사용자에게 표시할 메시지를 추출하거나 기본 안내를 반환한다.
export function myPageError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const message = data?.detail || data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (error.response?.status === 409) return '정보가 변경되었거나 사용할 수 없는 금액입니다. 새로 조회한 뒤 확인해 주세요.';
  }
  return fallback;
}

// 서버 일시를 재해석하지 않고 화면에 표시할 분 단위 문자열로 변환한다.
export const myPageDate = (value: string | null): string => value ? value.replace('T', ' ').slice(0, 16) : '—';
