import { adminApi } from './axios';

export interface VehiclePenaltyDto {
  vehiclepenaltyid: number;
  vehicleid: number;
  violationtypecode: string;
  penaltyamount: number;
  reason: string | null;
  imposedbyadminid: number;
  imposedat: string | number | null;
  statuscode: string | null;
  vehicle?: {
    vehicleid?: number;
    vehiclenumber?: string;
  } | null;
}

export type VehiclePenaltyPayload = Pick<
  VehiclePenaltyDto,
  'vehicleid' | 'violationtypecode' | 'penaltyamount' | 'reason' | 'statuscode'
> & { imposedat?: number | null };

const BASE_PATH = '/api/vehiclepenalty';

export const vehiclePenaltyApi = {
  async list(): Promise<VehiclePenaltyDto[]> {
    const response = await adminApi.get<VehiclePenaltyDto[]>(BASE_PATH);
    return response.data;
  },

  async create(payload: VehiclePenaltyPayload): Promise<void> {
    await adminApi.post(BASE_PATH, payload);
  },

  async update(id: number, payload: VehiclePenaltyPayload): Promise<void> {
    await adminApi.put(`${BASE_PATH}/${id}`, payload);
  },

  async remove(id: number): Promise<void> {
    await adminApi.delete(`${BASE_PATH}/${id}`);
  },
};
