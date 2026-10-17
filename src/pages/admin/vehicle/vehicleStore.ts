import { create } from 'zustand';
// 경로가 프로젝트 구조에 맞게 정확한지 확인해주세요 (예시: 상위 폴더로 가는 경로)
import { adminApi, vehicleChangeRequestApi } from '../../../api/vehicleApi';
// ========================================
// 1. 타입 정의
// ========================================

export type VehicleType = '승용차' | 'SUV' | '승합차' | '경차';
export type FineStatus = '조치 중' | '조치 완료' | '미조치' | '처리 불가';
export type FineReason = '지정구역 위반' | '장기 주차' | '통행 방해' | '기타';
export type AdditionalVehicleStatus = '접수' | '승인' | '반려' | '취소';
export type RegistrationSource = '기존등록' | '추가등록';

export interface Vehicle {
  vehicleid: number;
  officeid?: number;
  building?: string;
  vehiclenumber: string;
  vehiclemodel: string;
  ownername: string;
  officenumber?:string | null;
  vehicletypecode: string;
  registrationtypecode: string;
  registrationstatuscode: string;
  registeredat: string;
  rejectedreason: string;
  createdat: string;
  updatedat: string;
  deletedat: string;
}

export interface Fine {
  id: number;
  vehicleid: number;
  violationdate: string;
  reason: FineReason;
  amount: number;
  status: FineStatus;
  memo: string;
}

export interface AdditionalVehicleRequest {
  id: number;
  vehiclenumber: string;
  vehicletype: VehicleType;
  vehiclemodel: string;
  building?: string | null;
  officenumber?: string | null;
  ownername: string;
  registeredat: string;
  requestedat: string;
  requeststatus: AdditionalVehicleStatus;
  requestmemo: string;
}

export type AdditionalVehicleInput = Omit<
  AdditionalVehicleRequest,
  'id' | 'requestedAt' | 'requestStatus'
> & { officeid: number };

// ========================================
// 2. 백엔드 API DTO 타입
// ========================================

interface VehicleApiDTO {
  vehicleid?: number;
  officeid?: number;
  officenumber: string | null;
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

type VehicleApiPayload = Omit<VehicleApiDTO, 'vehicleid'>;

// ========================================
// 3. 공통 함수 및 매퍼
// ========================================

function normalizeDate(value?: string | null): string {
  if (!value) return '';
  return value;
}

function mapVehicle(item: VehicleApiDTO): Vehicle {
  return {
    vehicleid: Number(item.vehicleid ?? 0),
    officeid: Number(item.officeid ?? 0),
    officenumber: item.officenumber ?? null,
    vehiclenumber: item.vehiclenumber ?? '',
    vehiclemodel: item.vehiclemodel ?? '',
    ownername: item.ownername ?? '',
    vehicletypecode: item.vehicletypecode ?? '',
    registrationtypecode: item.registrationtypecode ?? 'INITIAL',
    registrationstatuscode: item.registrationstatuscode ?? '',
    registeredat: normalizeDate(item.registeredat),
    rejectedreason: item.rejectedreason ?? '',
    createdat: normalizeDate(item.createdat),
    updatedat: normalizeDate(item.updatedat),
    deletedat: normalizeDate(item.deletedat),
  };
}

function toApiPayload(vehicle: Vehicle): VehicleApiPayload {
  return {
    officeid: vehicle.officeid,
    vehiclenumber: vehicle.vehiclenumber,
    vehiclemodel: vehicle.vehiclemodel,
    ownername: vehicle.ownername,
    officenumber: vehicle.officenumber || null,
    vehicletypecode: vehicle.vehicletypecode,
    registrationtypecode: vehicle.registrationtypecode,
    registrationstatuscode: vehicle.registrationstatuscode,
    registeredat: vehicle.registeredat || null,
    rejectedreason: vehicle.rejectedreason,
    createdat: vehicle.createdat || null,
    updatedat: vehicle.updatedat || null,
    deletedat: vehicle.deletedat || null,
  };
}

export const normalizeVehicleNumber = (vehicleNumber: string): string =>
  vehicleNumber.replace(/\s/g, '').toLowerCase();

export const getToday = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createId = (usedIds: number[]): number => {
  const maxId = usedIds.reduce((max, id) => Math.max(max, id), 0);
  return Math.max(Date.now(), maxId + 1);
};

// ========================================
// 4. Zustand Store 인터페이스
// ========================================

interface VehicleStore {
  vehicles: Vehicle[];
  fines: Fine[];
  additionalVehicleRequests: AdditionalVehicleRequest[];

  fetchVehicles: () => Promise<void>;
  addVehicle: (vehicle: Vehicle) => Promise<boolean>;
  updateVehicle: (vehicle: Vehicle) => Promise<boolean>;
  deleteVehicle: (vehicleid: number) => Promise<void>;

  addFine: (fine: Fine) => void;
  updateFine: (fine: Fine) => void;
  deleteFine: (fineid: number) => void;

  getVehicleById: (vehicleid: number) => Vehicle | undefined;

  submitAdditionalVehicleRequest: (vehicle: AdditionalVehicleInput) => Promise<boolean>;
  approveAdditionalVehicleRequest: (
    requestid: number,
    reviewerAdminId: number,
  ) => Promise<boolean>;
  rejectAdditionalVehicleRequest: (
    requestid: number,
    reviewerAdminId: number,
    reason: string,
  ) => Promise<boolean>;
  cancelAdditionalVehicleRequest: (requestid: number) => Promise<boolean>;
  fetchAdditionalVehicleRequests: () => Promise<void>;
}

// ========================================
// 5. Zustand Store 구현 (adminApi 적용)
// ========================================

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  fines: [],
  additionalVehicleRequests: [],
  fetchAdditionalVehicleRequests: async () => {
    try {
      const response = await vehicleChangeRequestApi.getRequests();

      const requests: AdditionalVehicleRequest[] = response.map((item) => ({
        id: Number(item.vehiclechangerequestid ?? 0),
        vehiclenumber: item.requestedvehiclenumber ?? '',
        vehicletype: '승용차',
        vehiclemodel: item.requestedvehiclemodel ?? '',
        ownername: item.requestedownername ?? '',
        registeredat: item.requestedat ?? '',
        requestedat: item.requestedat ?? '',
        requeststatus:
          item.requeststatuscode === 'APPROVED'
            ? '승인'
            : item.requeststatuscode === 'REJECTED'
              ? '반려'
              : item.requeststatuscode === 'CANCELLED'
                ? '취소'
                : '접수',
        requestmemo: item.reviewreason ?? item.requestreason ?? '',
        building: null,
        officenumber: item.officenumber ?? null,
      }));

      set({ additionalVehicleRequests: requests });
    } catch (error) {
      console.error('추가 차량 신청 목록 조회 실패:', error);
      throw error;
    }
  },
  // ------------------------------------
  // 차량 목록 조회: GET /vehicles (adminApi 사용)
  // ------------------------------------
  // 예시: vehicleStore.ts 내부의 fetchVehicles 구현부
  // vehicleStore.ts 내부의 fetchVehicles 부분

  fetchVehicles: async () => {
    try {
      // console.log('API 기본 주소:', adminApi.defaults.baseURL);

      const response = await adminApi.get('/api/vehicle');
      // console.log('실제 요청 주소:', response.config.url);
      // console.log('응답 최종 주소:', response.request?.responseURL);
      // console.log('응답 데이터:', response.data);

      const vehicleList = Array.isArray(response.data)
        ? response.data
        : (response.data?.content ?? response.data?.data ?? []);
      const mappedVehicles = vehicleList.map((item: VehicleApiDTO) => mapVehicle(item));
      set({ vehicles: mappedVehicles });
    } catch (error) {
      console.error('차량 목록 조회 실패:', error);
    }
  },

  // ------------------------------------
  // 차량 등록: POST /vehicles (adminApi 사용)
  // ------------------------------------
  addVehicle: async (vehicle) => {
    const normalizedNumber = normalizeVehicleNumber(vehicle.vehiclenumber);
    if (!normalizedNumber) return false;

    const duplicate = get().vehicles.some(
      (item) => normalizeVehicleNumber(item.vehiclenumber) === normalizedNumber,
    );
    if (duplicate) return false;

    try {
      const payload = toApiPayload(vehicle);
      await adminApi.post('/api/vehicle', payload);
      await get().fetchVehicles();
      return true;
    } catch (error) {
      console.error('차량 등록 실패:', error);
      throw error;
    }
  },

  // ------------------------------------
  // 차량 수정: PUT /vehicles/{vehicleId} (adminApi 사용)
  // ------------------------------------
  updateVehicle: async (vehicle) => {
    const vehicleid = vehicle.vehicleid;
    const exists = get().vehicles.some((item) => item.vehicleid === vehicleid);
    if (!exists) return false;

    const normalizedNumber = normalizeVehicleNumber(vehicle.vehiclenumber);
    if (!normalizedNumber) return false;

    const duplicate = get().vehicles.some(
      (item) =>
        item.vehicleid !== vehicleid &&
        normalizeVehicleNumber(item.vehiclenumber) === normalizedNumber,
    );
    if (duplicate) return false;

    try {
      const payload = toApiPayload(vehicle);
      await adminApi.put(`/api/vehicle/${vehicleid}`, payload);
      await get().fetchVehicles();
      return true;
    } catch (error) {
      console.error('차량 수정 실패:', error);
      throw error;
    }
  },

  // ------------------------------------
  // 차량 삭제: DELETE /vehicles/{vehicleId} (adminApi 사용)
  // ------------------------------------
  deleteVehicle: async (vehicleid) => {
    try {
      await adminApi.delete(`/api/vehicle/${vehicleid}`);
      set((state) => ({
        vehicles: state.vehicles.filter((v) => v.vehicleid !== vehicleid),
        fines: state.fines.filter((f) => f.vehicleid !== vehicleid),
      }));
    } catch (error) {
      console.error('차량 삭제 실패:', error);
      throw error;
    }
  },

  // 과태료 관련 로컬 상태 함수들
  addFine: (fine) => {
    const state = get();
    const vehicleExists = state.vehicles.some((v) => v.vehicleid === fine.vehicleid);
    if (!vehicleExists) return;

    const fineExists = state.fines.some((item) => item.id === fine.id);
    if (fineExists) return;

    set((current) => ({ fines: [...current.fines, fine] }));
  },

  updateFine: (fine) => {
    set((state) => ({
      fines: state.fines.map((item) => (item.id === fine.id ? fine : item)),
    }));
  },

  deleteFine: (fineId) => {
    set((state) => ({
      fines: state.fines.filter((fine) => fine.id !== fineId),
    }));
  },
  getVehicleById: (vehicleId) =>
    get().vehicles.find((vehicle) => vehicle.vehicleid === vehicleId),

  // 추가 차량 신청 관련 로컬 상태 함수들
  // 추가 차량 신청
  submitAdditionalVehicleRequest: async (vehicle) => {
    const state = get();
    const normalizedNumber = normalizeVehicleNumber(vehicle.vehiclenumber);

    if (!normalizedNumber) return false;

    const existsVehicle = state.vehicles.some(
      (item) => normalizeVehicleNumber(item.vehiclenumber) === normalizedNumber,
    );

    if (existsVehicle) return false;

    const existsRequest = state.additionalVehicleRequests.some(
      (item) =>
        normalizeVehicleNumber(item.vehiclenumber) === normalizedNumber &&
        (item.requeststatus === '접수' || item.requeststatus === '승인'),
    );

    if (existsRequest) return false;

    try {
      await vehicleChangeRequestApi.create({
        officeid: vehicle.officeid,
        requesttypecode: 'ADD',
        requestedvehiclenumber: vehicle.vehiclenumber,
        requestedvehiclemodel: vehicle.vehiclemodel,
        requestedownername: vehicle.ownername,
        requestedvehicletypecode: 'PERSONAL',
        requestreason: vehicle.requestmemo ?? '',
      });

      return true;
    } catch (error) {
      console.error('추가 차량 신청 실패:', error);
      return false;
    }
  },

  // 추가 차량 신청 승인
  approveAdditionalVehicleRequest: async (requestid, reviewerAdminId) => {
    const request = get().additionalVehicleRequests.find((item) => item.id === requestid);

    if (!request || request.requeststatus !== '접수') return false;

    const normalizedNumber = normalizeVehicleNumber(request.vehiclenumber);

    if (!normalizedNumber) return false;

    const duplicateVehicle = get().vehicles.some(
      (item) => normalizeVehicleNumber(item.vehiclenumber) === normalizedNumber,
    );

    if (duplicateVehicle) return false;

    try {
      await vehicleChangeRequestApi.review(requestid, {
        requeststatuscode: 'APPROVED',
        revieweradminid: reviewerAdminId,
        reviewreason: '',
      });

      await get().fetchVehicles();

      set((state) => ({
        additionalVehicleRequests: state.additionalVehicleRequests.map((item) =>
          item.id === requestid
            ? { ...item, requestStatus: '승인', requestMemo: '' }
            : item,
        ),
      }));

      return true;
    } catch (error) {
      console.error('차량 신청 승인 실패:', error);
      return false;
    }
  },

  // 추가 차량 신청 반려
  rejectAdditionalVehicleRequest: async (requestid, reviewerAdminId, reason) => {
    const request = get().additionalVehicleRequests.find((item) => item.id === requestid);

    if (!request || request.requeststatus !== '접수') return false;

    const trimmedReason = reason.trim();

    if (!trimmedReason) return false;

    try {
      await vehicleChangeRequestApi.review(requestid, {
        requeststatuscode: 'REJECTED',
        revieweradminid: reviewerAdminId,
        reviewreason: trimmedReason,
      });

      set((state) => ({
        additionalVehicleRequests: state.additionalVehicleRequests.map((item) =>
          item.id === requestid
            ? {
                ...item,
                requestStatus: '반려',
                requestMemo: trimmedReason,
              }
            : item,
        ),
      }));

      return true;
    } catch (error) {
      console.error('차량 신청 반려 실패:', error);
      return false;
    }
  },

  // 추가 차량 신청 취소
  cancelAdditionalVehicleRequest: async (requestid) => {
    const request = get().additionalVehicleRequests.find((item) => item.id === requestid);

    if (!request || request.requeststatus !== '접수') return false;

    try {
      await vehicleChangeRequestApi.cancel(requestid);

      set((state) => ({
        additionalVehicleRequests: state.additionalVehicleRequests.map((item) =>
          item.id === requestid ? { ...item, requestStatus: '취소' } : item,
        ),
      }));

      return true;
    } catch (error) {
      console.error('차량 신청 취소 실패:', error);
      return false;
    }
  },
}));
