import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import styles from './Vehicle.module.css';
import ApartmentMap from './apartment/ApartmentMap';
import VehicleDetail from './VehicleDetail';
import AdditionalVehicleManagement from './AdditionalVehicleManagement';
import AdditionalVehicleDetail from './AdditionalDetail';
import {
  AdditionalVehicleRequest,
  Fine,
  FineReason,
  FineStatus,
  useVehicleStore,
  Vehicle,
  VehicleType,
} from './vehicleStore';

type ActiveMenu = 'list' | 'register' | 'upload' | 'status' | 'edit' | 'plus' | 'detail';

interface VehicleForm {
  vehiclenumber: string;
  vehicletypecode: VehicleType;
  vehiclemodel: string;
  building: string;
  officenumber: string;
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
];

const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

const createInitialVehicleForm = (): VehicleForm => ({
  vehiclenumber: '',
  vehicletypecode: '승용차',
  vehiclemodel: '',
  building: '',
  officenumber: '',
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

const predictVehicle = (vehiclenumber: string): VehiclePrediction | null => {
  const number = vehiclenumber.replace(/\s/g, '').trim();
  if (!number) return null;
  const numberMatches = number.match(/\d/g);
  if (!numberMatches?.length) return { vehicletypecode: '승용차' };
  const lastNumber = Number(numberMatches[numberMatches.length - 1]);

  switch (lastNumber) {
    case 0:
    case 5:
      return { vehicletypecode: 'SUV' };
    case 1:
    case 6:
      return { vehicletypecode: '경차' };
    case 2:
    case 7:
      return { vehicletypecode: '승합차' };
    default:
      return { vehicletypecode: '승용차' };
  }
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
  const [selectedAdditionalRequest, setSelectedAdditionalRequest] =
    useState<AdditionalVehicleRequest | null>(null);
  const fetchAdditionalVehicleRequests = useVehicleStore(
    (state) => state.fetchAdditionalVehicleRequests,
  );
  const additionalVehicleRequests = useVehicleStore(
    (state) => state.additionalVehicleRequests,
  );
  const approveAdditionalVehicleRequest = useVehicleStore(
    (state) => state.approveAdditionalVehicleRequest,
  );

  const rejectAdditionalVehicleRequest = useVehicleStore(
    (state) => state.rejectAdditionalVehicleRequest,
  );

  const handleApproveRequest = async (request: AdditionalVehicleRequest) => {
    // 지금은 Admin 계정을 1로 임시 지정
    const success = await approveAdditionalVehicleRequest(request.id, 1);

    if (!success) {
      alert('차량 신청 승인에 실패했습니다.');
      return;
    }

    await fetchVehicles();
    await fetchAdditionalVehicleRequests();

    alert('추가 차량 신청을 승인했습니다.');
  };

  const handleRejectRequest = async (
    request: AdditionalVehicleRequest,
    reason: string,
  ) => {
    // 지금은 Admin 계정을 1로 임시 지정
    const success = await rejectAdditionalVehicleRequest(request.id, 1, reason); 

    if (!success) {
      alert('차량 신청 반려에 실패했습니다. 반려 사유를 확인해주세요.');
      return;
    }

    await fetchAdditionalVehicleRequests();

    alert('차량 신청을 반려했습니다.');
  };
  useEffect(() => {
    fetchVehicles().catch((error) => {
      console.error('차량 목록 조회 실패:', error);
    });
  }, [fetchVehicles]);

  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('list');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(createInitialVehicleForm());
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<VehiclePrediction | null>(null);
  const [predictionChecked, setPredictionChecked] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [fineForm, setFineForm] = useState<FineForm>(createInitialFineForm());
  const [editingFineId, setEditingFineId] = useState<number | null>(null);
  const [fineSearch, setFineSearch] = useState('');
  const [fineStatusFilter, setFineStatusFilter] = useState<'전체' | FineStatus>('전체');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filteredVehicles = vehicles.filter((vehicle) => {
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
        createdat: existingVehicle ? existingVehicle.createdat : getToday(),
        updatedat: getToday(),
        deletedat: '',
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
      officeid: 0,
      vehiclenumber,
      vehiclemodel: vehicleForm.vehiclemodel,
      ownername,
      vehicletypecode: vehicleForm.vehicletypecode,
      registrationtypecode: 'INITIAL',
      registrationstatuscode: 'REGISTERED',
      registeredat: vehicleForm.registeredAt || getToday(),
      rejectedreason: '',
      createdat: getToday(),
      updatedat: getToday(),
      deletedat: '',
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
      ownername: vehicle.ownername,
      registeredAt: vehicle.registeredat || getToday(),
    });
    const result = predictVehicle(vehicle.vehiclenumber);
    setPrediction(result);
    setPredictionChecked(Boolean(result));
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
    const result = predictVehicle(vehiclenumber);
    setPrediction(result);
    if (result) {
      setVehicleForm((prev) => ({ ...prev, vehicletypecode: result.vehicletypecode }));
    }
    setPredictionChecked(true);
    setIsPredicting(false);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVehicleForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleFileUpload = async (): Promise<void> => {
    if (!selectedFile) {
      alert('업로드할 파일을 선택해주세요.');
      return;
    }

    const fileName = selectedFile.name.toLowerCase();
    const isValid =
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')

    if (!isValid) {
      alert('xlsx, xls 파일만 업로드할 수 있습니다.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/vehicle/upload-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('파일 업로드에 실패했습니다.');
      }

      const result = await response.json();

      alert(`업로드가 완료되었습니다.\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('차량 파일 업로드 오류:', error);
      alert('파일 업로드에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleFineSubmit = (e: FormEvent<HTMLFormElement>) => {
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

    if (editingFineId !== null) {
      updateFine(fine);
      alert('주정차 위반 정보가 수정되었습니다.');
    } else {
      addFine(fine);
      alert('주정차 위반 정보가 등록되었습니다.');
    }
    resetFineForm();
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

  const handleDeleteFine = (fine: Fine) => {
    const confirmed = window.confirm('해당 주정차 위반 정보를 삭제하시겠습니까?');
    if (!confirmed) return;
    deleteFine(fine.id);
    if (editingFineId === fine.id) resetFineForm();
    alert('주정차 위반 정보가 삭제되었습니다.');
  };

  return (
    <div className={styles.vehiclePage}>
      <h2 className={styles.pageTitle}>차량관리</h2>
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
                <div className={styles.summaryItem}>
                  <span>전체 차량</span>
                  <strong>
                    {vehicles.length}
                    <small>대</small>
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>등록된 차량</span>
                  <strong className={styles.summaryNormal}>
                    {
                      vehicles.filter((v) => v.registrationstatuscode === 'REGISTERED')
                        .length
                    }
                    <small>대</small>
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>추가 등록 차량</span>
                  <strong>
                    {
                      vehicles.filter((v) => v.registrationtypecode === 'ADDITIONAL')
                        .length
                    }
                    <small>대</small>
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>방문 차량</span>
                  <strong className={styles.summaryStopped}>
                    {vehicles.filter((v) => v.vehicletypecode === 'VISIT').length}
                    <small>대</small>
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>접수중인 차량</span>
                  <strong>
                    {
                      vehicles.filter((v) => v.registrationstatuscode === 'REQUESTED')
                        .length
                    }
                    <small>대</small>
                  </strong>
                </div>
              </div>

              {vehicles.length > 0 && (
                <div className={styles.vehicleToolbar}>
                  <div className={styles.searchBox}>
                    <span aria-hidden="true">⌕</span>
                    <input
                      type="text"
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      placeholder="차량번호, 차주명 검색"
                    />
                  </div>
                </div>
              )}

              {vehicles.length === 0 ? (
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
                        <th>호수</th>
                        <th>등록일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehicles.map((vehicle) => (
                        <tr key={vehicle.vehicleid}>
                          <td>
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
                          </td>
                          <td>{vehicle.vehicletypecode}</td>
                          <td>{vehicle.vehiclemodel || '-'}</td>
                          <td>{vehicle.ownername || '-'}</td>
                          <td>
                            {(vehicle as any).officenumber
                              ? ` ${(vehicle as any).officenumber}호`
                              : '-'}
                          </td>
                          <td>{vehicle.registeredat}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeMenu === 'register' && (
            <div className={styles.vehicleContent}>
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
                    onUnitSelect={(building, officenumber) => {
                      setVehicleForm((prev) => ({
                        ...prev,
                        building,
                        officenumber,
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
                    {predictionChecked && prediction && (
                      <div className={styles.predictionResult}>
                        차량 형태: <strong>{prediction.vehicletypecode}</strong>
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
                      <option value="승용차">승용차</option>
                      <option value="SUV">SUV</option>
                      <option value="승합차">승합차</option>
                      <option value="경차">경차</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="ownerName">차주</label>
                    <input
                      id="ownerName"
                      name="ownerName"
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
                />
                <label htmlFor="vehicleFile" className={styles.fileUploadLabel}>
                  <span className={styles.fileUploadIcon}>📊</span>
                  <span className={styles.fileUploadText}>
                    <span className={styles.fileUploadTitle}>Excel 파일 선택</span>
                    <span className={styles.fileUploadDescription}>
                      XLSX, XLS 파일을 지원합니다.
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
                >
                  초기화
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={!selectedFile}
                  onClick={handleFileUpload}
                >
                  파일 업로드
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

          {activeMenu === 'status' && (
            <div className={styles.vehicleContent}>
              <div className={styles.contentHeader}>
                <div>
                  <h3>주정차 관리</h3>
                  <p>차량의 주정차 위반 정보를 관리합니다.</p>
                </div>
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

              <form className={styles.vehicleForm} onSubmit={handleFineSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="fineVehicleId">차량</label>
                  <select
                    id="fineVehicleId"
                    name="vehicleId"
                    value={fineForm.vehicleid}
                    onChange={handleFineFormChange}
                  >
                    <option value="">차량을 선택해주세요</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.vehicleid} value={vehicle.vehicleid}>
                        {vehicle.vehiclenumber} ({vehicle.ownername || '차주 미등록'})
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

                <div className={styles.formGroup}>
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

                <div className={styles.formActions}>
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
                    {editingFineId !== null ? '주정차 위반 수정' : '주정차 위반 등록'}
                  </button>
                </div>
              </form>

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
                <div className={styles.vehicleTableWrap}>
                  <table className={styles.vehicleTable}>
                    <thead>
                      <tr>
                        <th>차량번호</th>
                        <th>위반일자</th>
                        <th>위반 사유</th>
                        <th>상태</th>
                        <th>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFines.map((fine) => {
                        const vehicle = vehicles.find(
                          (item) => item.vehicleid === fine.vehicleid,
                        );

                        return (
                          <tr key={fine.id}>
                            <td>
                              <button
                                type="button"
                                className={styles.vehicleDetailLink}
                                onClick={() => {
                                  setSelectedVehicleId(fine.vehicleid);
                                  setActiveMenu('detail');
                                }}
                              >
                                {vehicle?.vehiclenumber ?? '-'}
                              </button>
                            </td>
                            <td>{fine.violationdate}</td>
                            <td>{fine.reason}</td>
                            <td>{fine.status}</td>
                            <td>
                              <div className={styles.formActions}>
                                <button
                                  type="button"
                                  className={styles.secondaryButton}
                                  onClick={() => handleEditFine(fine)}
                                >
                                  수정
                                </button>
                                <button
                                  type="button"
                                  className={styles.secondaryButton}
                                  onClick={() => handleDeleteFine(fine)}
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
