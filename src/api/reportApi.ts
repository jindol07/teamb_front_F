import { adminApi, userApi } from './axios';

export type ReportStatus = 'RECEIVED' | 'ACCEPTED' | 'REJECTED';

export interface ReportRecord {
  reportid: number;
  reporterofficeid: number;
  reporterofficenumber?: string;
  targetvehicleid?: number | null;
  targetvehiclenumber: string;
  parkingspaceid?: number | null;
  reporttypecode: string;
  content: string;
  statuscode: ReportStatus;
  reviewreason?: string | null;
  createdat: string;
}

export interface ReportCreatePayload {
  targetVehicleNumber: string;
  reportTypeCode: string;
  content: string;
}

export interface ReportReviewPayload {
  statusCode: Exclude<ReportStatus, 'RECEIVED'>;
  reviewReason: string;
  violationTypeCode?: string;
  penaltyAmount?: number;
  rewardAmount?: number;
}

export const submitReport = async (payload: ReportCreatePayload): Promise<void> => {
  // The U backend globally maps JSON property names to snake_case.
  await userApi.post('/api/reports', {
    target_vehicle_number: payload.targetVehicleNumber,
    report_type_code: payload.reportTypeCode,
    content: payload.content,
  });
};

export const listReportsForAdmin = async (): Promise<ReportRecord[]> => {
  const response = await adminApi.get<ReportRecord[]>('/api/reports');
  return response.data;
};

export const reviewReport = async (id: number, payload: ReportReviewPayload): Promise<void> => {
  await adminApi.patch(`/api/reports/${id}/review`, payload);
};
