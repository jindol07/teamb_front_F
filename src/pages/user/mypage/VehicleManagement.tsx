import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { userVehicleApi, type UserVehicle } from '../../../api/uservehicleApi';
import style from './VehicleManmentag.module.css';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formAlert, setFormAlert] = useState('');

  const [carNumber, setCarNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [carModel, setCarModel] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isVehicleListOpen, setIsVehicleListOpen] = useState(false);

  const loadVehicles = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setVehicles(await userVehicleApi.getMine());
    } catch {
      setErrorMessage('차량 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const handleAdd = async () => {
    const number = carNumber.trim();
    const owner = ownerName.trim();
    const model = carModel.trim();

    if (!number || !owner || !model) {
      setFormAlert('차량번호, 차주명과 차종을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setErrorMessage('');
    try {
      await userVehicleApi.requestRegistration(number, owner, model);
      setCarNumber('');
      setOwnerName('');
      setCarModel('');
      setMessage('차량 등록 신청이 접수되었습니다. 관리자 승인 후 목록에 표시됩니다.');
    } catch (error) {
      const responseData = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string; detail?: string } | undefined)
        : undefined;
      const responseMessage = responseData?.message ?? responseData?.detail;
      setErrorMessage(responseMessage ?? '차량 등록 신청에 실패했습니다. 입력 정보를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (vehicle: UserVehicle) => {
    if (vehicles.length === 1) {
      alert('최소 1대의 차량은 등록되어 있어야 합니다.');
      return;
    }

    if (!confirm('차량을 삭제하시겠습니까?')) return;

    setErrorMessage('');
    try {
      await userVehicleApi.delete(vehicle.id);
      setVehicles((prev) => prev.filter((item) => item.id !== vehicle.id));
    } catch {
      setErrorMessage('차량 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className={style['vm-page']}>
      <main className={style['vm-main']}>
        <header className={style['vm-topbar']}>
          <div className={style['vm-breadcrumb']}>
            마이페이지 <span>/</span>
            <strong>내 차량 관리</strong>
          </div>

          <div className={style['vm-top-user']}>
            <span className={style['vm-top-avatar']}>U</span>
            <span>사용자님</span>
          </div>
        </header>

        <section className={style['vm-content']} id="vehicles">
          <div className={style['vm-heading']}>
            <div>
              <span className={style['vm-eyebrow']}>MY VEHICLES</span>
              <h1>내 차량 관리</h1>
              <p>등록한 차량 정보를 한곳에서 편리하게 관리하세요.</p>
            </div>
            <button
              type="button"
              className={style['vm-guide-button']}
              onClick={() => setIsGuideOpen(true)}
            >
              <span aria-hidden="true">ⓘ</span>
              내 차량 관리 이용 안내
            </button>
          </div>

          {isGuideOpen && (
            <div
              className={style['vm-modal-backdrop']}
              onClick={() => setIsGuideOpen(false)}
            >
              <section
                className={style['vm-modal']}
                role="dialog"
                aria-modal="true"
                aria-labelledby="vm-modal-title"
                onClick={(e) => e.stopPropagation()}
              >
                <header className={style['vm-modal-header']}>
                  <div className={style['vm-modal-title-wrap']}>
                    <span className={style['vm-modal-icon']}>ⓘ</span>
                    <div>
                      <h2 id="vm-modal-title"> 내 차량 관리 이용 안내</h2>
                      <p>차량 등록 및 관리 방법을 확인해 주세요.</p>
                      <p>또한 차량에 대해서 문제가 있을 시 관리자에게 문의 부탁드립니다!</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={style['vm-modal-close']}
                    aria-label="안내 창 닫기"
                    onClick={() => setIsGuideOpen(false)}
                  >
                    ×
                  </button>
                </header>

                <div className={style['vm-modal-body']}>
                  <article className={style['vm-guide-item']}>
                    <span className={style['vm-guide-number']}>01</span>
                    <div>
                      <h3>차량 추가 등록</h3>
                      <p>차량번호와 차종을 정확하게 입력한 뒤 관리자 승인이 된 후 출입이 가능합니다.</p>
                      <p>또한 추가 차량에 대한 추가 금액은 매월 관리비로 청구 됩니다.</p>
                    </div>
                  </article>

                  <article className={style['vm-guide-item']}>
                    <span className={style['vm-guide-number']}>02</span>
                    <div>
                      <h3>등록 차량 확인</h3>
                      <p>상단의 등록된 내 차량 영역을 마우스를 올리면 차량 목록을 확인할 수 있습니다.</p>
                    </div>
                  </article>

                  <article className={style['vm-guide-item']}>
                    <span className={style['vm-guide-number']}>03</span>
                    <div>
                      <h3>차량번호 중복 확인</h3>
                      <p>동일한 차량번호는 중복 등록할 수 없으니 입력 정보를 확인해 주세요.</p>
                    </div>
                  </article>

                  <article className={style['vm-guide-item']}>
                    <span className={style['vm-guide-number']}>04</span>
                    <div>
                      <h3>차량 삭제</h3>
                      <p>차량 삭제 전 삭제하는 차량이 맞는지 다시 한 번 확인해 주세요.</p>
                      <p>주의!! 삭제 하신 차량은 다시 등록할 수 없습니다.</p>
                    </div>
                  </article>
                </div>

                <footer className={style['vm-modal-footer']}>
                  <button
                    type="button"
                    className={style['vm-modal-confirm']}
                    onClick={() => setIsGuideOpen(false)}
                  >
                    확인
                  </button>
                </footer>
              </section>
            </div>
          )}

          {formAlert && (
            <div
              className={style['vm-alert-backdrop']}
              onClick={() => setFormAlert('')}
            >
              <section
                className={style['vm-alert-modal']}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="vm-alert-title"
                aria-describedby="vm-alert-message"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={style['vm-alert-content']}>
                  <h2 id="vm-alert-title">입력 내용을 확인해주세요</h2>
                  <p id="vm-alert-message">{formAlert}</p>
                </div>
                <footer className={style['vm-alert-footer']}>
                  <button
                    type="button"
                    className={style['vm-alert-confirm']}
                    autoFocus
                    onClick={() => setFormAlert('')}
                  >
                    확인
                  </button>
                </footer>
              </section>
            </div>
          )}

          {/* 등록 차량 요약 및 드롭다운 */}
          <section
            className={`${style['vm-summary']} ${
              isVehicleListOpen ? style['vm-summary-open'] : ''
            }`}
            onMouseEnter={() => setIsVehicleListOpen(true)}
            onMouseLeave={() => setIsVehicleListOpen(false)}
          >
            <button
              type="button"
              className={style['vm-summary-trigger']}
              aria-expanded={isVehicleListOpen}
              aria-controls="registered-vehicle-list"
              onClick={() => setIsVehicleListOpen((prev) => !prev)}
            >
              <div className={style['vm-summary-icon']}>🚘</div>

              <div className={style['vm-summary-text']}>
                <span>등록된 내 차량</span>
                <strong>
                  {isLoading ? '…' : vehicles.length}
                  <small> 대</small>
                </strong>
                <p>마우스를 올려 차량 목록을 확인하세요.</p>
              </div>
              
              <div className={style['vm-summary-decoration']}>AI Alpha Parking</div>
            </button>

            {isVehicleListOpen && (
              <div id="registered-vehicle-list" className={style['vm-vehicle-dropdown']}>
                <div className={style['vm-list-heading']}>
                  <div>
                    <h2>
                      등록 차량 목록
                      <span>{isLoading ? '…' : vehicles.length}</span>
                    </h2>
                    <p>등록한 차량의 정보를 확인하고 관리할 수 있어요.</p>
                  </div>
                </div>

                {isLoading ? (
                  <div className={style['vm-empty']}>
                    <p>차량 목록을 불러오는 중입니다.</p>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className={style['vm-empty']}>
                    <div>🚘</div>
                    <h3>등록된 차량이 없습니다.</h3>
                    <p>위 입력창에서 첫 번째 차량을 등록해보세요.</p>
                  </div>
                ) : (
                  <div className={style['vm-vehicle-list']}>
                    {vehicles.map((vehicle) => (
                      <article className={style['vm-vehicle-card']} key={vehicle.id}>
                        <div className={style['vm-car-visual']}>🚙</div>

                        <div className={style['vm-car-info']}>
                          <span
                            className={`${style['vm-car-badge']} ${
                              vehicle.registrationTypeCode === 'ADDITIONAL'
                                ? style['vm-car-badge-additional']
                                : style['vm-car-badge-initial']
                            }`}
                          >
                            {vehicle.registrationTypeCode === 'ADDITIONAL'
                              ? '추가 등록 차량'
                              : '기존 등록 차량'}
                          </span>
                            <h3>{vehicle.vehicleModel}</h3>
                          <p>
                            <span>차량번호</span>
                            <strong>{vehicle.vehicleNumber}</strong>
                          </p>
                        </div>

                        <div className={style['vm-card-actions']}>
                          <button
                            type="button"
                            className={style['vm-delete-btn']}
                            onClick={() => void handleDelete(vehicle)}
                          >
                            삭제
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 추가 차량 등록 */}
          <section className={`${style['vm-panel']} ${style['vm-register']}`}>
            <div className={style['vm-panel-heading']}>
              <div className={style['vm-section-icon']}>＋</div>
              <div>
                <h2>추가 차량 등록</h2>
                <p>차량번호, 차주명, 차종을 정확하게 입력해주세요.</p>
              </div>
            </div>

            <form
              className={style['vm-register-form']}
              onSubmit={(e) => {
                e.preventDefault();
                void handleAdd();
              }}
            >
              <label className={style['vm-field']}>
                <span>차량번호</span>
                <input
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value)}
                  placeholder="예: 12가3456"
                  maxLength={20}
                />
              </label>

              <label className={style['vm-field']}>
                <span>차주명</span>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="예: 홍길동"
                  maxLength={50}
                />
              </label>
              <label className={style['vm-field']}>
                <span>차종</span>
                <input
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="예: 아반떼"
                  maxLength={50}
                />
              </label>

              <button className={style['vm-primary-btn']} type="submit" disabled={isSubmitting}>
                {isSubmitting ? '신청 중…' : '＋ 차량 등록 신청'}
              </button>
            </form>
            {message && <p role="status" className="mt-3 mb-0 text-success">{message}</p>}
            {errorMessage && <p role="alert" className="mt-3 mb-0 text-danger">{errorMessage}</p>}
          </section>

          <footer className={style['vm-footer']}>
            <span>VEHICLE CARE</span>
            <span>안전하고 편리한 차량 관리</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
