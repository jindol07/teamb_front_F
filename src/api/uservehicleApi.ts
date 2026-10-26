import { userApi } from './axios';

interface VehicleResponse {
  vehicleId?: number;
  vehicle_id?: number;
  vehicleid?: number;
  vehicleNumber?: string;
  vehicle_number?: string;
  vehiclenumber?: string;
  vehicleModel?: string | null;
  vehicle_model?: string | null;
  vehiclemodel?: string | null;
  registrationTypeCode?: string | null;
  registration_type_code?: string | null;
  registrationtypecode?: string | null;
}

export interface UserVehicle {
  id: number;
  vehicleNumber: string;
  vehicleModel: string;
  registrationTypeCode: string;
}

const toUserVehicle = (vehicle: VehicleResponse): UserVehicle => ({
  id: Number(vehicle.vehicleId ?? vehicle.vehicle_id ?? vehicle.vehicleid ?? 0),
  vehicleNumber: vehicle.vehicleNumber ?? vehicle.vehicle_number ?? vehicle.vehiclenumber ?? '',
  vehicleModel: vehicle.vehicleModel ?? vehicle.vehicle_model ?? vehicle.vehiclemodel ?? '',
  registrationTypeCode: (
    vehicle.registrationTypeCode ??
    vehicle.registration_type_code ??
    vehicle.registrationtypecode ??
    'INITIAL'
  ).toUpperCase(),
});

export const userVehicleApi = {
  getMine: async (): Promise<UserVehicle[]> => {
    const response = await userApi.get<VehicleResponse[]>('/api/vehicles/mine');
    return response.data.map(toUserVehicle);
  },

  requestRegistration: async (vehicleNumber: string, ownerName: string, vehicleModel: string): Promise<void> => {
    await userApi.post('/api/vehicles/mine/requests', {
      vehicle_number: vehicleNumber,
      owner_name: ownerName,
      vehicle_model: vehicleModel,
    });
  },

  delete: async (vehicleId: number): Promise<void> => {
    await userApi.delete(`/api/vehicles/${vehicleId}`);
  },
};
