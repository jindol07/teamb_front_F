import type {
  Fine,
  FineReason,
  FineStatus,
  Vehicle,
  VehicleType,
} from './vehicleStore';

// 추가 차량 등록 상태 타입 정의 (스토어에 없다면 여기서 관리)
export type AdditionalVehicleStatus =
  | '승인대기'
  | '승인완료'
  | '승인반려';

// 추가 차량 등록 신청 타입 정의
export interface AdditionalVehicleRequest extends Vehicle {
  requestStatus: AdditionalVehicleStatus;
  requestMemo?: string;
}

// 차량 관리 메뉴
export type ActiveMenu =
  | 'list'
  | 'register'
  | 'upload'
  | 'status'
  | 'edit'
  | 'additional' // 추가 차량 등록 메뉴 추가
  | 'detail';

// 차량 등록 및 수정 폼
export interface VehicleForm {
  vehicleNumber: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  building: string;
  unit: string;
  ownerName: string;
  registeredAt: string;
}

// 차량 종류 예측 결과
export interface VehiclePrediction {
  vehicleType: VehicleType;
}

// 주정차 위반 등록 및 수정 폼
export interface FineForm {
  vehicleId: string;
  violationDate: string;
  reason: FineReason;
  amount: string;
  status: FineStatus;
  memo: string;
}

// 메뉴 항목
export interface MenuItem {
  key: ActiveMenu;
  label: string;
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

// 차량 등록 및 수정 Props
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

// 차량 파일 업로드 Props
export interface VehicleFileUploadProps {
  onUpload: (file: File) => void | Promise<void>;
}

// 주정차 관리 Props
export interface FineManagementProps {
  onVehicleDetail: (vehicleId: number) => void;
}

// 차량 상세 Props
export interface VehicleDetailProps {
  vehicleId: number;
  onBack: () => void;
  onEdit: (vehicleId: number) => void;
}

// 추가 등록 신청 폼
export interface AdditionalVehicleForm {
  vehicleNumber: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  building: string;
  unit: string;
  ownerName: string;
}

// 관리자 추가 등록 차량 관리 Props (컴포넌트 구현과 일치하도록 수정)
export interface AdditionalVehicleManagementProps {
  requests: AdditionalVehicleRequest[];
  onApprove: (request: AdditionalVehicleRequest) => void;
  onReject: (
    request: AdditionalVehicleRequest,
    reason: string,
  ) => void;
}

// 기존 차량과 추가 등록 차량의 목록 표시용 타입
export interface VehicleListItem extends Vehicle {
  registrationSource?: '기존등록' | '추가등록';
  approvalStatus?: AdditionalVehicleStatus;
}

// 주정차 위반 등록 결과
export interface FineSubmitResult {
  success: boolean;
  message: string;
}

// 주정차 위반 수정 데이터
export interface FineEditPayload {
  fine: Fine;
}