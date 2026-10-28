import { useEffect, useState, useMemo } from 'react';
import { FaCarSide, FaRegClock, FaRegStar, FaStar } from 'react-icons/fa';
import { authFetch } from '../../../api/axios';
import './VehicleSearchModal.css';

export interface VehicleItem {
  id: number;
  visitDate: string;
  number: string;
  isFavorite: boolean;
}

const getFavoriteStorageKey = () => {
  const token = localStorage.getItem('token');
  const payload = token?.split('.')[1];
  if (!payload) return 'alpharking_reservation_favorite_vehicles';

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = atob(normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '='));
    const loginId = JSON.parse(decodedPayload).sub;
    return `alpharking_reservation_favorite_vehicles_${String(loginId || 'anonymous')}`;
  } catch {
    return 'alpharking_reservation_favorite_vehicles';
  }
};

interface VehicleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: Pick<VehicleItem, 'id' | 'number'>) => void;
}

export default function VehicleSearchModal({
  isOpen,
  onClose,
  onSelectVehicle,
}: VehicleSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [favoriteVehicles, setFavoriteVehicles] = useState<VehicleItem[]>(() => {
    try {
      const savedFavorites = localStorage.getItem(getFavoriteStorageKey());
      const parsedFavorites = savedFavorites ? JSON.parse(savedFavorites) : [];
      return Array.isArray(parsedFavorites)
        ? parsedFavorites.filter(
            (vehicle): vehicle is VehicleItem =>
              Number.isSafeInteger(vehicle?.id) && vehicle.id > 0 &&
              typeof vehicle.number === 'string' && typeof vehicle.visitDate === 'string',
          )
        : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const query = searchTerm.trim();
    if (!query) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const response = await authFetch(
          import.meta.env.VITE_BOOT_API_BASE_URL_U +
            `/api/vehicles/number/${encodeURIComponent(query)}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          },
        );

        if (response.status === 404) {
          setVehicles([]);
          return;
        }
        if (!response.ok) {
          throw new Error(`차량 검색에 실패했습니다. (${response.status})`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          setVehicles([]);
          return;
        }

        const mappedVehicles: VehicleItem[] = data
          .filter((vehicle: any) => {
            const deletedAt =
              vehicle.deletedAt ?? vehicle.deleted_at ?? vehicle.deletedat;
            return deletedAt == null;
          })
          .map((vehicle: any) => ({
            id: Number(vehicle.vehicleId ?? vehicle.vehicle_id ?? vehicle.vehicleid),
            visitDate:
              vehicle.registeredAt ?? vehicle.registered_at ?? vehicle.registeredat ??
              vehicle.createdAt ?? vehicle.created_at ?? vehicle.createdat ?? '-',
            number:
              vehicle.vehicleNumber ?? vehicle.vehicle_number ?? vehicle.vehiclenumber ?? '',
            isFavorite: false,
          }))
          .filter((vehicle: VehicleItem) => Number.isSafeInteger(vehicle.id) && vehicle.id > 0 && vehicle.number);
        setVehicles(mappedVehicles);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('차량 검색 에러:', error);
        setVehicles([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, searchTerm]);

  // 즐겨찾기 토글
  const handleToggleFavorite = (e: React.MouseEvent, vehicle: VehicleItem) => {
    e.stopPropagation();
    const isFavorite = favoriteVehicles.some((favorite) => favorite.id === vehicle.id);
    const nextFavorites = isFavorite
      ? favoriteVehicles.filter((favorite) => favorite.id !== vehicle.id)
      : [...favoriteVehicles, { ...vehicle, isFavorite: true }];
    setFavoriteVehicles(nextFavorites);
    localStorage.setItem(getFavoriteStorageKey(), JSON.stringify(nextFavorites));
  };

  // 💡 검색어 일부만 포함해도 실시간 필터링 (예: 23, 34, 67 등)
  const filteredVehicles = useMemo(() => {
    const favoriteIds = new Set(favoriteVehicles.map((vehicle) => vehicle.id));
    const allVehicles = [
      ...favoriteVehicles.map((vehicle) => ({ ...vehicle, isFavorite: true })),
      ...vehicles
        .filter((vehicle) => !favoriteIds.has(vehicle.id))
        .map((vehicle) => ({ ...vehicle, isFavorite: false })),
    ];

    return allVehicles
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
  }, [vehicles, favoriteVehicles, searchTerm]);

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const handleSelectVehicle = (vehicle: Pick<VehicleItem, 'id' | 'number'>) => {
    onSelectVehicle(vehicle);
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
                        onClick={() => handleSelectVehicle(vehicle)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="vehicle-info">
                          <span className="vehicle-visit-date text-muted small d-block">
                            <FaRegClock className="vehicle-row-icon" aria-hidden="true" />
                            {vehicle.visitDate}
                          </span>
                          <span className="vehicle-number fw-bold">
                            <FaCarSide className="vehicle-row-icon" aria-hidden="true" />
                            {vehicle.number}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={(e) => handleToggleFavorite(e, vehicle)}
                            title={vehicle.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                          >
                            {vehicle.isFavorite ? (
                              <FaStar className="vehicle-favorite-icon" aria-hidden="true" />
                            ) : (
                              <FaRegStar className="vehicle-favorite-icon" aria-hidden="true" />
                            )}
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
