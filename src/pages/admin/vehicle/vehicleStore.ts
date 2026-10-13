import { create } from 'zustand';
import { vehicleListMock } from '../../../mock/vehicleMock';

export type VehicleType =
  | '승용차'
  | 'SUV'
  | '승합차'
  | '경차';

export type FineStatus =
  | '조치 중'
  | '조치 완료'
  | '미조치'
  | '처리 불가';

export type FineReason =
  | '지정구역 위반'
  | '장기 주차'
  | '통행 방해'
  | '기타';

export interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  building: string;
  unit: string;
  ownerName: string;
  registeredAt: string;
}

export interface Fine {
  id: number;
  vehicleId: number;
  violationDate: string;
  reason: FineReason;
  amount: number;
  status: FineStatus;
  memo: string;
}

interface VehicleStore {
  vehicles: Vehicle[];
  fines: Fine[];

  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (vehicleId: number) => void;

  addFine: (fine: Fine) => void;
  updateFine: (fine: Fine) => void;
  deleteFine: (fineId: number) => void;

  getVehicleById: (vehicleId: number) => Vehicle | undefined;
}

const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

const initialVehicles: Vehicle[] =
  vehicleListMock.map((vehicle) => ({
    id: Number(vehicle.id),
    vehicleNumber: String(
      vehicle.vehicleNumber ?? '',
    ),
    vehicleType:
      vehicle.vehicleType as VehicleType,
    vehicleModel:
      'Vehiclemodel' in vehicle
        ? String(
            (vehicle as {
              Vehiclemodel?: unknown;
            }).Vehiclemodel ?? '',
          )
        : '',
    building:
      'building' in vehicle
        ? String(
            (vehicle as {
              building?: unknown;
            }).building ?? '',
          )
        : '',
    unit:
      'unit' in vehicle
        ? String(
            (vehicle as {
              unit?: unknown;
            }).unit ?? '',
          )
        : '',
    ownerName: String(
      vehicle.ownerName ?? '',
    ),
    registeredAt: String(
      vehicle.registeredAt ?? getToday(),
    ),
  }));

export const useVehicleStore =
  create<VehicleStore>((set, get) => ({
    vehicles: initialVehicles,

    fines: [],

    addVehicle: (vehicle) => {
      set((state) => ({
        vehicles: [
          ...state.vehicles,
          vehicle,
        ],
      }));
    },

    updateVehicle: (vehicle) => {
      set((state) => ({
        vehicles: state.vehicles.map(
          (item) =>
            item.id === vehicle.id
              ? vehicle
              : item,
        ),
      }));
    },

    deleteVehicle: (vehicleId) => {
      set((state) => ({
        vehicles: state.vehicles.filter(
          (vehicle) =>
            vehicle.id !== vehicleId,
        ),
        fines: state.fines.filter(
          (fine) =>
            fine.vehicleId !== vehicleId,
        ),
      }));
    },

    addFine: (fine) => {
      set((state) => ({
        fines: [
          ...state.fines,
          fine,
        ],
      }));
    },

    updateFine: (fine) => {
      set((state) => ({
        fines: state.fines.map(
          (item) =>
            item.id === fine.id
              ? fine
              : item,
        ),
      }));
    },

    deleteFine: (fineId) => {
      set((state) => ({
        fines: state.fines.filter(
          (fine) =>
            fine.id !== fineId,
        ),
      }));
    },

    getVehicleById: (vehicleId) => {
      return get().vehicles.find(
        (vehicle) =>
          vehicle.id === vehicleId,
      );
    },
  }));
