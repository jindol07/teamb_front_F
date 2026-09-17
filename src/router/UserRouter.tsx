import { Route } from 'react-router-dom';
import UserLayout from '../layout/UserLayout';
import UserLogin from '../pages/user/login/UserLogin';
import UserHome from '../pages/user/home/UserHome';
import ParkingStatus from '../pages/user/parking-status/ParkingStatus';
import Notice from '../pages/user/notice/Notice';
import Reservation from '../pages/user/reservation/Reservation';
import UserSignUp from '../pages/user/login/UserSignUp';

/**
 * UserRoutes
 * ------------------------------------------------------------------
 * 사용자(User) 관련 모든 Route를 모아둔 곳입니다.
 *
 * ⚠️ 주의: 이 함수는 컴포넌트처럼 보이지만, 실제로는 <Route> 목록을
 * "그대로" 반환하는 일반 함수입니다. 그래서 AppRouter.tsx에서 사용할 때
 * <UserRoutes /> 처럼 태그로 쓰지 않고, 반드시 {UserRoutes()} 처럼
 * "함수 호출"로 사용해야 합니다. 그래야 <Route> 하나하나가
 * <Routes>의 자식으로 정확하게 인식됩니다.
 *
 * 새로운 사용자 페이지를 추가하고 싶다면, 아래에 <Route> 한 줄만
 * 추가하면 됩니다. (자세한 방법은 README의 "새로운 페이지 추가 방법" 참고)
 */
export default function UserRoutes() {
  return (
    <>
      {/* 로그인 화면은 공통 Header/Footer가 필요 없으므로 UserLayout 밖에 둡니다 */}
      <Route path="/user/login" element={<UserLogin />} />
      <Route path="/user/signup" element={<UserSignUp />} />

      {/* 아래 화면들은 모두 UserLayout(Header + Footer)을 함께 사용합니다 */}
      <Route path="/user" element={<UserLayout />}>
        <Route index element={<UserHome />} />
        <Route path="parking-status" element={<ParkingStatus />} />
        <Route path="notice" element={<Notice />} />
        <Route path="reservation" element={<Reservation />} />
      </Route>
    </>
  );
}
