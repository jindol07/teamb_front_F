import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * AdminSidebar
 * ------------------------------------------------------------------
 * 관리자 Dashboard 좌측 메뉴입니다. 메뉴 구성은 다음과 같습니다.
 *
 *   대시보드
 *   공지사항
 *   주차관제 (Dropdown)
 *     ├ 관리
 *     └ 현황
 *   차량관리
 *   이력
 *
 * [주차관제 Dropdown 구현 방식에 대한 설명]
 * 문서 요구사항에 따라 useRef를 활용해 Dropdown을 구현합니다.
 * 다만 "열림/닫힘" 상태 자체는 화면을 다시 그려야 하는 값이므로
 * useState로 관리하고, useRef는 다음 두 가지 역할에 사용합니다.
 *   1) 메뉴 바깥 영역을 클릭했을 때 Dropdown을 자동으로 닫기 위한
 *      DOM 요소 참조 (sidebarRef)
 *   2) 열림/닫힘 상태만 억지로 useRef로 관리하면 클릭해도 화면이
 *      다시 그려지지 않아 Dropdown이 눈에 보이지 않는 문제가 생깁니다.
 *      따라서 상태 표시는 useState, 바깥 클릭 감지는 useRef로
 *      역할을 나누는 것이 더 안정적이고 읽기 쉬운 코드라고 판단했습니다.
 */

const menuItemClass = (isActive: boolean) => `nav-link ${isActive ? 'active' : ''}`;
const subMenuItemClass = (isActive: boolean) =>
  `nav-sublink ${isActive ? 'active' : ''}`;

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isParkingMenuOpen, setIsParkingMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const isParkingPath = location.pathname.startsWith('/admin/parking');

  // 주차관제 하위 페이지에 있을 때는 Dropdown을 기본으로 열어 둡니다.
  useEffect(() => {
    if (isParkingPath) {
      setIsParkingMenuOpen(true);
    }
  }, [isParkingPath]);

  // 사이드바 바깥을 클릭하면 Dropdown을 닫습니다.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !isParkingPath
      ) {
        setIsParkingMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isParkingPath]);

  const toggleParkingMenu = () => {
    setIsParkingMenuOpen((prev) => !prev);
  };

  const goTo = (path: string) => {
    navigate(path);
  };

  return (
    <nav ref={sidebarRef} className="admin-sidebar py-3">
      <ul className="nav flex-column">
        <li className="nav-item">
          <span
            className={menuItemClass(location.pathname === '/admin/dashboard')}
            onClick={() => goTo('/admin/dashboard')}
          >
            대시보드
          </span>
        </li>

        <li className="nav-item">
          <span
            className={menuItemClass(location.pathname === '/admin/notice')}
            onClick={() => goTo('/admin/notice')}
          >
            공지사항
          </span>
        </li>

        <li className="nav-item">
          <span
            className={menuItemClass(isParkingPath)}
            onClick={toggleParkingMenu}
          >
            주차관제 {isParkingMenuOpen ? '▲' : '▼'}
          </span>

          {isParkingMenuOpen && (
            <ul className="nav flex-column">
              <li>
                <span
                  className={subMenuItemClass(
                    location.pathname === '/admin/parking/manage',
                  )}
                  onClick={() => goTo('/admin/parking/manage')}
                >
                  관리
                </span>
              </li>
              <li>
                <span
                  className={subMenuItemClass(
                    location.pathname === '/admin/parking/status',
                  )}
                  onClick={() => goTo('/admin/parking/status')}
                >
                  현황
                </span>
              </li>
            </ul>
          )}
        </li>

        <li className="nav-item">
          <span
            className={menuItemClass(location.pathname === '/admin/vehicle')}
            onClick={() => goTo('/admin/vehicle')}
          >
            차량관리
          </span>
        </li>

        <li className="nav-item">
          <span
            className={menuItemClass(location.pathname === '/admin/history')}
            onClick={() => goTo('/admin/history')}
          >
            이력
          </span>
        </li>
      </ul>
    </nav>
  );
}
