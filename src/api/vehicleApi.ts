import axios from 'axios';

// 관리자 서버 (MyBatis) - 앞에 export를 반드시 붙이기
export const adminApi = axios.create({
    baseURL: import.meta.env.VITE_BOOT_API_BASE_URL_A,
});

// 백엔드 Vehicle DTO 타입
export interface VehicleApiDTO {
  vehicleid?: number;
  officeid?: number;
  officenumber?: string | null;
  vehiclenumber?: string;
  vehiclemodel?: string;
  ownername?: string;
  vehicletypecode?: string;
  registrationtypecode?: string;
  registrationstatuscode?: string;
  registeredat?: string | null;
  rejectedreason?: string | null;
  createdat?: string | null;
  updatedat?: string | null;
  deletedat?: string | null;
}
// 백엔드 VehicleChangeRequestDTO 타입
export interface VehicleChangeRequestDTO{
  vehiclechangerequestid?: number;
  officeid?: number;
  officenumber?: string | null;
  targetvehicleid?: number;
  requesttypecode?: string;
  requestedvehiclenumber?: string;
  requestedvehiclemodel?: string;
  requestedownername?: string;
  requestedvehicletypecode?:string;
  requestreason?: string;
  requeststatuscode?:'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  revieweradminid?: number;
  reviewreason?: string;
  requestedat?: string;
  reviewedat?: string;
  appliedat?: string;
}


const VEHICLE_API_URL = '/api/vehicle';

export const vehicleApi = {
  getVehicles: async (): Promise<VehicleApiDTO[]> => {
    const response = await adminApi.get<VehicleApiDTO[]>(VEHICLE_API_URL);
    return response.data;
  },
  createVehicle: async (payload: VehicleApiDTO): Promise<void> => {
    await adminApi.post(VEHICLE_API_URL, payload);
  },
  updateVehicle: async (vehicleId: number, payload: VehicleApiDTO): Promise<void> => {
    await adminApi.put(`${VEHICLE_API_URL}/${vehicleId}`, payload);
  },
  deleteVehicle: async (vehicleId: number): Promise<void> => {
    await adminApi.delete(`${VEHICLE_API_URL}/${vehicleId}`);
  },
};

// 차량 등록 API
const VITE_BOOT_API_BASE_URL_A = '/api/vehiclech';
// console.log(
//   '관리자 API 주소:',
//   import.meta.env.VITE_BOOT_API_BASE_URL_A,
// ); => 로그 확인

export const vehicleChangeRequestApi = {
  // 차량 변경 요청 목록 조회
  getRequests: async (): Promise<VehicleChangeRequestDTO[]> => {
    const response = await adminApi.get<VehicleChangeRequestDTO[]>(
      VITE_BOOT_API_BASE_URL_A,
    );
    return response.data;
  },

  // 차량 변경 요청 등록
  create: async (payload: VehicleChangeRequestDTO): Promise<void> => {
    await adminApi.post(VITE_BOOT_API_BASE_URL_A, payload);
  },

  // 차량 변경 요청 승인 / 반려
  review: async (
    id: number,
    payload: VehicleChangeRequestDTO,
  ): Promise<void> => {
    await adminApi.put(`${VITE_BOOT_API_BASE_URL_A}/${id}`, payload);
  },

  // 차량 변경 요청 취소
  cancel: async (id: number): Promise<void> => {
    await adminApi.delete(`${VITE_BOOT_API_BASE_URL_A}/${id}`);
  },
};