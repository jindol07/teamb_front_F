import { useState } from 'react';
import useAgent from '../../../hooks/useAgent';
import PasswordChange from '../../../components/mypage/PasswordChange';
import VehicleManagement from '../../../components/mypage/VehicleManagement';
import ParkingHistory from '../../../components/mypage/ParkingHistory';
import AccountManagement from '../../../components/mypage/AccountManagement';
// 마이페이지 메뉴 타입
type MenuType =
    | 'password'
    | 'vehicle'
    | 'parking'
    | 'account';
export default function MyPage() {
    // 모바일 여부 확인
    const { isMobile } = useAgent();
    // 현재 선택된 메뉴
    const [selectedMenu, setSelectedMenu] =
        useState<MenuType>('password');
    // 선택된 메뉴에 따라 화면 변경
    const renderContent = () => {
        switch (selectedMenu) {
            case 'password':
                return <PasswordChange />;
            case 'vehicle':
                return <VehicleManagement />;
            case 'parking':
                return <ParkingHistory />;
            case 'account':
                return <AccountManagement />;
            default:
                return <PasswordChange />;
        }
    };
    return (
        <div className="container py-4">
            {/* 마이페이지 제목 */}
            <h2 className="mb-2">
                마이페이지
            </h2>
            <p className="text-muted mb-4">
                회원정보와 차량 및 주차 이용 내역을 관리하세요.
            </p>
            {/* 모바일 화면 */}
            {isMobile ? (
                <div>
                    {/* 모바일 메뉴 */}
                    <div className="d-grid gap-2 mb-4">
                        <button
                            type="button"
                            className={`btn ${selectedMenu === 'password'
                                ? 'btn-primary'
                                : 'btn-outline-primary'
                                }`}
                            onClick={() =>
                                setSelectedMenu('password')
                            }
                        >
                            회원정보 수정
                        </button>
                        <button
                            type="button"
                            className={`btn ${selectedMenu === 'vehicle'
                                ? 'btn-primary'
                                : 'btn-outline-primary'
                                }`}
                            onClick={() =>
                                setSelectedMenu('vehicle')
                            }
                        >
                            내 차량 관리
                        </button>
                        <button
                            type="button"
                            className={`btn ${selectedMenu === 'parking'
                                ? 'btn-primary'
                                : 'btn-outline-primary'
                                }`}
                            onClick={() =>
                                setSelectedMenu('parking')
                            }
                        >
                            주차 이용 내역
                        </button>
                        <button
                            type="button"
                            className={`btn ${selectedMenu === 'account'
                                ? 'btn-primary'
                                : 'btn-outline-primary'
                                }`}
                            onClick={() =>
                                setSelectedMenu('account')
                            }
                        >
                            계정 관리
                        </button>
                    </div>
                    {/* 선택된 메뉴 내용 */}
                    {renderContent()}
                </div>
            ) : (
                /* PC 화면 */
                <div className="row">
                    {/* 왼쪽 메뉴 */}
                    <div className="col-md-3">
                        <div className="list-group">
                            <button
                                type="button"
                                className={`list-group-item list-group-item-action ${selectedMenu === 'password'
                                    ? 'active'
                                    : ''
                                    }`}
                                onClick={() =>
                                    setSelectedMenu('password')
                                }
                            >
                                회원정보 수정
                            </button>
                            <button
                                type="button"
                                className={`list-group-item list-group-item-action ${selectedMenu === 'vehicle'
                                    ? 'active'
                                    : ''
                                    }`}
                                onClick={() =>
                                    setSelectedMenu('vehicle')
                                }
                            >
                                내 차량 관리
                            </button>
                            <button
                                type="button"
                                className={`list-group-item list-group-item-action ${selectedMenu === 'parking'
                                    ? 'active'
                                    : ''
                                    }`}
                                onClick={() =>
                                    setSelectedMenu('parking')
                                }
                            >
                                주차 이용 내역
                            </button>
                            <button
                                type="button"
                                className={`list-group-item list-group-item-action ${selectedMenu === 'account'
                                    ? 'active'
                                    : ''
                                    }`}
                                onClick={() =>
                                    setSelectedMenu('account')
                                }
                            >
                                계정 관리
                            </button>
                        </div>
                    </div>
                    {/* 오른쪽 내용 */}
                    <div className="col-md-9">
                        {renderContent()}
                    </div>
                </div>
            )}
        </div>
    );
}