import { useMemo, useState } from 'react';
import './VehicleSearchModal.css';

export interface VehicleItem {
  id: number;
  visitDate: string;
  number: string;
  isFavorite: boolean;
}

interface VehicleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicleNumber: string) => void;
}

// 하드코딩된 최근 방문 차량 목록
const MOCK_RECENT_VEHICLES: VehicleItem[] = [
  {
    id: 1,
    visitDate: '2026-06-15 10:15:30',
    number: '12가 3456',
    isFavorite: false,
  },
  {
    id: 2,
    visitDate: '2026-06-14 16:45:10',
    number: '34나 5678',
    isFavorite: true,
  },
  {
    id: 3,
    visitDate: '2026-06-10 09:20:05',
    number: '56다 7890',
    isFavorite: false,
  },
  {
    id: 4,
    visitDate: '2026-06-05 11:05:50',
    number: '78라 1234',
    isFavorite: false,
  },
];

export default function VehicleSearchModal({
  isOpen,
  onClose,
  onSelectVehicle,
}: VehicleSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicles, setVehicles] = useState<VehicleItem[]>(MOCK_RECENT_VEHICLES);

  // 즐겨찾기 토글
  const handleToggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    setVehicles((prev) =>
      prev.map((vehicle) =>
        vehicle.id === id
          ? {
              ...vehicle,
              isFavorite: !vehicle.isFavorite,
            }
          : vehicle,
      ),
    );
  };

  // 차량번호 또는 방문일시 검색
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter(
        (vehicle) =>
          vehicle.number.includes(searchTerm) || vehicle.visitDate.includes(searchTerm),
      )
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;

        return 0;
      });
  }, [vehicles, searchTerm]);

  // 검색어 초기화 후 모달 닫기
  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  // 차량 선택
  const handleSelectVehicle = (vehicleNumber: string) => {
    onSelectVehicle(vehicleNumber);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 모달 배경 */}
      <div className="modal-backdrop fade show vehicle-search-backdrop" />

      {/* 모달 */}
      <div
        className="modal fade show d-block vehicle-search-modal"
        tabIndex={-1}
        role="dialog"
      >
        <div className="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content vehicle-search-content">
            {/* 헤더 */}
            <div className="modal-header border-0 pb-2">
              <h5 className="modal-title fw-bold">방문 차량 선택</h5>

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={handleClose}
              />
            </div>

            {/* 바디 */}
            <div className="modal-body">
              {/* 검색 */}
              <div className="vehicle-search-input-wrapper">
                <input
                  type="text"
                  className="form-control"
                  placeholder="차량번호 또는 방문일시 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* 차량 목록 */}
              <div className="vehicle-list-container">
                {filteredVehicles.length === 0 ? (
                  <div className="vehicle-empty">검색된 차량 내역이 없습니다.</div>
                ) : (
                  <div className="list-group list-group-flush">
                    {filteredVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className={`vehicle-item ${
                          vehicle.isFavorite ? 'vehicle-item-favorite' : ''
                        }`}
                        onClick={() => handleSelectVehicle(vehicle.number)}
                      >
                        <div className="vehicle-info">
                          <span className="vehicle-visit-date">
                            🕒 {vehicle.visitDate}
                          </span>

                          <span className="vehicle-number">🚗 {vehicle.number}</span>
                        </div>

                        <button
                          type="button"
                          className={`vehicle-favorite-button ${
                            vehicle.isFavorite ? 'is-favorite' : ''
                          }`}
                          onClick={(e) => handleToggleFavorite(e, vehicle.id)}
                          title={vehicle.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                        >
                          {vehicle.isFavorite ? '★' : '☆'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 푸터 */}
            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-secondary w-100 py-2"
                onClick={handleClose}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
