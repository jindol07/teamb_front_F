import { userApi } from './axios';

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
  officeid?: number;
  officenumber?: string;
  officename?: string;
  } | null;
}

export const getSignedMileageAmount = (item: MileageHistoryDto): number => {
  const amount = Number(item.amount || 0);
  return item.mileagetypecode === 'USE' ? -Math.abs(amount) : amount;
};

const MILEAGE_HISTORY_URL = '/api/mileage/history';

export const mileageApi = {
  getHistory: async (): Promise<MileageHistoryDto[]> => {
    const response = await userApi.get<MileageHistoryDto[]>(MILEAGE_HISTORY_URL);
    return response.data;
  },
};
