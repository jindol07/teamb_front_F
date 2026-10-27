import { Outlet } from 'react-router-dom';
import UserHeader from './UserHeader';
import UserFooter from './UserFooter';
import FloatingChatbot from '../components/FloatingChatbot';
import { ChatbotProvider } from '../pages/user/chatbot/ChatbotContext';
import RequireAuth from '../auth/RequireAuthProps'; // 만약 경로가 다르다면 기존 경로를 확인해주세요!

/**
 * UserLayout
 * ------------------------------------------------------------------
 * 사용자(User) 관련 모든 페이지가 공통으로 사용하는 레이아웃입니다.
 * Header - (실제 페이지 내용) - Footer 구조로 고정되어 있습니다.
 *
 * <Outlet />는 React Router가 현재 URL에 해당하는 페이지 컴포넌트를
 * 이 자리에 그대로 렌더링해주는 역할을 합니다.
 * (자세한 연결은 src/router/UserRouter.tsx 참고)
 */
export default function UserLayout() {
  return (
    <RequireAuth allowedRoles={["OFFICE"]}>
      <ChatbotProvider>
        <div className="d-flex flex-column min-vh-100">
          <UserHeader />
          <main className="flex-grow-1">
            <Outlet />
          </main>
          <UserFooter />
          {/* 사용자 페이지 공통 플로팅 AI 챗봇 */}
          <FloatingChatbot />
        </div>
      </ChatbotProvider>
    </RequireAuth>
  );
}
