import { useEffect, useState, useMemo, useCallback } from 'react';
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

export default function VehicleSearchModal({
  isOpen,
  onClose,
  onSelectVehicle,
}: VehicleSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 💡 모달이 열릴 때 백엔드 전체 목록 API 호출
  const fetchVehicles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      setLoading(true);
      const response = await fetch(import.meta.env.VITE_BOOT_API_BASE_URL_U + '/api/vehicles', {
        method: 'GET',
        credentials: 'include',
                  headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
      });

      if (!response.ok) {
        throw new Error('차량 목록을 불러오지 못했습니다.');
      }

      const text = await response.text();
      if (
        !text ||
        text.trim().startsWith('<!DOCTYPE') ||
        text.trim().startsWith('<html')
      ) {
        console.warn('로그인이 필요하거나 인증이 만료되었습니다.');
        setVehicles([]);
        return;
      }

      const data = JSON.parse(text);

      if (Array.isArray(data)) {
        const mappedVehicles: VehicleItem[] = data.map((v: any) => ({
          id: v.vehicleId ?? v.vehicle_id ?? 1,
          visitDate:
            v.registeredAt ?? v.registered_at ?? v.createdAt ?? v.created_at ?? '-',
          number: v.vehicleNumber ?? v.vehicle_number ?? '',
          isFavorite: false,
        }));
        setVehicles(mappedVehicles);
      }
    } catch (error) {
      console.error('차량 목록 조회 에러:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen, fetchVehicles]);

  // 즐겨찾기 토글
  const handleToggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setVehicles((prev) =>
      prev.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, isFavorite: !vehicle.isFavorite } : vehicle,
      ),
    );
  };

  // 💡 검색어 일부만 포함해도 실시간 필터링 (예: 23, 34, 67 등)
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter(
        (vehicle) =>
          vehicle.number.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
          vehicle.visitDate.includes(searchTerm.trim()),
      )
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
      });
  }, [vehicles, searchTerm]);

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const handleSelectVehicle = (vehicleNumber: string) => {
    onSelectVehicle(vehicleNumber);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show vehicle-search-backdrop" />
      <div
        className="modal fade show d-block vehicle-search-modal"
        tabIndex={-1}
        role="dialog"
      >
        <div className="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content vehicle-search-content">
            <div className="modal-header border-0 pb-2">
              <h5 className="modal-title fw-bold">방문 차량 선택</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={handleClose}
              />
            </div>

            <div className="modal-body">
              {/* 검색 입력창 */}
              <div className="vehicle-search-input-wrapper mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="차량번호 일부 입력 (예: 23, 34, 67)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              {/* 차량 목록 */}
              <div className="vehicle-list-container">
                {loading ? (
                  <div className="text-center py-4 text-muted">
                    차량 목록 불러오는 중...
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <div className="vehicle-empty text-muted text-center py-4">
                    검색된 차량 내역이 없습니다.
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {filteredVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className={`vehicle-item d-flex justify-content-between align-items-center p-2 border-bottom ${
                          vehicle.isFavorite ? 'vehicle-item-favorite' : ''
                        }`}
                        onClick={() => handleSelectVehicle(vehicle.number)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="vehicle-info">
                          <span className="vehicle-visit-date text-muted small d-block">
                            🕒 {vehicle.visitDate}
                          </span>
                          <span className="vehicle-number fw-bold">
                            🚗 {vehicle.number}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={(e) => handleToggleFavorite(e, vehicle.id)}
                            title={vehicle.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                          >
                            {vehicle.isFavorite ? '★' : '☆'}
                          </button>
                          <span className="text-primary small fw-bold">선택 &gt;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
