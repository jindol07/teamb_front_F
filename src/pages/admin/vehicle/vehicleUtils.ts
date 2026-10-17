import type {
  AdditionalVehicleForm,
  FineForm,
  VehicleForm,
  VehiclePrediction,
} from './vehicleManage.interface';

import type {
  VehicleType,
} from './vehicleStore';

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
export const getToday = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, '0');
  const day = String(
    now.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// 차량 등록 폼 초기값
export const createInitialVehicleForm =
  (): VehicleForm => ({
    vehiclenumber: '',
    vehicletype: '승용차',
    vehiclemodel: '',
    building: '',
    unit: '',
    ownername: '',
    registeredat: getToday(),
  });

// 추가 등록 신청 폼 초기값
export const createInitialAdditionalVehicleForm =
  (): AdditionalVehicleForm => ({
    vehiclenumber: '',
    vehicletype: '승용차',
    vehiclemodel: '',
    building: '',
    unit: '',
    ownername: '',
  });

// 주정차 위반 폼 초기값
export const createInitialFineForm =
  (): FineForm => ({
    vehicleid: '',
    violationdate: getToday(),
    reason: '지정구역 위반',
    amount: '50000',
    status: '미조치',
    memo: '',
  });

// 차량번호 정규화
// 공백을 제거하고 영문자를 소문자로 통일
export const normalizeVehicleNumber = (
  vehicleNumber: string,
): string => {
  return vehicleNumber
    .replace(/\s/g, '')
    .toLowerCase();
};

// 차량 형태 예측
export const predictVehicle = (
  vehicleNumber: string,
): VehiclePrediction | null => {
  const normalizedNumber =
    normalizeVehicleNumber(vehicleNumber);

  if (!normalizedNumber) {
    return null;
  }

  const numberMatches =
    normalizedNumber.match(/\d/g);

  if (!numberMatches?.length) {
    return {
      vehicleType: '승용차',
    };
  }

  const lastNumber = Number(
    numberMatches[numberMatches.length - 1],
  );

  let vehicleType: VehicleType;

  switch (lastNumber) {
    case 0:
    case 5:
      vehicleType = 'SUV';
      break;

    case 1:
    case 6:
      vehicleType = '경차';
      break;

    case 2:
    case 7:
      vehicleType = '승합차';
      break;

    default:
      vehicleType = '승용차';
      break;
  }

  return {
    vehicleType,
  };
};