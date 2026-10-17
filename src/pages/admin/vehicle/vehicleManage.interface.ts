import type {
  Vehicle,
  VehicleType,
  Fine,
  FineStatus,
  FineReason,
  AdditionalVehicleRequest,
  AdditionalVehicleInput,
  AdditionalVehicleStatus,
} from './vehicleStore';

// 차량 등록 및 수정 폼
export interface VehicleForm {
  vehiclenumber: string;
  vehicletype: VehicleType;
  vehiclemodel: string;
  building: string;
  unit: string;
  ownername: string;
  registeredat: string;
}

// 추가 차량 등록 신청 폼
export interface AdditionalVehicleForm {
  vehiclenumber: string;
  vehicletype: VehicleType;
  vehiclemodel: string;
  building: string;
  unit: string;
  ownername: string;
}

// 주정차 위반 등록 및 수정 폼
export interface FineForm {
  vehicleid: string;
  violationdate: string;
  reason: FineReason;
  amount: string;
  status: FineStatus;
  memo: string;
}

// 차량 번호 조회 결과
export interface VehiclePrediction {
  vehicleType: VehicleType;
}

// 차량 목록 표시용 타입
export type VehicleListItem = Vehicle & {
  registrationSource?: '기존등록' | '추가등록';
};

// 차량 등록 및 수정 폼 Props
export interface VehicleFormProps {
  editingVehicleId: number | null;
  vehicleForm: VehicleForm;
  prediction: VehiclePrediction | null;
  predictionChecked: boolean;
  isPredicting: boolean;
  onSubmit: (form: VehicleForm) => void;
  onCancel: () => void;
  onChange: (
    field: keyof VehicleForm,
    value: string,
  ) => void;
  onPredict: () => void;
}

// 차량 목록 Props
export interface VehicleListProps {
  vehicles: Vehicle[];
  vehicleSearch: string;
  onSearchChange: (value: string) => void;
  onRegister: () => void;
  onDetail: (vehicleId: number) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

// 차량 상세 화면 Props
export interface VehicleDetailProps {
  vehicle: Vehicle;
  fines?: Fine[];
  onBack: () => void;
  onEdit: (vehicle: Vehicle) => void;
}

// 차량 파일 업로드 Props
export interface VehicleFileUploadProps {
  onUpload: (file: File) => Promise<void>;
}

// 주정차 관리 Props
export interface FineManagementProps {
  onVehicleDetail: (vehicleId: number) => void;
}

// 추가 차량 등록 신청 관리 Props
export interface AdditionalVehicleManagementProps {
  requests?: AdditionalVehicleRequest[];
  onApprove?: (
    request: AdditionalVehicleRequest,
  ) => void;
  onReject?: (
    request: AdditionalVehicleRequest,
    reason: string,
  ) => void;
}

// 추가 차량 등록 신청 상세 Props
export interface AdditionalVehicleDetailProps {
  request: AdditionalVehicleRequest;
  onBack: () => void;
  onApprove: (
    request: AdditionalVehicleRequest,
  ) => void;
  onReject: (
    request: AdditionalVehicleRequest,
    reason: string,
  ) => void;
}

// 추가 차량 등록 신청 제출 Props
export interface AdditionalVehicleRequestFormProps {
  onSubmit: (
    form: AdditionalVehicleInput,
  ) => boolean;
  onCancel?: () => void;
}

// 추가 차량 등록 신청 목록 필터
export interface AdditionalVehicleFilter {
  keyword: string;
  status: '전체' | AdditionalVehicleStatus;
}

// 주정차 위반 필터
export interface FineFilter {
  keyword: string;
  status: '전체' | FineStatus;
}