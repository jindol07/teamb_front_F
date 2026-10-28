import { useState } from 'react';
import { CarFront, History, UserRound, Wallet } from 'lucide-react';
import VehicleManagement from './VehicleManagement';
import MileageHistory from './MileageHistory';
import ParkingHistory from './ParkingHistory';
import MyInfo from './MyInfo';
import styles from './MyInfo.module.css';

type MenuType = 'info' | 'parking' | 'vehicle' | 'mileage';
const menus = [
  { id: 'info' as const, label: '내 정보', icon: UserRound },
  { id: 'parking' as const, label: '주차 이용 내역', icon: History },
  { id: 'vehicle' as const, label: '내 차량 관리', icon: CarFront },
  { id: 'mileage' as const, label: '마일리지', icon: Wallet },
];

// 네 개의 마이페이지 메뉴와 선택한 메뉴의 기존·신규 화면을 표시한다.
export default function MyPage() {
  const [selectedMenu, setSelectedMenu] = useState<MenuType>('info');
  return (
    <div className={`container py-4 ${styles.page}`}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>AI ALPHA PARKING · MY PAGE</span>
        <h2>마이페이지</h2>
        <p>나의 계정부터 주차 생활까지, 한곳에서 편리하게.</p>
      </header>
      <div className={styles.layout}>
        <nav className={styles.navigation} aria-label="마이페이지 메뉴">
          {menus.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-current={selectedMenu === id ? 'page' : undefined}
              onClick={() => setSelectedMenu(id)}>
              <Icon size={18} aria-hidden="true" />{label}
            </button>
          ))}
        </nav>
        <main className={styles.content}>
          {selectedMenu === 'info' && <MyInfo />}
          {selectedMenu === 'parking' && <ParkingHistory />}
          {selectedMenu === 'vehicle' && <VehicleManagement />}
          {selectedMenu === 'mileage' && <MileageHistory />}
        </main>
      </div>
    </div>
  );
}
