import { ChangeEvent, DragEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '../../../api/axios';
import { listReportsForAdmin, type ReportRecord } from '../../../api/reportApi';
import styles from './Vehicle.module.css';
import ApartmentMap from './apartment/ApartmentMap';
import VehicleDetail from './VehicleDetail';
import AdditionalVehicleManagement from './AdditionalVehicleManagement';
import AdditionalVehicleDetail from './AdditionalDetail';
import AdminReportManagement from './AdminReportManagement';
import { getAdmin } from '../../../auth/actions/authActions';
import {
  AdditionalVehicleRequest,
  Fine,
  FineReason,
  FineStatus,
  useVehicleStore,
  Vehicle,
  VehicleType,
} from './vehicleStore';

type ActiveMenu = 'list' | 'register' | 'upload' | 'status' | 'edit' | 'plus' | 'detail' | 'report';
type VehicleSummaryFilter = 'ALL' | 'REGISTERED' | 'ADDITIONAL' | 'VISIT' | 'PENDING';
const VEHICLE_PAGE_SIZE = 10;

interface VehicleForm {
  vehiclenumber: string;
  vehicletypecode: VehicleType;
  vehiclemodel: string;
  building: string;
  officenumber: string;
  officeid: number | null;
  ownername: string;
  registeredAt: string;
}

interface VehiclePrediction {
  vehicletypecode: VehicleType;
}

interface FineForm {
  vehicleid: string;
  violationdate: string;
  reason: FineReason;
  amount: string;
  status: FineStatus;
  memo: string;
}

const MENU_ITEMS: {
  key: ActiveMenu;
  label: string;
}[] = [
  { key: 'list', label: '차량 등록 현황' },
  { key: 'upload', label: '파일 업로드' },
  { key: 'status', label: '주정차 관리' },
  { key: 'plus', label: '신청 관리' },
  { key: 'report', label: '신고 검토' },
];

const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

const createInitialVehicleForm = (): VehicleForm => ({
  vehiclenumber: '',
  vehicletypecode: '개인차량',
  vehiclemodel: '',
  building: '',
  officenumber: '',
  officeid: null,
  ownername: '',
  registeredAt: getToday(),
});

const createInitialFineForm = (): FineForm => ({
  vehicleid: '',
  violationdate: getToday(),
  reason: '지정구역 위반',
  amount: '50000',
  status: '미조치',
  memo: '',
});

const isVehicleType = (value: string): value is VehicleType =>
  value === '개인차량' || value === '법인차량';

type NotificationSettings = {
  enabled: boolean;
  animation: 'shake' | 'bounce' | 'pulse' | 'none';
  iconSize: number;
  timing: 'new' | 'unread';
};

const NOTIFICATION_SETTINGS_KEY = 'vehicle-notification-settings';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  animation: 'shake',
  iconSize: 26,
  timing: 'new',
};

const getReviewerAdminId = async (): Promise<number | null> => {
  const response = await getAdmin();
  const admin = response?.data;
  const adminId = Number(admin?.adminid ?? admin?.adminId ?? admin?.admin_id);
  return Number.isInteger(adminId) && adminId > 0 ? adminId : null;
};

export default function VehicleManage() {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const fines = useVehicleStore((state) => state.fines);
  const fetchVehicles = useVehicleStore((state) => state.fetchVehicles);
  const addVehicle = useVehicleStore((state) => state.addVehicle);
  const updateVehicle = useVehicleStore((state) => state.updateVehicle);
  const deleteVehicle = useVehicleStore((state) => state.deleteVehicle);
  const addFine = useVehicleStore((state) => state.addFine);
  const updateFine = useVehicleStore((state) => state.updateFine);
  const deleteFine = useVehicleStore((state) => state.deleteFine);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>([]);
  const [isNotificationSettingsLoaded, setIsNotificationSettingsLoaded] = useState(false);
  const [reportRecords, setReportRecords] = useState<ReportRecord[]>([]);
  const refreshReportRecords = useCallback(async () => {
    try {
      setReportRecords(await listReportsForAdmin());
    } catch (error) {
      console.error('신고 알림 조회 실패:', error);
    }
  }, []);

  useEffect(() => {
    void refreshReportRecords();
    const timer = window.setInterval(() => void refreshReportRecords(), 5000);
    return () => window.clearInterval(timer);
  }, [refreshReportRecords]);

  const handleNotificationClick = (request: AdditionalVehicleRequest) => {
    setReadNotificationIds((prev) =>
      prev.includes(request.id) ? prev : [...prev, request.id],
    );

    setIsNotificationOpen(false);
    setSelectedAdditionalRequest(request);
    setActiveMenu('plus');
  };
  const [selectedAdditionalRequest, setSelectedAdditionalRequest] =
    useState<AdditionalVehicleRequest | null>(null);
  const fetchAdditionalVehicleRequests = useVehicleStore(
    (state) => state.fetchAdditionalVehicleRequests,
  );
  const additionalVehicleRequests = useVehicleStore(
    (state) => state.additionalVehicleRequests,
  );
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );

  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

  const updateNotificationSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetNotificationSettings = () => {
    setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
  };

  const [isBellAnimating, setIsBellAnimating] = useState(false);
  const [hasLoadedRequests, setHasLoadedRequests] = useState(false);

  const previousPendingIdsRef = useRef<number[] | null>(null);

  const pendingNotifications = additionalVehicleRequests.filter(
    (request) => request.requeststatus !== '승인' && request.requeststatus !== '반려',
  );
  const pendingReports = reportRecords.filter((report) => report.statuscode === 'RECEIVED');

  const unreadNotificationCount = pendingNotifications.filter(
    (request) => !readNotificationIds.includes(request.id),
  ).length + pendingReports.length;
  const approveAdditionalVehicleRequest = useVehicleStore(
    (state) => state.approveAdditionalVehicleRequest,
  );

  const rejectAdditionalVehicleRequest = useVehicleStore(
    (state) => state.rejectAdditionalVehicleRequest,
  );
  const fetchFines = useVehicleStore((state) => state.fetchFines);
  const [fineLoadError, setFineLoadError] = useState('');

  const handleApproveRequest = async (request: AdditionalVehicleRequest) => {
    const reviewerAdminId = await getReviewerAdminId();
    if (reviewerAdminId === null) {
      alert('로그인한 관리자 ID를 확인할 수 없습니다. 다시 로그인해주세요.');
      return false;
    }

    const success = await approveAdditionalVehicleRequest(request.id, reviewerAdminId);

    if (!success) {
      alert('차량 신청 승인에 실패했습니다.');
      return false;
    }

    await fetchVehicles();
    try {
      await fetchAdditionalVehicleRequests();
    } catch (error) {
      console.error('승인 후 신청 목록 새로고침 실패:', error);
    }

    alert('추가 차량 신청을 승인했습니다.');
    return true;
  };

  const handleRejectRequest = async (
    request: AdditionalVehicleRequest,
    reason: string,
  ) => {
    const reviewerAdminId = await getReviewerAdminId();
    if (reviewerAdminId === null) {
      alert('로그인한 관리자 ID를 확인할 수 없습니다. 다시 로그인해주세요.');
      return false;
    }

    const success = await rejectAdditionalVehicleRequest(request.id, reviewerAdminId, reason);

    if (!success) {
      alert('차량 신청 반려에 실패했습니다. 반려 사유를 확인해주세요.');
      return false;
    }

    try {
      await fetchAdditionalVehicleRequests();
    } catch (error) {
      console.error('반려 후 신청 목록 새로고침 실패:', error);
    }

    alert('차량 신청을 반려했습니다.');
    return true;
  };
  useEffect(() => {
    fetchVehicles().catch((error) => {
      console.error('차량 목록 조회 실패:', error);
    });
    fetchAdditionalVehicleRequests()
      .then(() => setHasLoadedRequests(true))
      .catch((error) => {
        console.error('추가 차량 신청 목록 조회 실패:', error);
        setHasLoadedRequests(true);
      });
    fetchFines()
      .then(() => setFineLoadError(''))
      .catch((error) => {
        console.error('주정차 위반 목록 조회 실패:', error);
        setFineLoadError(
          '주정차 위반 목록을 불러오지 못했습니다. API 주소와 서버 상태를 확인해주세요.',
        );
      });
  }, [fetchVehicles, fetchAdditionalVehicleRequests, fetchFines]);
  // 저장된 알림 설정 불러오기
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);

        setNotificationSettings({
          enabled:
            typeof parsed.enabled === 'boolean'
              ? parsed.enabled
              : DEFAULT_NOTIFICATION_SETTINGS.enabled,
          animation: ['shake', 'bounce', 'pulse', 'none'].includes(parsed.animation)
            ? parsed.animation
            : DEFAULT_NOTIFICATION_SETTINGS.animation,
          iconSize:
            typeof parsed.iconSize === 'number' &&
            parsed.iconSize >= 18 &&
            parsed.iconSize <= 36
              ? parsed.iconSize
              : DEFAULT_NOTIFICATION_SETTINGS.iconSize,
          timing: ['new', 'unread'].includes(parsed.timing)
            ? parsed.timing
            : DEFAULT_NOTIFICATION_SETTINGS.timing,
        });
      }
    } catch (error) {
      console.error('알림 설정 불러오기 실패:', error);
    } finally {
      setIsNotificationSettingsLoaded(true);
    }
  }, []);

  // 설정 변경 시 자동 저장
  useEffect(() => {
    if (!isNotificationSettingsLoaded) return;

    try {
      localStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(notificationSettings),
      );
    } catch (error) {
      console.error('알림 설정 저장 실패:', error);
    }
  }, [notificationSettings, isNotificationSettingsLoaded]);

  // 새 신청 ID가 추가됐을 때 애니메이션 실행
  useEffect(() => {
    if (
      !hasLoadedRequests ||
      !notificationSettings.enabled ||
      notificationSettings.animation === 'none' ||
      notificationSettings.timing !== 'new'
    )
      return;

    const currentIds = [
      ...pendingNotifications.map((request) => request.id),
      ...pendingReports.map((report) => -report.reportid),
    ];
    const previousIds = previousPendingIdsRef.current;

    if (previousIds !== null && currentIds.some((id) => !previousIds.includes(id))) {
      setIsBellAnimating(true);
    }

    previousPendingIdsRef.current = currentIds;
  }, [
    additionalVehicleRequests,
    reportRecords,
    hasLoadedRequests,
    notificationSettings.enabled,
    notificationSettings.animation,
    notificationSettings.timing,
  ]);

  // 애니메이션 종료
  useEffect(() => {
    if (!isBellAnimating) return;

    const timeoutId = window.setTimeout(() => {
      setIsBellAnimating(false);
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [isBellAnimating]);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('list');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(createInitialVehicleForm());
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<VehiclePrediction | null>(null);
  const [predictionChecked, setPredictionChecked] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehiclePage, setVehiclePage] = useState(1);
  const [vehicleSummaryFilter, setVehicleSummaryFilter] =
    useState<VehicleSummaryFilter>('ALL');
  const [fineForm, setFineForm] = useState<FineForm>(createInitialFineForm());
  const [editingFineId, setEditingFineId] = useState<number | null>(null);
  const [deletingFine, setDeletingFine] = useState<Fine | null>(null);
  const [fineSearch, setFineSearch] = useState('');
  const [fineStatusFilter, setFineStatusFilter] = useState<'전체' | FineStatus>('전체');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    details?: string[];
  } | null>(null);

  const registeredNumbers = new Set(
    vehicles.map((vehicle) => vehicle.vehiclenumber.replace(/\s/g, '').toLowerCase()),
  );
  const approvedRequestRows = additionalVehicleRequests
    .filter(
      (request) =>
        request.requesttypecode === 'ADD' &&
        request.requeststatus === '승인' &&
        !registeredNumbers.has(request.vehiclenumber.replace(/\s/g, '').toLowerCase()),
    )
    .map((request) => ({
      vehicleid: -request.id,
      vehiclenumber: request.vehiclenumber,
      vehicletypecode: request.vehicletype,
      vehiclemodel: request.vehiclemodel,
      ownername: request.ownername,
      officenumber: request.officenumber,
      registeredat: request.registeredat || request.requestedat,
      registrationtypecode: 'ADDITIONAL',
      isApprovedRequest: true,
    }));
  const vehicleRows = [
    ...vehicles.map((vehicle) => ({ ...vehicle, isApprovedRequest: false })),
    ...approvedRequestRows,
  ];
  const isRegisteredVehicle = (vehicle: (typeof vehicleRows)[number]) =>
    vehicle.isApprovedRequest ||
    ('registrationstatuscode' in vehicle &&
      ['REGISTERED', 'APPROVED'].includes(vehicle.registrationstatuscode));

  const filteredVehicles = vehicleRows.filter((vehicle) => {
    const matchesSummaryFilter = (() => {
      switch (vehicleSummaryFilter) {
        case 'REGISTERED':
          return isRegisteredVehicle(vehicle);
        case 'ADDITIONAL':
          return vehicle.registrationtypecode === 'ADDITIONAL' && isRegisteredVehicle(vehicle);
        case 'VISIT':
          return vehicle.vehicletypecode === 'VISIT';
        case 'PENDING':
          return 'registrationstatuscode' in vehicle &&
            vehicle.registrationstatuscode === 'REQUESTED';
        default:
          return true;
      }
    })();
    if (!matchesSummaryFilter) return false;

    const keyword = vehicleSearch.trim().toLowerCase();

    if (!keyword) return true;

    return (
      vehicle.vehiclenumber.toLowerCase().includes(keyword) ||
      vehicle.ownername.toLowerCase().includes(keyword) ||
      String((vehicle as any).building ?? '')
        .toLowerCase()
        .includes(keyword) ||
      String(vehicle.officenumber ?? '')
        .toLowerCase()
        .includes(keyword)
    );
  });
  const vehiclePageCount = Math.max(1, Math.ceil(filteredVehicles.length / VEHICLE_PAGE_SIZE));
  const currentVehiclePage = Math.min(vehiclePage, vehiclePageCount);
  const pagedVehicles = filteredVehicles.slice(
    (currentVehiclePage - 1) * VEHICLE_PAGE_SIZE,
    currentVehiclePage * VEHICLE_PAGE_SIZE,
  );
  const firstVehiclePage = Math.max(1, Math.min(currentVehiclePage - 2, vehiclePageCount - 4));
  const vehiclePageNumbers = Array.from(
    { length: Math.min(5, vehiclePageCount) },
    (_, index) => firstVehiclePage + index,
  );
  const filteredFines = fines.filter((fine) => {
    const keyword = fineSearch.trim().toLowerCase();
    const vehicle = vehicles.find((item) => item.vehicleid === fine.vehicleid);
    const matchesKeyword =
      !keyword ||
      vehicle?.vehiclenumber.toLowerCase().includes(keyword) ||
      vehicle?.ownername.toLowerCase().includes(keyword) ||
      fine.reason.toLowerCase().includes(keyword);

    const matchesStatus = fineStatusFilter === '전체' || fine.status === fineStatusFilter;
    return matchesKeyword && matchesStatus;
  });

  const resetVehicleForm = () => {
    setVehicleForm(createInitialVehicleForm());
    setPrediction(null);
    setPredictionChecked(false);
    setIsPredicting(false);
    setEditingVehicleId(null);
  };

  const resetFineForm = () => {
    setFineForm(createInitialFineForm());
    setEditingFineId(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const vehiclenumber = vehicleForm.vehiclenumber.trim();
    const ownername = vehicleForm.ownername.trim();
    const building = vehicleForm.building.trim();
    const officenumber = vehicleForm.officenumber.trim();

    if (vehicleForm.officeid == null || vehicleForm.officeid <= 0) {
      alert('실제 호실 정보를 확인할 수 없습니다. 호실을 다시 선택해주세요.');
      return;
    }

    if (!vehiclenumber) {
      alert('차량번호를 입력해주세요.');
      return;
    }
    if (!ownername) {
      alert('차주명을 입력해주세요.');
      return;
    }
    if (!building) {
      alert('동을 선택해주세요.');
      return;
    }
    if (!officenumber) {
      alert('호수를 선택해주세요.');
      return;
    }

    const normalizedNumber = vehiclenumber.replace(/\s/g, '').toLowerCase();
    const duplicateVehicle = vehicles.find(
      (vehicle) =>
        vehicle.vehiclenumber.replace(/\s/g, '').toLowerCase() === normalizedNumber &&
        vehicle.vehicleid !== editingVehicleId,
    );

    if (duplicateVehicle) {
      alert('이미 등록된 차량번호입니다.');
      return;
    }

    if (editingVehicleId !== null) {
      const existingVehicle = vehicles.find((v) => v.vehicleid === editingVehicleId);
      const success = await updateVehicle({
        vehicleid: editingVehicleId,
        officeid: existingVehicle ? existingVehicle.officeid : 0,
        vehiclenumber,
        vehiclemodel: vehicleForm.vehiclemodel,
        ownername,
        vehicletypecode: vehicleForm.vehicletypecode,
        registrationtypecode: existingVehicle
          ? existingVehicle.registrationtypecode
          : 'INITIAL',
        registrationstatuscode: existingVehicle
          ? existingVehicle.registrationstatuscode
          : 'REGISTERED',
        registeredat: vehicleForm.registeredAt || getToday(),
        rejectedreason: existingVehicle ? existingVehicle.rejectedreason : '',
        ...({ building, officenumber } as any),
      });

      if (!success) {
        alert('차량 정보 수정에 실패했습니다.');
        return;
      }

      alert('차량 정보가 수정되었습니다.');
      const updatedId = editingVehicleId;
      resetVehicleForm();
      setSelectedVehicleId(updatedId);
      setActiveMenu('detail');
      return;
    }

    const newVehicle: Vehicle = {
      vehicleid: 0,
      officeid: vehicleForm.officeid,
      vehiclenumber,
      vehiclemodel: vehicleForm.vehiclemodel,
      ownername,
      vehicletypecode: vehicleForm.vehicletypecode,
      registrationtypecode: 'INITIAL',
      registrationstatuscode: 'REGISTERED',
      registeredat: vehicleForm.registeredAt || getToday(),
      rejectedreason: '',
      ...({ building, officenumber } as any),
    };

    const success = await addVehicle(newVehicle);
    if (!success) {
      alert('차량 등록에 실패했습니다.');
      return;
    }

    alert('차량이 등록되었습니다.');
    resetVehicleForm();
    setActiveMenu('list');
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.vehicleid);
    setVehicleForm({
      vehiclenumber: vehicle.vehiclenumber,
      vehicletypecode: vehicle.vehicletypecode as VehicleType,
      vehiclemodel: vehicle.vehiclemodel,
      building: (vehicle as any).building || '',
      officenumber: (vehicle as any).unit || '',
      officeid: null,
      ownername: vehicle.ownername,
      registeredAt: vehicle.registeredat || getToday(),
    });
    const result = isVehicleType(vehicle.vehicletypecode)
      ? { vehicletypecode: vehicle.vehicletypecode }
      : null;
    setPrediction(result);
    setPredictionChecked(true);
    setActiveMenu('register');
  };

  const handleMoveToRegister = () => {
    resetVehicleForm();
    setActiveMenu('register');
  };

  const handleVehicleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVehicleForm((prev) => ({ ...prev, vehiclenumber: e.target.value }));
    setPrediction(null);
    setPredictionChecked(false);
  };

  const handleVehiclePrediction = () => {
    const vehiclenumber = vehicleForm.vehiclenumber.trim();
    if (!vehiclenumber) {
      alert('차량번호를 입력해주세요.');
      return;
    }
    setIsPredicting(true);
    const normalizedNumber = vehiclenumber.replace(/\s/g, '').toLowerCase();
    const matchedVehicle = vehicles.find(
      (vehicle) =>
        vehicle.vehiclenumber.replace(/\s/g, '').toLowerCase() === normalizedNumber,
    );
    const result =
      matchedVehicle && isVehicleType(matchedVehicle.vehicletypecode)
        ? { vehicletypecode: matchedVehicle.vehicletypecode }
        : null;
    setPrediction(result);
    setPredictionChecked(true);
    setIsPredicting(false);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVehicleForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleFileSelection = (file: File | undefined) => {
    if (!file) return;
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setUploadFeedback({
        type: 'error',
        title: '지원하지 않는 파일 형식',
        message: 'xlsx 또는 xls 파일만 업로드할 수 있습니다.',
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleFileDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsFileDragging(true);
  };

  const handleFileDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    const nextTarget = e.relatedTarget;
    if (!(nextTarget instanceof Node) || !e.currentTarget.contains(nextTarget)) {
      setIsFileDragging(false);
    }
  };

  const handleFileDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsFileDragging(false);
    handleFileSelection(e.dataTransfer.files?.[0]);
  };

  const handleFileUpload = async (): Promise<void> => {
    if (!selectedFile || isUploading) {
      if (!selectedFile) {
        setUploadFeedback({
          type: 'error',
          title: '파일을 선택해주세요',
          message: '업로드할 엑셀 파일을 먼저 선택해주세요.',
        });
      }
      return;
    }

    const fileName = selectedFile.name.toLowerCase();
    const isValid = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isValid) {
      setUploadFeedback({
        type: 'error',
        title: '지원하지 않는 파일 형식',
        message: 'xlsx 또는 xls 파일만 업로드할 수 있습니다.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setIsUploading(true);
      const response = await adminApi.post('/api/vehicleup/upload-excel', formData);
      const result = response.data as {
        totalCount?: number;
        successCount?: number;
        failureCount?: number;
        errors?: string[];
      };
      setSelectedFile(null);
      void fetchVehicles().catch((refreshError) => {
        console.error('업로드 후 차량 목록 새로고침 실패:', refreshError);
      });

      const totalCount = result?.totalCount ?? 0;
      const successCount = result?.successCount ?? 0;
      const failureCount = result?.failureCount ?? 0;
      const details = Array.isArray(result?.errors) ? result.errors : [];
      const message = totalCount > 0
        ? `전체 ${totalCount}건 중 ${successCount}건 등록, ${failureCount}건 실패했습니다.`
        : '차량 정보 파일 처리가 완료되었습니다.';

      setUploadFeedback({
        type: failureCount === 0 ? 'success' : successCount === 0 ? 'error' : 'warning',
        title: failureCount === 0 ? '업로드 성공' : successCount === 0 ? '업로드 실패' : '일부 차량 등록 실패',
        message,
        details,
      });
    } catch (error) {
      console.error('차량 파일 업로드 오류:', error);
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : undefined;
      setUploadFeedback({
        type: 'error',
        title: '업로드 실패',
        message: message || '파일 업로드에 실패했습니다. 파일 형식과 서버 연결을 확인해주세요.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFineSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const vehicleid = Number(fineForm.vehicleid);
    const amount = Number(fineForm.amount.replace(/,/g, ''));

    if (!vehicleid) {
      alert('차량을 선택해주세요.');
      return;
    }
    if (!fineForm.violationdate) {
      alert('주차위반 날짜를 선택해주세요.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('올바른 주정차 위반 정보를 입력해주세요.');
      return;
    }

    const fine: Fine = {
      id: editingFineId ?? Date.now(),
      vehicleid,
      violationdate: fineForm.violationdate,
      reason: fineForm.reason,
      amount,
      status: fineForm.status,
      memo: fineForm.memo.trim(),
    };

    const saved = editingFineId !== null ? await updateFine(fine) : await addFine(fine);
    if (!saved) {
      alert(
        `주정차 위반 ${editingFineId !== null ? '수정' : '등록'}에 실패했습니다. 입력값과 관리자 권한을 확인해주세요.`,
      );
      return;
    }
    resetFineForm();
    alert(`주정차 위반 정보가 ${editingFineId !== null ? '수정' : '등록'}되었습니다.`);
  };

  const handleFineFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFineForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFine = (fine: Fine) => {
    setEditingFineId(fine.id);
    setFineForm({
      vehicleid: String(fine.vehicleid),
      violationdate: fine.violationdate,
      reason: fine.reason,
      amount: String(fine.amount),
      status: fine.status,
      memo: fine.memo,
    });
  };

  const handleDeleteFine = async (fine: Fine) => {
    const deleted = await deleteFine(fine.id);
    if (!deleted) {
      alert(
        '주정차 위반 정보 삭제에 실패했습니다. 서버 연결과 관리자 권한을 확인해주세요.',
      );
      return;
    }
    if (editingFineId === fine.id) resetFineForm();
    setDeletingFine(null);
  };

  const bellAnimationClass = (() => {
    if (!notificationSettings.enabled || notificationSettings.animation === 'none')
      return '';

    // 대기 중인 신청이 하나라도 있으면 확인/처리 완료될 때까지 계속 흔듭니다.
    if (pendingNotifications.length === 0) return '';

    if (notificationSettings.animation === 'shake')
      return styles.notificationBellPersistentShake;
    if (notificationSettings.animation === 'bounce')
      return styles.notificationBellPersistentBounce;
    if (notificationSettings.animation === 'pulse')
      return styles.notificationBellPersistentPulse;
    return '';
  })();

  return (
    <div className={styles.vehiclePage}>
      <div className={styles.pageHeading}>
        <h2 className={styles.pageTitle}>차량관리</h2>

        <div className={styles.notificationWrapper}>
          <button
            type="button"
            className={styles.notificationButton}
            aria-label={`차량 신청 및 신고 알림 ${unreadNotificationCount}개`}
            aria-expanded={isNotificationOpen}
            onClick={() => setIsNotificationOpen((prev) => !prev)}
          >
            <svg
              className={`${styles.notificationBell} ${bellAnimationClass}`}
              style={{
                width: `${notificationSettings.iconSize}px`,
                height: `${notificationSettings.iconSize + 4}px`,
              }}
              xmlns="http://www.w3.org/2000/svg"
              width={notificationSettings.iconSize}
              height={notificationSettings.iconSize + 4}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>

            {unreadNotificationCount > 0 && (
              <span className={styles.notificationBadge}>
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className={styles.notificationPanel}>
              <div className={styles.notificationHeader}>
                <strong>신청 및 신고 알림</strong>
                <span>{unreadNotificationCount}개의 새 알림</span>
              </div>

              <div className={styles.notificationSettingsArea}>
                <button
                  type="button"
                  className={styles.notificationSettingsToggle}
                  aria-expanded={isNotificationSettingsOpen}
                  onClick={() => setIsNotificationSettingsOpen((prev) => !prev)}
                >
                  <span>⚙️ 알림 커스텀 설정</span>
                  <span>{isNotificationSettingsOpen ? '접기 −' : '설정 열기 +'}</span>
                </button>

                {isNotificationSettingsOpen && (
                  <div className={styles.notificationSettings}>
                    <label className={styles.notificationSettingRow}>
                      <span>
                        <strong>알림 애니메이션</strong>
                        <small>종 아이콘 움직임 사용 여부</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.enabled}
                        onChange={(event) =>
                          updateNotificationSetting('enabled', event.target.checked)
                        }
                      />
                    </label>

                    <label className={styles.notificationSettingField}>
                      <span>움직임 스타일</span>
                      <select
                        value={notificationSettings.animation}
                        onChange={(event) =>
                          updateNotificationSetting(
                            'animation',
                            event.target.value as NotificationSettings['animation'],
                          )
                        }
                        disabled={!notificationSettings.enabled}
                      >
                        <option value="shake">좌우로 흔들기</option>
                        <option value="bounce">통통 튀기</option>
                        <option value="pulse">커졌다 작아지기</option>
                        <option value="none">움직임 없음</option>
                      </select>
                    </label>

                    <label className={styles.notificationSettingField}>
                      <span>
                        <span>종 아이콘 크기</span>
                        <strong>{notificationSettings.iconSize}px</strong>
                      </span>
                      <input
                        type="range"
                        min={18}
                        max={36}
                        step={1}
                        value={notificationSettings.iconSize}
                        onChange={(event) =>
                          updateNotificationSetting(
                            'iconSize',
                            Number(event.target.value),
                          )
                        }
                      />
                    </label>

                    <label className={styles.notificationSettingField}>
                      <span>애니메이션 실행 기준</span>
                      <select
                        value={notificationSettings.timing}
                        onChange={(event) =>
                          updateNotificationSetting(
                            'timing',
                            event.target.value as NotificationSettings['timing'],
                          )
                        }
                        disabled={
                          !notificationSettings.enabled ||
                          notificationSettings.animation === 'none'
                        }
                      >
                        <option value="new">새 신청이 들어왔을 때</option>
                        <option value="unread">읽지 않은 신청이 있을 때</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      className={styles.notificationSettingsReset}
                      onClick={resetNotificationSettings}
                    >
                      기본 설정으로 초기화
                    </button>
                  </div>
                )}
              </div>

              {pendingNotifications.length === 0 && pendingReports.length === 0 ? (
                <div className={styles.notificationEmpty}>
                  새로운 차량 신청이나 신고가 없습니다.
                </div>
              ) : (
                <div className={styles.notificationList}>
                  {pendingNotifications.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      className={`${styles.notificationItem} ${
                        !readNotificationIds.includes(request.id)
                          ? styles.notificationUnread
                          : ''
                      }`}
                      onClick={() => handleNotificationClick(request)}
                    >
                      <span className={styles.notificationDot} />
                      <span className={styles.notificationText}>
                        <strong>차량 등록 신청</strong>
                        <span>
                          {request.ownername} · {request.vehiclenumber}
                        </span>
                        <small>{request.requestedat || '신청 시간 정보 없음'}</small>
                      </span>
                    </button>
                  ))}
                  {pendingReports.map((report) => (
                    <button
                      key={`report-${report.reportid}`}
                      type="button"
                      className={`${styles.notificationItem} ${styles.notificationUnread}`}
                      onClick={() => {
                        setIsNotificationOpen(false);
                        setActiveMenu('report');
                        void refreshReportRecords();
                      }}
                    >
                      <span className={styles.notificationDot} />
                      <span className={styles.notificationText}>
                        <strong>신고 접수</strong>
                        <span>{report.targetvehiclenumber} · {report.reporterofficenumber ?? `신고 #${report.reportid}`}</span>
                        <small>{report.createdat ? new Date(report.createdat).toLocaleString('ko-KR') : ''}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={styles.notificationFooter}
                onClick={() => {
                  setIsNotificationOpen(false);
                  setActiveMenu('plus');
                }}
              >
                신청 관리로 이동
              </button>
              {pendingReports.length > 0 && (
                <button
                  type="button"
                  className={styles.notificationFooter}
                  onClick={() => { setIsNotificationOpen(false); setActiveMenu('report'); }}
                >
                  신고 검토로 이동
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <p className={styles.pageDescription}>
        등록된 차량 및 주정차 위반 정보를 관리합니다.
      </p>

      <div className={styles.vehicleMenu}>
        {MENU_ITEMS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={activeMenu === key ? styles.active : ''}
            onClick={async () => {
              if (key === 'list') resetVehicleForm();
              setActiveMenu(key);
              if (key === 'plus') {
                try {
                  await fetchAdditionalVehicleRequests();
                } catch {
                  alert('추가 차량 신청 목록을 불러오지 못했습니다.');
                }
              }
              if (key === 'report') await refreshReportRecords();
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeMenu === 'detail' && selectedVehicleId !== null ? (
        <VehicleDetail
          vehicleId={selectedVehicleId}
          onBack={() => {
            setActiveMenu('list');
            setSelectedVehicleId(null);
          }}
          onEdit={(id) => {
            const targetVehicle = vehicles.find((v) => v.vehicleid === id);
            if (targetVehicle) handleEditVehicle(targetVehicle);
          }}
        />
      ) : (
        <>
          {activeMenu === 'list' && (
            <div className={styles.vehicleContent}>
              <div className={styles.contentHeader}>
                <div>
                  <h3>차량 등록 현황</h3>
                  <p>등록된 차량을 검색하여 관리할 수 있습니다.</p>
                </div>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleMoveToRegister}
                >
                  + 차량 등록
                </button>
              </div>

              <div className={styles.vehicleSummary}>
                <button
                  type="button"
                  className={`${styles.summaryItem} ${styles.summaryItemButton} ${vehicleSummaryFilter === 'ALL' ? styles.summaryItemActive : ''}`}
                  aria-pressed={vehicleSummaryFilter === 'ALL'}
                  onClick={() => { setVehicleSummaryFilter('ALL'); setVehiclePage(1); }}
                >
                  <span>전체 차량</span>
                  <strong>
                    {vehicleRows.length}
                    <small>대</small>
                  </strong>
                </button>
                <button
                  type="button"
                  className={`${styles.summaryItem} ${styles.summaryItemButton} ${vehicleSummaryFilter === 'REGISTERED' ? styles.summaryItemActive : ''}`}
                  aria-pressed={vehicleSummaryFilter === 'REGISTERED'}
                  onClick={() => { setVehicleSummaryFilter('REGISTERED'); setVehiclePage(1); }}
                >
                  <span>등록된 차량</span>
                  <strong className={styles.summaryNormal}>
                    {vehicleRows.filter(isRegisteredVehicle).length}
                    <small>대</small>
                  </strong>
                </button>
                <button
                  type="button"
                  className={`${styles.summaryItem} ${styles.summaryItemButton} ${vehicleSummaryFilter === 'ADDITIONAL' ? styles.summaryItemActive : ''}`}
                  aria-pressed={vehicleSummaryFilter === 'ADDITIONAL'}
                  onClick={() => { setVehicleSummaryFilter('ADDITIONAL'); setVehiclePage(1); }}
                >
                  <span>추가 등록 차량</span>
                  <strong>
                    {
                      vehicleRows.filter(
                        (v) =>
                          v.registrationtypecode === 'ADDITIONAL' &&
                          isRegisteredVehicle(v),
                      ).length
                    }
                    <small>대</small>
                  </strong>
                </button>
                <button
                  type="button"
                  className={`${styles.summaryItem} ${styles.summaryItemButton} ${vehicleSummaryFilter === 'VISIT' ? styles.summaryItemActive : ''}`}
                  aria-pressed={vehicleSummaryFilter === 'VISIT'}
                  onClick={() => { setVehicleSummaryFilter('VISIT'); setVehiclePage(1); }}
                >
                  <span>방문 차량</span>
                  <strong className={styles.summaryStopped}>
                    {vehicles.filter((v) => v.vehicletypecode === 'VISIT').length}
                    <small>대</small>
                  </strong>
                </button>
                <button
                  type="button"
                  className={`${styles.summaryItem} ${styles.summaryItemButton} ${vehicleSummaryFilter === 'PENDING' ? styles.summaryItemActive : ''}`}
                  aria-pressed={vehicleSummaryFilter === 'PENDING'}
                  onClick={() => { setVehicleSummaryFilter('PENDING'); setVehiclePage(1); }}
                >
                  <span>접수중인 차량</span>
                  <strong>
                    {
                      vehicles.filter((v) => v.registrationstatuscode === 'REQUESTED')
                        .length
                    }
                    <small>대</small>
                  </strong>
                </button>
              </div>

              {vehicleRows.length > 0 && (
                <div className={styles.vehicleToolbar}>
                  <div className={styles.searchBox}>
                    <span aria-hidden="true">⌕</span>
                    <input
                      type="text"
                      value={vehicleSearch}
                      onChange={(e) => { setVehicleSearch(e.target.value); setVehiclePage(1); }}
                      placeholder="차량번호, 차주명 검색"
                    />
                  </div>
                </div>
              )}

              {vehicleRows.length === 0 ? (
                <div className={styles.emptyVehicle}>
                  <div className={styles.emptyIcon}>🚗</div>
                  <strong>등록된 차량이 없습니다.</strong>
                  <p>차량을 등록하면 이곳에서 차량 등록 현황을 확인할 수 있습니다.</p>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleMoveToRegister}
                  >
                    + 첫 차량 등록
                  </button>
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className={styles.emptySearch}>
                  <strong>검색 결과가 없습니다.</strong>
                  <p>검색어를 변경해주세요.</p>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setVehicleSearch('');
                      setVehicleSummaryFilter('ALL');
                    }}
                  >
                    필터 초기화
                  </button>
                </div>
              ) : (
                <div className={styles.vehicleTableWrap}>
                  <table className={styles.vehicleTable}>
                    <thead>
                      <tr>
                        <th>차량번호</th>
                        <th>차종</th>
                        <th>차량 모델</th>
                        <th>차주</th>
                        <th>호수</th>
                        <th>등록일 / 신청일</th>
                        <th>등록 구분</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedVehicles.map((vehicle) => (
                        <tr key={vehicle.vehicleid}>
                          <td>
                            {vehicle.isApprovedRequest ? (
                              <span>{vehicle.vehiclenumber}</span>
                            ) : (
                              <button
                                type="button"
                                className={styles.vehicleDetailLink}
                                onClick={() => {
                                  setSelectedVehicleId(vehicle.vehicleid);
                                  setActiveMenu('detail');
                                }}
                              >
                                {vehicle.vehiclenumber}
                              </button>
                            )}
                          </td>
                          <td>{vehicle.vehicletypecode}</td>
                          <td>{vehicle.vehiclemodel || '-'}</td>
                          <td>{vehicle.ownername || '-'}</td>
                          <td>
                            {(vehicle as any).officenumber
                              ? `${vehicle.officenumber}호`
                              : '-'}
                          </td>
                          <td>{vehicle.registeredat}</td>
                          <td>
                            {vehicle.registrationtypecode === 'ADDITIONAL'
                              ? '추가 등록'
                              : '기존 등록'}
                            {'registrationstatuscode' in vehicle &&
                              vehicle.registrationstatuscode === 'REJECTED' && (
                                <small> · 반려</small>
                              )}
                            {vehicle.isApprovedRequest && <small> · 신청 승인</small>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {filteredVehicles.length > 0 && (
                <nav className={styles.vehiclePagination} aria-label="차량 등록 현황 페이지">
                  <span className={styles.vehiclePageSummary}>
                    {(currentVehiclePage - 1) * VEHICLE_PAGE_SIZE + 1}–{Math.min(currentVehiclePage * VEHICLE_PAGE_SIZE, filteredVehicles.length)} / {filteredVehicles.length}대
                  </span>
                  <div className={styles.vehiclePageControls}>
                    <button type="button" onClick={() => setVehiclePage(1)} disabled={currentVehiclePage === 1} aria-label="첫 페이지">«</button>
                    <button type="button" onClick={() => setVehiclePage(currentVehiclePage - 1)} disabled={currentVehiclePage === 1} aria-label="이전 페이지">‹</button>
                    {vehiclePageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={pageNumber === currentVehiclePage ? styles.vehicleActivePage : undefined}
                        onClick={() => setVehiclePage(pageNumber)}
                        aria-current={pageNumber === currentVehiclePage ? 'page' : undefined}
                        aria-label={`${pageNumber}페이지`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button type="button" onClick={() => setVehiclePage(currentVehiclePage + 1)} disabled={currentVehiclePage === vehiclePageCount} aria-label="다음 페이지">›</button>
                    <button type="button" onClick={() => setVehiclePage(vehiclePageCount)} disabled={currentVehiclePage === vehiclePageCount} aria-label="마지막 페이지">»</button>
                  </div>
                </nav>
              )}
            </div>
          )}

          {activeMenu === 'register' && (
            <div
              className={`${styles.vehicleContent} ${styles.vehicleRegistrationScreen}`}
            >
              <div className={styles.contentHeader}>
                <div>
                  <h3>{editingVehicleId !== null ? '차량 정보 수정' : '차량 등록'}</h3>
                  <p>상가 배치도에서 세대를 선택하고 차량 정보를 입력해주세요.</p>
                </div>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    resetVehicleForm();
                    setActiveMenu('list');
                  }}
                >
                  차량 등록 현황
                </button>
              </div>

              <div className={styles.registerLayout}>
                <div className={styles.apartmentMapArea}>
                  <ApartmentMap
                    selectedBuilding={vehicleForm.building}
                    selectedUnit={vehicleForm.officenumber}
                    onUnitSelect={(building, officenumber, officeid) => {
                      setVehicleForm((prev) => ({
                        ...prev,
                        building,
                        officenumber,
                        officeid,
                      }));
                    }}
                  />
                </div>

                <form className={styles.vehicleForm} onSubmit={handleSubmit}>
                  <div className={styles.formGroup}>
                    <label>선택 호수</label>
                    <div className={styles.selectedUnit}>
                      {vehicleForm.building && vehicleForm.officenumber ? (
                        <>
                          <strong>
                            {vehicleForm.building}동 {vehicleForm.officenumber}호
                          </strong>
                          <span>선택된 호수</span>
                        </>
                      ) : (
                        <span>상가 배치도에서 세대를 선택해주세요.</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="vehiclenumber">차량번호</label>
                    <div className={styles.inputWithButton}>
                      <input
                        id="vehiclenumber"
                        name="vehiclenumber"
                        value={vehicleForm.vehiclenumber}
                        onChange={handleVehicleNumberChange}
                        placeholder="예: 12가 3456"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleVehiclePrediction}
                        disabled={isPredicting}
                      >
                        {isPredicting ? '조회 중...' : '조회'}
                      </button>
                    </div>
                    {predictionChecked && (
                      <div
                        className={`${styles.predictionResult} ${!prediction ? styles.predictionUnavailable : ''}`}
                      >
                        {prediction ? (
                          <>
                            등록된 차량 형태:{' '}
                            <strong>{prediction.vehicletypecode}</strong>
                          </>
                        ) : (
                          '등록된 차량에서 형태를 찾지 못했습니다. 아래에서 직접 선택해주세요.'
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="vehicletypecode">차량 형태</label>
                    <select
                      id="vehicletypecode"
                      name="vehicletypecode"
                      value={vehicleForm.vehicletypecode}
                      onChange={handleFormChange}
                    >
                      <option value="개인차량">개인차량</option>
                      <option value="법인차량">법인차량</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="ownerName">차주</label>
                    <input
                      id="ownerName"
                      name="ownername"
                      value={vehicleForm.ownername}
                      onChange={handleFormChange}
                      placeholder="차주명을 입력하세요"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="vehicleModel">차량 모델</label>
                    <input
                      id="vehicleModel"
                      name="vehiclemodel"
                      value={vehicleForm.vehiclemodel}
                      onChange={handleFormChange}
                      placeholder="차량 모델을 입력하세요"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="registeredAt">등록일</label>
                    <input
                      id="registeredAt"
                      name="registeredAt"
                      type="date"
                      value={vehicleForm.registeredAt}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className={styles.formActions}>
                    {editingVehicleId !== null && (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          resetVehicleForm();
                          setActiveMenu('list');
                        }}
                      >
                        수정 취소
                      </button>
                    )}
                    <button type="submit" className={styles.primaryButton}>
                      {editingVehicleId !== null ? '수정 완료' : '차량 등록'}
                    </button>
                  </div>
                </form>
              </div>

              {approvedRequestRows.length > 0 && (
                <section
                  className={styles.approvedVehicleSection}
                  aria-labelledby="approvedVehicleTitle"
                >
                  <div className={styles.contentHeader}>
                    <div>
                      <h3 id="approvedVehicleTitle">승인된 추가 차량</h3>
                      <p>승인된 추가 차량 신청 내역입니다.</p>
                    </div>
                    <span>{approvedRequestRows.length}대</span>
                  </div>
                  <div className={styles.vehicleTableWrap}>
                    <table className={styles.vehicleTable}>
                      <thead>
                        <tr>
                          <th>차량번호</th>
                          <th>차종</th>
                          <th>차량 모델</th>
                          <th>차주</th>
                          <th>호수</th>
                          <th>승인일</th>
                          <th>구분</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedRequestRows.map((vehicle) => (
                          <tr key={vehicle.vehicleid}>
                            <td>{vehicle.vehiclenumber}</td>
                            <td>{vehicle.vehicletypecode}</td>
                            <td>{vehicle.vehiclemodel || '-'}</td>
                            <td>{vehicle.ownername || '-'}</td>
                            <td>
                              {vehicle.officenumber ? `${vehicle.officenumber}호` : '-'}
                            </td>
                            <td>{vehicle.registeredat || '-'}</td>
                            <td>추가 등록 · 신청 승인</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeMenu === 'upload' && (
            <div className={styles.vehicleContent}>
              <div className={styles.contentHeader}>
                <div>
                  <h3>차량 정보 파일 업로드</h3>
                  <p>엑셀 파일을 선택하여 차량 정보를 업로드합니다.</p>
                </div>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setActiveMenu('list')}
                >
                  차량 등록 현황
                </button>
              </div>

              <div className={`${styles.fileUpload} ${styles.excel}`}>
                <input
                  id="vehicleFile"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <label
                  htmlFor="vehicleFile"
                  className={`${styles.fileUploadLabel} ${isFileDragging ? styles.fileUploadDragging : ''}`}
                  onDragOver={handleFileDragOver}
                  onDragLeave={handleFileDragLeave}
                  onDrop={handleFileDrop}
                >
                  <span className={styles.fileUploadIcon}>📊</span>
                  <span className={styles.fileUploadText}>
                    <span className={styles.fileUploadTitle}>
                      {isFileDragging ? '파일을 여기에 놓으세요' : 'Excel 파일 선택'}
                    </span>
                    <span className={styles.fileUploadDescription}>
                      XLSX, XLS 파일을 끌어다 놓거나 파일 선택 버튼을 누르세요.
                    </span>
                  </span>
                  <span className={styles.fileUploadButton}>파일 선택</span>
                </label>

                {selectedFile && (
                  <div className={styles.fileSelected}>
                    <span className={styles.fileSelectedIcon}>✓</span>
                    <span className={styles.fileSelectedInfo}>
                      <span className={styles.fileSelectedName}>{selectedFile.name}</span>
                      <span className={styles.fileSelectedType}>차량 정보 파일</span>
                    </span>
                    <button
                      type="button"
                      className={styles.fileRemoveButton}
                      onClick={() => setSelectedFile(null)}
                      aria-label="파일 삭제"
                      disabled={isUploading}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  초기화
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={!selectedFile || isUploading}
                  onClick={handleFileUpload}
                >
                  {isUploading ? '업로드 중...' : '파일 업로드'}
                </button>
              </div>
            </div>
          )}

          {activeMenu === 'plus' &&
            (selectedAdditionalRequest ? (
              <AdditionalVehicleDetail
                request={selectedAdditionalRequest}
                onBack={() => setSelectedAdditionalRequest(null)}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
              />
            ) : (
              <AdditionalVehicleManagement
                requests={additionalVehicleRequests}
                onDetail={(request) => setSelectedAdditionalRequest(request)}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
              />
            ))}

          {activeMenu === 'report' && (
            <AdminReportManagement
              initialReports={reportRecords}
              onReportsChange={setReportRecords}
            />
          )}

          {activeMenu === 'status' && (
            <div className={styles.vehicleContent}>
              <div className={styles.contentHeader}>
                <div>
                  <h3>주정차 관리</h3>
                  <p>차량의 주정차 위반 정보를 관리합니다.</p>
                </div>
                <span className={styles.headerCount}>
                  위반 <strong>{fines.length}</strong>건
                </span>
              </div>

              <div className={styles.vehicleSummary}>
                <div className={styles.summaryItem}>
                  <span>전체 벌칙금</span>
                  <strong>
                    {fines.length}
                    <small>건</small>
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>미조치</span>
                  <strong>
                    {fines.filter((fine) => fine.status === '미조치').length}
                    <small>건</small>
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>조치 중</span>
                  <strong className={styles.summaryStopped}>
                    {fines.filter((fine) => fine.status === '조치 중').length}
                    <small>건</small>
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>조치 완료</span>
                  <strong className={styles.summaryNormal}>
                    {fines.filter((fine) => fine.status === '조치 완료').length}
                    <small>건</small>
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>처리 불가</span>
                  <strong>
                    {fines.filter((fine) => fine.status === '처리 불가').length}
                    <small>건</small>
                  </strong>
                </div>
              </div>

              <div className={styles.fineWorkspace}>
                <div
                  className={editingFineId !== null ? styles.modalOverlay : undefined}
                  onMouseDown={(event) => {
                    if (editingFineId !== null && event.target === event.currentTarget)
                      resetFineForm();
                  }}
                >
                  <section
                    className={
                      editingFineId !== null
                        ? `${styles.rejectModal} ${styles.fineEditModal}`
                        : undefined
                    }
                    role={editingFineId !== null ? 'dialog' : undefined}
                    aria-modal={editingFineId !== null ? true : undefined}
                    aria-labelledby={editingFineId !== null ? 'fineEditTitle' : undefined}
                  >
                    {editingFineId !== null && (
                      <div className={styles.modalHeader}>
                        <div>
                          <h3 id="fineEditTitle">주정차 위반 수정</h3>
                          <p>위반 정보와 처리 상태를 수정해주세요.</p>
                        </div>
                        <button
                          type="button"
                          className={styles.modalCloseButton}
                          aria-label="닫기"
                          onClick={resetFineForm}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <form
                      className={`${styles.vehicleForm} ${styles.fineForm}`}
                      onSubmit={handleFineSubmit}
                    >
                      <div className={styles.fineFormIntro}>
                        <span className={styles.fineFormEyebrow}>PARKING VIOLATION</span>
                        <h3>
                          {editingFineId !== null
                            ? '위반 정보 수정'
                            : '새 위반 내역 등록'}
                        </h3>
                        <p>차량과 위반 내용을 입력해 관리 기록을 남깁니다.</p>
                      </div>
                      <div className={styles.fineFormGrid}>
                        <div className={styles.formGroup}>
                          <label htmlFor="fineVehicleId">차량</label>
                          <select
                            id="fineVehicleId"
                            name="vehicleid"
                            value={fineForm.vehicleid}
                            onChange={handleFineFormChange}
                          >
                            <option value="">차량을 선택해주세요</option>
                            {vehicles.map((vehicle) => (
                              <option key={vehicle.vehicleid} value={vehicle.vehicleid}>
                                {vehicle.vehiclenumber} (
                                {vehicle.ownername || '차주 미등록'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="violationDate">위반일자</label>
                          <input
                            id="violationDate"
                            name="violationDate"
                            type="date"
                            value={fineForm.violationdate}
                            onChange={handleFineFormChange}
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="reason">위반 사유</label>
                          <select
                            id="reason"
                            name="reason"
                            value={fineForm.reason}
                            onChange={handleFineFormChange}
                          >
                            <option value="지정구역 위반">지정구역 위반</option>
                            <option value="장기 주차">장기 주차</option>
                            <option value="통행 방해">통행 방해</option>
                            <option value="기타">기타</option>
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="fineAmount">벌칙금</label>
                          <div className={styles.fineAmountField}>
                            <input
                              id="fineAmount"
                              name="amount"
                              type="number"
                              min="1"
                              step="1"
                              value={fineForm.amount}
                              onChange={handleFineFormChange}
                              placeholder="벌칙금을 입력하세요"
                              required
                            />
                            <span>원</span>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="fineStatus">현재 차량 상태</label>
                          <select
                            id="fineStatus"
                            name="status"
                            value={fineForm.status}
                            onChange={handleFineFormChange}
                          >
                            <option value="조치 중">조치 중</option>
                            <option value="조치 완료">조치 완료</option>
                            <option value="미조치">미조치</option>
                            <option value="처리 불가">처리 불가</option>
                          </select>
                        </div>
                      </div>

                      <div className={`${styles.formGroup} ${styles.fineMemoGroup}`}>
                        <label htmlFor="fineMemo">메모</label>
                        <textarea
                          id="fineMemo"
                          name="memo"
                          value={fineForm.memo}
                          onChange={handleFineFormChange}
                          placeholder="메모를 입력하세요."
                          rows={4}
                        />
                      </div>

                      <div className={`${styles.formActions} ${styles.fineFormActions}`}>
                        {editingFineId !== null && (
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={resetFineForm}
                          >
                            수정 취소
                          </button>
                        )}
                        <button type="submit" className={styles.primaryButton}>
                          {editingFineId !== null
                            ? '주정차 위반 수정'
                            : '주정차 위반 등록'}
                        </button>
                      </div>
                    </form>
                  </section>
                </div>

                <section className={styles.fineListPanel} aria-labelledby="fineListTitle">
                  <div className={styles.fineListHeader}>
                    <div>
                      <h3 id="fineListTitle">위반 목록</h3>
                      <p>항목을 확인하고 필요한 작업을 선택하세요.</p>
                    </div>
                    <span>{fines.length}건</span>
                  </div>
                  {fineLoadError && (
                    <div className="alert alert-danger py-2" role="alert">
                      {fineLoadError}
                    </div>
                  )}
                  {fines.length > 0 && (
                    <div className={styles.vehicleToolbar}>
                      <div className={styles.searchBox}>
                        <span aria-hidden="true">⌕</span>
                        <input
                          type="text"
                          value={fineSearch}
                          onChange={(e) => setFineSearch(e.target.value)}
                          placeholder="차량번호, 차주명, 위반사유 검색"
                        />
                      </div>

                      <select
                        value={fineStatusFilter}
                        onChange={(e) =>
                          setFineStatusFilter(e.target.value as '전체' | FineStatus)
                        }
                      >
                        <option value="전체">전체</option>
                        <option value="조치 중">조치 중</option>
                        <option value="조치 완료">조치 완료</option>
                        <option value="미조치">미조치</option>
                        <option value="처리 불가">처리 불가</option>
                      </select>
                    </div>
                  )}

                  {fines.length === 0 ? (
                    <div className={styles.emptyVehicle}>
                      <div className={styles.emptyIcon}>📋</div>
                      <strong>등록된 주정차 위반 정보가 없습니다.</strong>
                      <p>차량을 선택하고 주정차 위반 사항을 등록할 수 있습니다.</p>
                    </div>
                  ) : filteredFines.length === 0 ? (
                    <div className={styles.emptySearch}>
                      <strong>검색 결과가 없습니다.</strong>
                      <p>검색어나 필터를 변경해주세요.</p>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          setFineSearch('');
                          setFineStatusFilter('전체');
                        }}
                      >
                        필터 초기화
                      </button>
                    </div>
                  ) : (
                    <div className={styles.fineRecordList}>
                      {filteredFines.map((fine) => {
                        const vehicle = vehicles.find(
                          (item) => item.vehicleid === fine.vehicleid,
                        );
                        const statusStyle =
                          fine.status === '조치 완료'
                            ? styles.fineStatusDone
                            : fine.status === '조치 중'
                              ? styles.fineStatusProgress
                              : fine.status === '처리 불가'
                                ? styles.fineStatusBlocked
                                : styles.fineStatusPending;

                        return (
                          <article className={styles.fineRecord} key={fine.id}>
                            <div className={styles.fineRecordMain}>
                              <div className={styles.fineRecordHeading}>
                                <button
                                  type="button"
                                  className={styles.fineVehicleLink}
                                  onClick={() => {
                                    setSelectedVehicleId(fine.vehicleid);
                                    setActiveMenu('detail');
                                  }}
                                >
                                  {vehicle?.vehiclenumber ?? '차량 정보 없음'}
                                </button>
                                <span
                                  className={`${styles.fineStatusBadge} ${statusStyle}`}
                                >
                                  {fine.status}
                                </span>
                              </div>
                              <div className={styles.fineRecordMeta}>
                                <span>{fine.violationdate}</span>
                                <span>{fine.reason}</span>
                              </div>
                              {fine.memo && (
                                <p className={styles.fineRecordMemo}>{fine.memo}</p>
                              )}
                            </div>
                            <div className={styles.fineRecordSide}>
                              <strong className={styles.fineRecordAmount}>
                                {fine.amount.toLocaleString()}
                                <small>원</small>
                              </strong>
                              <div className={styles.fineRecordActions}>
                                <button
                                  type="button"
                                  onClick={() => handleEditFine(fine)}
                                >
                                  수정
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingFine(fine)}
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              {deletingFine && (
                <div
                  className={styles.modalOverlay}
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setDeletingFine(null);
                  }}
                >
                  <section
                    className={styles.rejectModal}
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="deleteFineTitle"
                  >
                    <div className={styles.modalHeader}>
                      <div>
                        <h3 id="deleteFineTitle">위반 정보 삭제</h3>
                        <p>
                          이 주정차 위반 정보를 삭제하시겠습니까? 삭제한 정보는 복구할 수
                          없습니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={styles.modalCloseButton}
                        aria-label="닫기"
                        onClick={() => setDeletingFine(null)}
                      >
                        ×
                      </button>
                    </div>
                    <div className={styles.modalRequestInfo}>
                      <span>차량번호 · 위반일자</span>
                      <strong>
                        {vehicles.find(
                          (vehicle) => vehicle.vehicleid === deletingFine.vehicleid,
                        )?.vehiclenumber ?? '-'}{' '}
                        · {deletingFine.violationdate}
                      </strong>
                    </div>
                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => setDeletingFine(null)}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => handleDeleteFine(deletingFine)}
                      >
                        삭제
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}
          {uploadFeedback && (
            <div
              className={styles.modalOverlay}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setUploadFeedback(null);
              }}
            >
              <section
                className={styles.rejectModal}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="vehicleUploadResultTitle"
                aria-describedby="vehicleUploadResultMessage"
              >
                <div className={styles.modalHeader}>
                  <div>
                    <span
                      className={`${styles.uploadResultIcon} ${
                        uploadFeedback.type === 'success'
                          ? styles.uploadResultSuccess
                          : uploadFeedback.type === 'warning'
                            ? styles.uploadResultWarning
                            : styles.uploadResultError
                      }`}
                      aria-hidden="true"
                    >
                      {uploadFeedback.type === 'success'
                        ? '✓'
                        : uploadFeedback.type === 'warning'
                          ? '!'
                          : '×'}
                    </span>
                    <h3 id="vehicleUploadResultTitle">{uploadFeedback.title}</h3>
                    <p id="vehicleUploadResultMessage">{uploadFeedback.message}</p>
                  </div>
                  <button
                    type="button"
                    className={styles.modalCloseButton}
                    aria-label="닫기"
                    onClick={() => setUploadFeedback(null)}
                  >
                    ×
                  </button>
                </div>
                {uploadFeedback.details && uploadFeedback.details.length > 0 && (
                  <ul className={styles.uploadResultErrors}>
                    {uploadFeedback.details.map((detail, index) => (
                      <li key={`${index}-${detail}`}>{detail}</li>
                    ))}
                  </ul>
                )}
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => setUploadFeedback(null)}
                    autoFocus
                  >
                    확인
                  </button>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
