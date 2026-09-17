import { ChangeEvent, FormEvent, useMemo, useState, } from 'react';
import { vehicleListMock } from '../../../mock/vehicleMock';
import styles from './Vehicle.module.css';
import ApartmentMap from './apartment/ApartmentMap';

/**
 * 관리자 차량관리 페이지 (/admin/vehicle)
 */

/* =====================================================
   Type
===================================================== */

type VehicleType =
  | '승용차'
  | 'SUV'
  | '승합차'
  | '화물차'
  | '경차';

type FineStatus =
  | '미납'
  | '납부'
  | '면제';

type FineReason =
  | '지정구역 위반'
  | '장기 주차'
  | '통행 방해'
  | '기타';

type ActiveMenu =
  | 'list'
  | 'register'
  | 'upload'
  | 'status'
  | 'edit';

interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleType: VehicleType;
  Vehiclemodel: string;
  building: string;
  unit: string;
  ownerName: string;
  registeredAt: string;
}

interface VehicleForm {
  vehicleNumber: string;
  vehicleType: VehicleType;
  Vehiclemodel: string;
  building: string;
  unit: string;
  ownerName: string;
  registeredAt: string;
}

interface VehiclePrediction {
  vehicleType: VehicleType;
}

interface Fine {
  id: number;
  vehicleId: number;
  violationDate: string;
  reason: FineReason;
  amount: number;
  status: FineStatus;
  memo: string;
}

interface FineForm {
  vehicleId: string;
  violationDate: string;
  reason: FineReason;
  amount: string;
  status: FineStatus;
  memo: string;
}

/* =====================================================
   메뉴
===================================================== */

const MENU_ITEMS: {
  key: ActiveMenu;
  label: string;
}[] = [
    {
      key: 'list',
      label: '차량 등록 현황',
    },
    {
      key: 'register',
      label: '차량 등록',
    },
    {
      key: 'upload',
      label: '파일 업로드',
    },
    {
      key: 'status',
      label: '주정차 관리',
    },
    {
      key: 'edit',
      label: '차량 수정/삭제',
    },
  ];

/* =====================================================
   차량 번호로 차량 형태 추정
===================================================== */

const predictVehicle = (
  vehicleNumber: string,
): VehiclePrediction | null => {
  const number = vehicleNumber
    .replace(/\s/g, '')
    .trim();

  if (!number) {
    return null;
  }

  /*
   * 차량번호 마지막 숫자만 사용합니다.
   * 한글 등이 포함되어 있어도 안전하게 처리합니다.
   */
  const numberMatches =
    number.match(/\d/g);

  if (!numberMatches?.length) {
    return {
      vehicleType: '승용차',
    };
  }

  const lastNumber = Number(
    numberMatches[
    numberMatches.length - 1
    ],
  );

  switch (lastNumber) {
    case 0:
    case 5:
      return {
        vehicleType: 'SUV',
      };

    case 1:
    case 6:
      return {
        vehicleType: '경차',
      };

    case 2:
    case 7:
      return {
        vehicleType: '승합차',
      };

    case 3:
    case 8:
      return {
        vehicleType: '화물차',
      };

    case 4:
    case 9:
    default:
      return {
        vehicleType: '승용차',
      };
  }
};

/* =====================================================
   오늘 날짜
===================================================== */

const getToday = (): string => {
  return new Date()
    .toISOString()
    .split('T')[0];
};

/* =====================================================
   Mock 차량
===================================================== */

const createInitialVehicles =
  (): Vehicle[] => {
    return vehicleListMock.map(
      (vehicle) => ({
        id: Number(vehicle.id),

        vehicleNumber:
          String(
            vehicle.vehicleNumber ?? '',
          ),

        vehicleType:
          vehicle.vehicleType as VehicleType,

        Vehiclemodel:
          'Vehiclemodel' in vehicle
            ? String(
              (vehicle as any).Vehiclemodel ?? '',
            )
            : '',

        /*
         * 기존 Mock에 building/unit이 없더라도
         * 오류가 발생하지 않도록 처리합니다.
         */
        building:
          'building' in vehicle
            ? String(
              vehicle.building ?? '',
            )
            : '',

        unit:
          'unit' in vehicle
            ? String(
              vehicle.unit ?? '',
            )
            : '',

        ownerName:
          String(
            vehicle.ownerName ?? '',
          ),

        registeredAt:
          String(
            vehicle.registeredAt ??
            getToday(),
          ),
      }),
    );
  };

/* =====================================================
   차량 Form 초기값
===================================================== */

const createInitialVehicleForm =
  (): VehicleForm => ({
    vehicleNumber: '',
    vehicleType: '승용차',
    Vehiclemodel: '',
    building: '',
    unit: '',
    ownerName: '',
    registeredAt: getToday(),
  });

/* =====================================================
   벌칙금 Form 초기값
===================================================== */

const createInitialFineForm =
  (): FineForm => ({
    vehicleId: '',
    violationDate: getToday(),
    reason: '지정구역 위반',
    amount: '50000',
    status: '미납',
    memo: '',
  });

/* =====================================================
   Mock 벌칙금
===================================================== */

const createInitialFines =
  (): Fine[] => {
    return [];
  };

/* =====================================================
   금액 포맷
===================================================== */

const formatAmount = (
  amount: number,
): string => {
  return new Intl.NumberFormat(
    'ko-KR',
  ).format(amount);
};

/* =====================================================
   VehicleManage
===================================================== */

export default function VehicleManage() {
  /* =================================================
     메뉴
  ================================================= */

  const [activeMenu, setActiveMenu] =
    useState<ActiveMenu>('list');

  /* =================================================
     차량
  ================================================= */

  const [vehicles, setVehicles] =
    useState<Vehicle[]>(
      createInitialVehicles(),
    );

  /* =================================================
     차량 수정
  ================================================= */

  const [
    editingVehicleId,
    setEditingVehicleId,
  ] = useState<number | null>(null);

  /* =================================================
     차량 Form
  ================================================= */

  const [
    vehicleForm,
    setVehicleForm,
  ] = useState<VehicleForm>(
    createInitialVehicleForm(),
  );

  /* =================================================
     차량 번호 조회
  ================================================= */

  const [
    isPredicting,
    setIsPredicting,
  ] = useState(false);

  const [
    prediction,
    setPrediction,
  ] = useState<VehiclePrediction | null>(
    null,
  );

  const [
    predictionChecked,
    setPredictionChecked,
  ] = useState(false);

  /* =================================================
     차량 검색
  ================================================= */

  const [
    vehicleSearch,
    setVehicleSearch,
  ] = useState('');

  /* =================================================
     벌칙금
  ================================================= */

  const [fines, setFines] =
    useState<Fine[]>(
      createInitialFines(),
    );

  const [
    fineForm,
    setFineForm,
  ] = useState<FineForm>(
    createInitialFineForm(),
  );

  const [
    editingFineId,
    setEditingFineId,
  ] = useState<number | null>(null);

  const [
    fineSearch,
    setFineSearch,
  ] = useState('');

  const [
    fineStatusFilter,
    setFineStatusFilter,
  ] = useState<
    '전체' | FineStatus
  >('전체');

  /* =================================================
     파일
  ================================================= */

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(null);

  /* =================================================
     차량번호 변경
  ================================================= */

  const handleVehicleNumberChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;

    setVehicleForm((prev) => ({
      ...prev,
      vehicleNumber: value,
    }));

    /*
     * 차량번호가 변경되면
     * 기존 조회 결과는 무효화합니다.
     */
    setPrediction(null);
    setPredictionChecked(false);
  };

  /* =================================================
     차량번호 조회
  ================================================= */

  const handleVehiclePrediction = () => {
    const vehicleNumber =
      vehicleForm.vehicleNumber.trim();

    if (!vehicleNumber) {
      alert('차량번호를 입력해주세요.');
      return;
    }

    setIsPredicting(true);
    setPrediction(null);
    setPredictionChecked(false);

    /*
     * 실제 API 연결 시 이 부분을
     * API 호출로 변경하면 됩니다.
     */
    window.setTimeout(() => {
      const result =
        predictVehicle(vehicleNumber);

      setPrediction(result);

      if (result) {
        setVehicleForm((prev) => ({
          ...prev,
          vehicleType:
            result.vehicleType,
        }));
      }

      setPredictionChecked(true);
      setIsPredicting(false);
    }, 500);
  };

  /* =================================================
     차량 Form 변경
  ================================================= */

  const handleFormChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const {
      name,
      value,
    } = e.target;

    setVehicleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =================================================
     벌칙금 Form 변경
  ================================================= */

  const handleFineFormChange = (
    e: ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >,
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFineForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =================================================
     차량 Form 초기화
  ================================================= */

  const resetVehicleForm = () => {
    setVehicleForm(
      createInitialVehicleForm(),
    );

    setPrediction(null);
    setPredictionChecked(false);
    setIsPredicting(false);
    setEditingVehicleId(null);
  };

  /* =================================================
     벌칙금 Form 초기화
  ================================================= */

  const resetFineForm = () => {
    setFineForm(
      createInitialFineForm(),
    );

    setEditingFineId(null);
  };

  /* =================================================
     차량 등록 / 수정
  ================================================= */

  const handleSubmit = (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const vehicleNumber =
      vehicleForm.vehicleNumber.trim();

    const ownerName =
      vehicleForm.ownerName.trim();

    const building =
      vehicleForm.building.trim();

    const unit =
      vehicleForm.unit.trim();

    if (!vehicleNumber) {
      alert('차량번호를 입력해주세요.');
      return;
    }

    if (!ownerName) {
      alert('차주명을 입력해주세요.');
      return;
    }

    if (!building) {
      alert('동을 선택해주세요.');
      return;
    }

    if (!unit) {
      alert('호수를 선택해주세요.');
      return;
    }

    const normalizedNumber =
      vehicleNumber
        .replace(/\s/g, '')
        .toLowerCase();

    const duplicateVehicle =
      vehicles.find(
        (vehicle) =>
          vehicle.vehicleNumber
            .replace(/\s/g, '')
            .toLowerCase() ===
          normalizedNumber &&
          vehicle.id !==
          editingVehicleId,
      );

    if (duplicateVehicle) {
      alert(
        '이미 등록된 차량번호입니다.',
      );
      return;
    }

    /* -----------------------------------------------
       수정
    ------------------------------------------------ */

    if (editingVehicleId !== null) {
      setVehicles((prev) =>
        prev.map((vehicle) => {
          if (
            vehicle.id !==
            editingVehicleId
          ) {
            return vehicle;
          }

          return {
            ...vehicle,
            vehicleNumber,
            vehicleType:
              vehicleForm.vehicleType,
            building,
            unit,
            ownerName,
            registeredAt:
              vehicleForm.registeredAt,
          };
        }),
      );

      alert(
        '차량 정보가 수정되었습니다.',
      );

      resetVehicleForm();
      setActiveMenu('edit');

      return;
    }

    /* -----------------------------------------------
       신규 등록
    ------------------------------------------------ */

    const newVehicle: Vehicle = {
      id: Date.now(),

      vehicleNumber,

      vehicleType:
        vehicleForm.vehicleType,

      Vehiclemodel:
        vehicleForm.Vehiclemodel,

      building,

      unit,

      ownerName,

      registeredAt:
        vehicleForm.registeredAt ||
        getToday(),
    };

    setVehicles((prev) => [
      ...prev,
      newVehicle,
    ]);

    alert('차량이 등록되었습니다.');

    resetVehicleForm();
    setActiveMenu('list');
  };

  /* =================================================
     차량 수정 시작
  ================================================= */

  const handleEditVehicle = (
    vehicle: Vehicle,
  ) => {
    setEditingVehicleId(vehicle.id);

    const result =
      predictVehicle(
        vehicle.vehicleNumber,
      );

    setVehicleForm({
      vehicleNumber:
        vehicle.vehicleNumber,

      vehicleType:
        vehicle.vehicleType,

      Vehiclemodel:
        vehicle.Vehiclemodel,

      building:
        vehicle.building,

      unit:
        vehicle.unit,

      ownerName:
        vehicle.ownerName,

      registeredAt:
        vehicle.registeredAt ||
        getToday(),
    });

    setPrediction(result);
    setPredictionChecked(
      Boolean(result),
    );

    setActiveMenu('register');
  };

  /* =================================================
     차량 삭제
  ================================================= */

  const handleDeleteVehicle = (
    vehicle: Vehicle,
  ) => {
    const confirmed =
      window.confirm(
        `"${vehicle.vehicleNumber}" 차량을 삭제하시겠습니까?\n\n삭제한 차량 정보와 연결된 벌칙금 정보도 함께 제거됩니다.`,
      );

    if (!confirmed) {
      return;
    }

    setVehicles((prev) =>
      prev.filter(
        (item) =>
          item.id !== vehicle.id,
      ),
    );

    setFines((prev) =>
      prev.filter(
        (fine) =>
          fine.vehicleId !==
          vehicle.id,
      ),
    );

    if (
      editingVehicleId ===
      vehicle.id
    ) {
      resetVehicleForm();
    }

    alert(
      '차량이 삭제되었습니다.',
    );
  };

  /* =================================================
     차량 수정 취소
  ================================================= */

  const handleCancelEdit = () => {
    resetVehicleForm();
    setActiveMenu('edit');
  };

  /* =================================================
     차량 등록 화면 이동
  ================================================= */

  const handleMoveToRegister = () => {
    resetVehicleForm();
    setActiveMenu('register');
  };

  /* =================================================
     파일 선택
  ================================================= */

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      e.target.files?.[0] ?? null;

    setSelectedFile(file);
  };

  /* =================================================
     파일 업로드
  ================================================= */

  const handleFileUpload = () => {
    if (!selectedFile) {
      alert(
        '업로드할 파일을 선택해주세요.',
      );
      return;
    }

    const fileName =
      selectedFile.name.toLowerCase();

    const isValid =
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      fileName.endsWith('.csv');

    if (!isValid) {
      alert(
        'xlsx, xls, csv 파일만 업로드할 수 있습니다.',
      );
      return;
    }

    /*
     * TODO:
     * 실제 API 연결 위치
     */
    console.log(
      '업로드 파일:',
      selectedFile,
    );

    alert(
      `${selectedFile.name} 파일이 선택되었습니다.\n\n현재는 테스트 단계이며 실제 서버 업로드 API 연결이 필요합니다.`,
    );
  };

  /* =================================================
     차량 필터
  ================================================= */

  const filteredVehicles =
    useMemo(() => {
      const keyword =
        vehicleSearch
          .trim()
          .toLowerCase();

      if (!keyword) {
        return vehicles;
      }

      return vehicles.filter(
        (vehicle) =>
          vehicle.vehicleNumber
            .toLowerCase()
            .includes(keyword) ||
          vehicle.ownerName
            .toLowerCase()
            .includes(keyword) ||
          vehicle.building
            .toLowerCase()
            .includes(keyword) ||
          vehicle.unit
            .toLowerCase()
            .includes(keyword),
      );
    }, [
      vehicles,
      vehicleSearch,
    ]);

  /* =================================================
     벌칙금 필터
  ================================================= */

  const filteredFines =
    useMemo(() => {
      const keyword =
        fineSearch
          .trim()
          .toLowerCase();

      return fines.filter((fine) => {
        const vehicle =
          vehicles.find(
            (item) =>
              item.id ===
              fine.vehicleId,
          );

        const matchesKeyword =
          !keyword ||
          vehicle?.vehicleNumber
            .toLowerCase()
            .includes(keyword) ||
          vehicle?.ownerName
            .toLowerCase()
            .includes(keyword) ||
          fine.reason
            .toLowerCase()
            .includes(keyword);

        const matchesStatus =
          fineStatusFilter ===
          '전체' ||
          fine.status ===
          fineStatusFilter;

        return (
          matchesKeyword &&
          matchesStatus
        );
      });
    }, [
      fines,
      vehicles,
      fineSearch,
      fineStatusFilter,
    ]);

  /* =================================================
     벌칙금 등록 / 수정
  ================================================= */

  const handleFineSubmit = (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const vehicleId =
      Number(fineForm.vehicleId);

    const amount =
      Number(
        fineForm.amount.replace(
          /,/g,
          '',
        ),
      );

    if (!vehicleId) {
      alert('차량을 선택해주세요.');
      return;
    }

    if (
      !fineForm.violationDate
    ) {
      alert(
        '위반일자를 입력해주세요.',
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        '올바른 벌칙금 금액을 입력해주세요.',
      );
      return;
    }

    if (editingFineId !== null) {
      setFines((prev) =>
        prev.map((fine) =>
          fine.id ===
            editingFineId
            ? {
              ...fine,
              vehicleId,
              violationDate:
                fineForm.violationDate,
              reason:
                fineForm.reason,
              amount,
              status:
                fineForm.status,
              memo:
                fineForm.memo.trim(),
            }
            : fine,
        ),
      );

      alert(
        '벌칙금 정보가 수정되었습니다.',
      );
    } else {
      const newFine: Fine = {
        id: Date.now(),

        vehicleId,

        violationDate:
          fineForm.violationDate,

        reason: fineForm.reason,

        amount,

        status:
          fineForm.status,

        memo:
          fineForm.memo.trim(),
      };

      setFines((prev) => [
        ...prev,
        newFine,
      ]);

      alert(
        '벌칙금이 등록되었습니다.',
      );
    }

    resetFineForm();
  };

  /* =================================================
     벌칙금 수정
  ================================================= */

  const handleEditFine = (
    fine: Fine,
  ) => {
    setEditingFineId(fine.id);

    setFineForm({
      vehicleId:
        String(fine.vehicleId),

      violationDate:
        fine.violationDate,

      reason:
        fine.reason,

      amount:
        String(fine.amount),

      status:
        fine.status,

      memo:
        fine.memo,
    });
  };

  /* =================================================
     벌칙금 삭제
  ================================================= */

  const handleDeleteFine = (
    fine: Fine,
  ) => {
    const confirmed =
      window.confirm(
        '해당 벌칙금 정보를 삭제하시겠습니까?',
      );

    if (!confirmed) {
      return;
    }

    setFines((prev) =>
      prev.filter(
        (item) =>
          item.id !== fine.id,
      ),
    );

    if (
      editingFineId === fine.id
    ) {
      resetFineForm();
    }

    alert(
      '벌칙금 정보가 삭제되었습니다.',
    );
  };
  /* =================================================
     화면
  ================================================= */

  return (
    <div className={styles.vehiclePage}>
      {/* =================================================
          페이지 제목
      ================================================= */}

      <h2 className={styles.pageTitle}>
        차량관리
      </h2>

      <p
        className={
          styles.pageDescription
        }
      >
        등록된 차량 및 주정차 벌칙금
        정보를 관리합니다.
      </p>

      {/* =================================================
          상단 메뉴
      ================================================= */}

      <div
        className={
          styles.vehicleMenu
        }
      >
        {MENU_ITEMS.map(
          ({ key, label }) => (
            <button
              key={key}
              type="button"
              className={
                activeMenu === key
                  ? styles.active
                  : ''
              }
              onClick={() => {
                /*
                 * 차량 등록 메뉴를 누를 때
                 * 수정 상태가 아니라면
                 * 항상 신규 등록 Form으로 초기화
                 */
                if (
                  key === 'register' &&
                  editingVehicleId === null
                ) {
                  resetVehicleForm();
                }

                setActiveMenu(key);
              }}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {/* =================================================
          1. 차량 등록 현황
      ================================================= */}

      {activeMenu === 'list' && (
        <div className={styles.vehicleContent}>
          <div className={styles.contentHeader}>
            <div>
              <h3>차량 등록 현황</h3>
              <p>등록된 차량을 한눈에 확인하고 관리할 수 있습니다.</p>
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleMoveToRegister}
            >
              + 차량 등록
            </button>
          </div>

          {/* 차량 요약 */}
          <div className={styles.vehicleSummary}>
            <div className={styles.summaryItem}>
              <span>전체 차량</span>
              <strong>
                {vehicles.length}
                <small>대</small>
              </strong>
            </div>

            <div className={styles.summaryItem}>
              <span>정상 차량</span>
              <strong className={styles.summaryNormal}>
                {vehicles.length}
                <small>대</small>
              </strong>
            </div>

            <div className={styles.summaryItem}>
              <span>미납 차량</span>
              <strong className={styles.summaryStopped}>
                0
                <small>대</small>
              </strong>
            </div>
          </div>

          {/* 검색 */}
          {vehicles.length > 0 && (
            <div className={styles.vehicleToolbar}>
              <div className={styles.searchBox}>
                <span aria-hidden="true">⌕</span>
                <input
                  type="text"
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  placeholder="차량번호, 차주명, 동·호수 검색"
                />
              </div>
            </div>
          )}

          {/* 차량 목록 및 빈 상태 처리 */}
          {vehicles.length === 0 ? (
            <div className={styles.emptyVehicle}>
              <div className={styles.emptyIcon}>🚗</div>
              <strong>등록된 차량이 없습니다.</strong>
              <p>
                차량을 등록하면<br />이곳에서 차량 등록 현황을 확인할 수 있습니다.
              </p>

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
                onClick={() => setVehicleSearch('')}
              >
                검색 초기화
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
                    <th>세대</th>
                    <th>등록일</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      {/* 차량번호 */}
                      <td>
                        <strong className={styles.vehicleNumber}>
                          {vehicle.vehicleNumber}
                        </strong>
                      </td>

                      {/* 차종 */}
                      <td>
                        <span className={styles.vehicleType}>
                          {vehicle.vehicleType}
                        </span>
                      </td>

                      {/* 차량 모델 (데이터 출력 부분 수정 완료) */}
                      <td>
                        <span className={styles.vehicleModel || styles.vehicleType}>
                          {vehicle.Vehiclemodel || '-'}
                        </span>
                      </td>

                      {/* 차주 */}
                      <td>
                        <span className={styles.ownerName}>
                          {vehicle.ownerName || '-'}
                        </span>
                      </td>

                      {/* 세대 (동/호수) */}
                      <td>
                        <span className={styles.unitInfo}>
                          {vehicle.building ? `${vehicle.building}동` : '동 미지정'}
                          {vehicle.unit ? ` ${vehicle.unit}호` : ''}
                        </span>
                      </td>

                      {/* 등록일 */}
                      <td>
                        <span className={styles.registeredDate}>
                          {vehicle.registeredAt}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {vehicles.length > 0 && filteredVehicles.length > 0 && (
            <div className={styles.tableFooter}>
              총 <strong>{filteredVehicles.length}</strong> 건
            </div>
          )}
        </div>
      )}

      {/* =================================================
          2. 차량 등록 / 수정
      ================================================= */}

      {activeMenu === 'register' && (
        <div
          className={
            styles.vehicleContent
          }
        >
          <div
            className={
              styles.contentHeader
            }
          >
            <div>
              <h3>
                {editingVehicleId !== null
                  ? '차량 정보 수정'
                  : '차량 등록'}
              </h3>

              <p>
                아파트 배치도에서 세대를
                선택하고 차량 정보를
                입력해주세요.
              </p>
            </div>

            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={() => {
                resetVehicleForm();
                setActiveMenu(
                  'upload',
                );
              }}
            >
              📁⬆️ 파일 업로드
            </button>
          </div>

          <div
            className={
              styles.registerLayout
            }
          >
            {/* 아파트 지도 */}

            <div
              className={
                styles.apartmentMapArea
              }
            >
              <ApartmentMap
                selectedBuilding={
                  vehicleForm.building
                }
                selectedUnit={
                  vehicleForm.unit
                }
                onUnitSelect={(
                  building,
                  unit,
                ) => {
                  setVehicleForm(
                    (prev) => ({
                      ...prev,
                      building,
                      unit,
                    }),
                  );
                }}
              />
            </div>

            {/* 차량 Form */}

            <form
              className={
                styles.vehicleForm
              }
              onSubmit={
                handleSubmit
              }
            >
              {/* 선택 세대 */}

              <div
                className={
                  styles.formGroup
                }
              >
                <label>
                  선택 세대
                </label>

                <div
                  className={
                    styles.selectedUnit
                  }
                >
                  {vehicleForm.building &&
                    vehicleForm.unit ? (
                    <>
                      <strong>
                        {
                          vehicleForm.building
                        }
                        동{' '}
                        {
                          vehicleForm.unit
                        }
                        호
                      </strong>

                      <span>
                        선택된 세대
                      </span>
                    </>
                  ) : (
                    <span>
                      아파트 배치도에서
                      세대를
                      선택해주세요.
                    </span>
                  )}
                </div>
              </div>

              {/* 차량번호 */}

              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="vehicleNumber">
                  차량번호
                </label>

                <div
                  className={
                    styles.inputWithButton
                  }
                >
                  <input
                    id="vehicleNumber"
                    name="vehicleNumber"
                    value={
                      vehicleForm.vehicleNumber
                    }
                    onChange={
                      handleVehicleNumberChange
                    }
                    placeholder="예: 12가 3456"
                    autoComplete="off"
                  />

                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={
                      handleVehiclePrediction
                    }
                    disabled={
                      isPredicting
                    }
                  >
                    {isPredicting
                      ? '조회 중...'
                      : '조회'}
                  </button>
                </div>

                {predictionChecked &&
                  prediction && (
                    <div
                      className={
                        styles.predictionResult
                      }
                    >
                      차량 형태:{' '}
                      <strong>
                        {
                          prediction.vehicleType
                        }
                      </strong>
                    </div>
                  )}
              </div>

              {/* 차량 형태 */}

              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="vehicleType">
                  차량 형태
                </label>

                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={
                    vehicleForm.vehicleType
                  }
                  onChange={
                    handleFormChange
                  }
                >
                  <option value="승용차">
                    승용차
                  </option>

                  <option value="SUV">
                    SUV
                  </option>

                  <option value="승합차">
                    승합차
                  </option>

                  <option value="화물차">
                    화물차
                  </option>

                  <option value="경차">
                    경차
                  </option>
                </select>
              </div>

              {/* 차주 */}
              <div className={styles.formGroup}>
                <label htmlFor="ownerName">차주</label>
                <input
                  id="ownerName"
                  name="ownerName"
                  value={vehicleForm.ownerName}
                  onChange={handleFormChange}
                  placeholder="차주명을 입력하세요"
                />
              </div>

              {/* 차량 모델 */}
              <div className={styles.formGroup}>
                <label htmlFor="vehicleModel">차량 모델</label>
                <input
                  id="vehicleModel"
                  name="vehicleModel"
                  value={vehicleForm.Vehiclemodel}
                  onChange={handleFormChange}
                  placeholder="차량 모델을 입력하세요"
                />
              </div>

              {/* 등록일 */}

              <div
                className={
                  styles.formGroup
                }
              >
                <label htmlFor="registeredAt">
                  등록일
                </label>

                <input
                  id="registeredAt"
                  name="registeredAt"
                  type="date"
                  value={
                    vehicleForm.registeredAt
                  }
                  onChange={
                    handleFormChange
                  }
                />
              </div>

              {/* 버튼 */}

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >
                {editingVehicleId !==
                  null && (
                    <button
                      type="button"
                      className={
                        styles.secondaryButton
                      }
                      onClick={
                        handleCancelEdit
                      }
                    >
                      수정 취소
                    </button>
                  )}

                <button
                  type="submit"
                  className={
                    styles.primaryButton
                  }
                >
                  {editingVehicleId !==
                    null
                    ? '수정 완료'
                    : '차량 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          3. 파일 업로드
      ================================================= */}

      {activeMenu === 'upload' && (
        <div
          className={
            styles.vehicleContent
          }
        >
          <div
            className={
              styles.contentHeader
            }
          >
            <div>
              <h3>
                차량 정보 파일 업로드
              </h3>

              <p>
                엑셀 또는 CSV 파일을
                선택하여 차량 정보를
                업로드합니다.
              </p>
            </div>

            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={() => {
                setActiveMenu(
                  'register',
                );
              }}
            >
              차량 등록으로 돌아가기
            </button>
          </div>

          <div
            className={`${styles.fileUpload} ${styles.excel}`}
          >
            <input
              id="vehicleFile"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={
                handleFileChange
              }
            />

            <label
              htmlFor="vehicleFile"
              className={
                styles.fileUploadLabel
              }
            >
              <span
                className={
                  styles.fileUploadIcon
                }
              >
                📊
              </span>

              <span
                className={
                  styles.fileUploadText
                }
              >
                <span
                  className={
                    styles.fileUploadTitle
                  }
                >
                  Excel / CSV 파일 선택
                </span>

                <span
                  className={
                    styles.fileUploadDescription
                  }
                >
                  XLSX, XLS, CSV 파일을
                  지원합니다.
                </span>
              </span>

              <span
                className={
                  styles.fileUploadButton
                }
              >
                파일 선택
              </span>
            </label>

            {selectedFile && (
              <div
                className={
                  styles.fileSelected
                }
              >
                <span
                  className={
                    styles.fileSelectedIcon
                  }
                >
                  ✓
                </span>

                <span
                  className={
                    styles.fileSelectedInfo
                  }
                >
                  <span
                    className={
                      styles.fileSelectedName
                    }
                  >
                    {
                      selectedFile.name
                    }
                  </span>

                  <span
                    className={
                      styles.fileSelectedType
                    }
                  >
                    차량 정보 파일
                  </span>
                </span>

                <button
                  type="button"
                  className={
                    styles.fileRemoveButton
                  }
                  onClick={() => {
                    setSelectedFile(
                      null,
                    );
                  }}
                  aria-label="파일 삭제"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent:
                'flex-end',
              marginTop: 14,
              gap: 8,
            }}
          >
            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={() =>
                setSelectedFile(null)
              }
            >
              초기화
            </button>

            <button
              type="button"
              className={
                styles.primaryButton
              }
              disabled={!selectedFile}
              onClick={
                handleFileUpload
              }
            >
              파일 업로드
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          4. 주정차 관리
      ================================================= */}

      {activeMenu === 'status' && (
        <div
          className={
            styles.vehicleContent
          }
        >
          <div
            className={
              styles.contentHeader
            }
          >
            <div>
              <h3>
                주정차 관리
              </h3>

              <p>
                차량의 주정차 위반 및
                벌칙금 정보를
                관리합니다.
              </p>
            </div>
          </div>

          {/* 벌칙금 요약 */}

          <div
            className={
              styles.vehicleSummary
            }
          >
            <div
              className={
                styles.summaryItem
              }
            >
              <span>
                전체 벌칙금
              </span>

              <strong>
                {fines.length}
                <small>건</small>
              </strong>
            </div>

            <div
              className={
                styles.summaryItem
              }
            >
              <span>
                미납
              </span>

              <strong
                className={
                  styles.summaryStopped
                }
              >
                {
                  fines.filter(
                    (fine) =>
                      fine.status ===
                      '미납',
                  ).length
                }
                <small>건</small>
              </strong>
            </div>

            <div
              className={
                styles.summaryItem
              }
            >
              <span>
                납부
              </span>

              <strong
                className={
                  styles.summaryNormal
                }
              >
                {
                  fines.filter(
                    (fine) =>
                      fine.status ===
                      '납부',
                  ).length
                }
                <small>건</small>
              </strong>
            </div>
          </div>

          {/* 벌칙금 등록 Form */}

          <form
            className={
              styles.vehicleForm
            }
            onSubmit={
              handleFineSubmit
            }
          >
            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="fineVehicleId">
                차량
              </label>

              <select
                id="fineVehicleId"
                name="vehicleId"
                value={
                  fineForm.vehicleId
                }
                onChange={
                  handleFineFormChange
                }
              >
                <option value="">
                  차량을 선택해주세요
                </option>

                {vehicles.map(
                  (vehicle) => (
                    <option
                      key={
                        vehicle.id
                      }
                      value={
                        vehicle.id
                      }
                    >
                      {
                        vehicle.vehicleNumber
                      }{' '}
                      -{' '}
                      {
                        vehicle.ownerName ||
                        '차주 미등록'
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="violationDate">
                위반일자
              </label>

              <input
                id="violationDate"
                name="violationDate"
                type="date"
                value={
                  fineForm.violationDate
                }
                onChange={
                  handleFineFormChange
                }
              />
            </div>

            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="reason">
                위반 사유
              </label>

              <select
                id="reason"
                name="reason"
                value={
                  fineForm.reason
                }
                onChange={
                  handleFineFormChange
                }
              >
                <option value="지정구역 위반">
                  지정구역 위반
                </option>

                <option value="장기 주차">
                  장기 주차
                </option>

                <option value="통행 방해">
                  통행 방해
                </option>

                <option value="기타">
                  기타
                </option>
              </select>
            </div>

            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="fineAmount">
                벌칙금
              </label>

              <input
                id="fineAmount"
                name="amount"
                type="number"
                min="0"
                step="1000"
                value={
                  fineForm.amount
                }
                onChange={
                  handleFineFormChange
                }
                placeholder="벌칙금 금액"
              />
            </div>

            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="fineStatus">
                납부 상태
              </label>

              <select
                id="fineStatus"
                name="status"
                value={
                  fineForm.status
                }
                onChange={
                  handleFineFormChange
                }
              >
                <option value="미납">
                  미납
                </option>

                <option value="납부">
                  납부
                </option>

                <option value="면제">
                  면제
                </option>
              </select>
            </div>

            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="fineMemo">
                메모
              </label>

              <textarea
                id="fineMemo"
                name="memo"
                value={
                  fineForm.memo
                }
                onChange={
                  handleFineFormChange
                }
                placeholder="메모를 입력하세요."
                rows={4}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >
              {editingFineId !==
                null && (
                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={
                      resetFineForm
                    }
                  >
                    수정 취소
                  </button>
                )}

              <button
                type="submit"
                className={
                  styles.primaryButton
                }
              >
                {editingFineId !==
                  null
                  ? '벌칙금 수정'
                  : '벌칙금 등록'}
              </button>
            </div>
          </form>

          {/* 벌칙금 검색 */}

          {fines.length > 0 && (
            <div
              className={
                styles.vehicleToolbar
              }
              style={{
                marginTop: 24,
              }}
            >
              <div
                className={
                  styles.searchBox
                }
              >
                <span aria-hidden="true">
                  ⌕
                </span>

                <input
                  type="text"
                  value={
                    fineSearch
                  }
                  onChange={(e) =>
                    setFineSearch(
                      e.target.value,
                    )
                  }
                  placeholder="차량번호, 차주명, 위반사유 검색"
                />
              </div>

              <select
                value={
                  fineStatusFilter
                }
                onChange={(e) =>
                  setFineStatusFilter(
                    e.target
                      .value as
                    | '전체'
                    | FineStatus,
                  )
                }
              >
                <option value="전체">
                  전체
                </option>

                <option value="미납">
                  미납
                </option>

                <option value="납부">
                  납부
                </option>

                <option value="면제">
                  면제
                </option>
              </select>
            </div>
          )}

          {/* 벌칙금 목록 */}

          {fines.length === 0 ? (
            <div
              className={
                styles.emptyVehicle
              }
            >
              <div
                className={
                  styles.emptyIcon
                }
              >
                📋
              </div>

              <strong>
                등록된 벌칙금이
                없습니다.
              </strong>

              <p>
                차량을 선택하고
                벌칙금을 등록할 수
                있습니다.
              </p>
            </div>
          ) : filteredFines.length ===
            0 ? (
            <div
              className={
                styles.emptySearch
              }
            >
              <strong>
                검색 결과가
                없습니다.
              </strong>

              <p>
                검색어나 필터를
                변경해주세요.
              </p>

              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={() => {
                  setFineSearch('');
                  setFineStatusFilter(
                    '전체',
                  );
                }}
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div
              className={
                styles.vehicleTableWrap
              }
            >
              <table
                className={
                  styles.vehicleTable
                }
              >
                <thead>
                  <tr>
                    <th>
                      차량번호
                    </th>

                    <th>
                      위반일자
                    </th>

                    <th>
                      위반 사유
                    </th>

                    <th>
                      벌칙금
                    </th>

                    <th>
                      상태
                    </th>

                    <th>
                      관리
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredFines.map(
                    (fine) => {
                      const vehicle =
                        vehicles.find(
                          (item) =>
                            item.id ===
                            fine.vehicleId,
                        );

                      return (
                        <tr
                          key={
                            fine.id
                          }
                        >
                          <td>
                            <strong
                              className={
                                styles.vehicleNumber
                              }
                            >
                              {vehicle
                                ?.vehicleNumber ??
                                '-'}
                            </strong>
                          </td>

                          <td>
                            {
                              fine.violationDate
                            }
                          </td>

                          <td>
                            {
                              fine.reason
                            }
                          </td>

                          <td>
                            {formatAmount(
                              fine.amount,
                            )}
                            원
                          </td>

                          <td>
                            <span>
                              {
                                fine.status
                              }
                            </span>
                          </td>

                          <td>
                            <div
                              style={{
                                display:
                                  'flex',
                                gap: 6,
                              }}
                            >
                              <button
                                type="button"
                                className={
                                  styles.secondaryButton
                                }
                                onClick={() =>
                                  handleEditFine(
                                    fine,
                                  )
                                }
                              >
                                수정
                              </button>

                              <button
                                type="button"
                                className={
                                  styles.secondaryButton
                                }
                                onClick={() =>
                                  handleDeleteFine(
                                    fine,
                                  )
                                }
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =================================================
          5. 차량 수정 / 삭제
      ================================================= */}

      {activeMenu === 'edit' && (
        <div className={styles.vehicleContent}>
          <div className={styles.contentHeader}>
            <div>
              <h3>차량 수정 / 삭제</h3>
              <p>등록된 차량 정보를 수정하거나 삭제할 수 있습니다.</p>
            </div>

            <button type="button" className={styles.primaryButton}
              onClick={handleMoveToRegister}>+ 차량 등록</button>
          </div>

          {/* 검색 */}

          {vehicles.length > 0 && (
            <div className={styles.vehicleToolbar}>
              <div className={styles.searchBox}>
                <span aria-hidden="true">⌕</span>

                <input type="text" value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value,)}
                  placeholder="차량번호, 차주명, 동·호수 검색" />
              </div>
            </div>
          )}

          {vehicles.length === 0 ? (
            <div className={styles.emptyVehicle}>
              <div className={styles.emptyIcon}>🚗</div>

              <strong>등록된 차량이 없습니다.</strong>
              <p>차량을 먼저 등록해주세요.</p>

              <button type="button" className={styles.primaryButton}
                onClick={handleMoveToRegister}>차량 등록</button>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className={styles.emptySearch}>
              <strong>검색 결과가 없습니다.</strong>
              <p>검색어를 변경해주세요.</p>

              <button type="button" className={styles.secondaryButton}
                onClick={() => setVehicleSearch('')}>검색 초기화</button>
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
                    <th>세대</th>
                    <th>등록일</th>
                    <th>관리</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      {/* 차량번호 */}
                      <td>
                        <strong className={styles.vehicleNumber}>{vehicle.vehicleNumber}</strong>
                      </td>
                      {/* 차종 */}
                      <td>{vehicle.vehicleType}</td>
                      {/* 차량 모델 */}
                      <td>{vehicle.Vehiclemodel || '-'}</td>
                      {/* 차주 */}
                      <td>{vehicle.ownerName || '-'}</td>
                      {/* 세대 */}
                      <td>
                        {vehicle.building ? `${vehicle.building}동` : '-'}
                        {vehicle.unit ? ` ${vehicle.unit}호` : ''}
                      </td>
                      {/* 등록일 */}
                      <td>{vehicle.registeredAt}</td>
                      {/* 관리 버튼 */}
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => handleEditVehicle(vehicle)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => handleDeleteVehicle(vehicle)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {vehicles.length > 0 && filteredVehicles.length > 0 && (
            <div className={styles.tableFooter}>총{' '}
              <strong>{filteredVehicles.length}</strong>건</div>
          )}
        </div>
      )}
    </div>
  );
}