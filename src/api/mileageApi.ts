import { adminApi, userApi } from './axios';

export interface MileageHistoryDto {
  mileagehistoryid: number;
  mileagetypecode: string;
  /** 적립은 양수, 사용은 음수 */
  amount: number;
  referencetypecode?: string | null;
  referenceid?: number | null;
  description?: string | null;
  createdat: string;
  office?: {
    office_id?: number;
    officeid?: number;
    officenumber?: string;
    officename?: string;
  } | null;
}

export type AdminMileageHistoryDto = Omit<MileageHistoryDto, 'createdat'> & { createdat: string | number };

export interface AdminMileagePayload {
  mileagetypecode: string;
  /** 적립은 양수, 사용은 음수로 저장합니다. */
  amount: number;
  referencetypecode?: string | null;
  referenceid?: number | null;
  description?: string | null;
  office: { office_id: number };
}

export const getSignedMileageAmount = (item: Pick<MileageHistoryDto, 'amount' | 'mileagetypecode'>): number => {
  const amount = Number(item.amount || 0);
  return item.mileagetypecode === 'USE' ? -Math.abs(amount) : amount;
};

const MILEAGE_HISTORY_URL = '/api/mileage/history';
const ADMIN_MILEAGE_URL = '/api/mileage';

/** 사용자 마일리지 조회 API(apcms_u). */
export const mileageApi = {
  getHistory: async (): Promise<MileageHistoryDto[]> => {
    const response = await userApi.get<MileageHistoryDto[]>(MILEAGE_HISTORY_URL);
    return response.data;
  },
};

/** 관리자 발급 API(apcms_a). adminApi가 관리자 JWT를 자동 첨부합니다. */
export const adminMileageApi = {
  getHistory: async (): Promise<AdminMileageHistoryDto[]> => {
    const response = await adminApi.get<AdminMileageHistoryDto[]>(ADMIN_MILEAGE_URL);
    return response.data;
  },
  create: async (payload: AdminMileagePayload): Promise<AdminMileageHistoryDto> => {
    const response = await adminApi.post<AdminMileageHistoryDto>(ADMIN_MILEAGE_URL, payload);
    return response.data;
  },
};