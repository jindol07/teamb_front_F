//auth/RequireAuthProps.tsx
import { parseJwt } from './jwtUtils';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface RequireAuthProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({
    children,
    allowedRoles
}) => {

    const location = useLocation();

    console.log(location);

    // 1. JWT 토큰 확인
    const token = localStorage.getItem('token');
    
    // 2. 로그인하지 않은 사용자
    if (!token) {
        if (location.pathname.startsWith("/admin")) {
            return (
                <Navigate
                    to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`}
                    replace
                />
            );
        } else {
            return (
                <Navigate
                    to={`/user/login?redirect=${encodeURIComponent(location.pathname)}`}
                    replace
                />
            );
        }
    }

    // 3. JWT에서 사용자 권한 추출
    const decoded = parseJwt(token);
    const userRole = decoded?.role;

    console.log(decoded, allowedRoles);

    // 4. 토큰이 잘못된 경우
    if (!decoded) {
        if (location.pathname.startsWith("/admin")) {
            return <Navigate to="/admin/login" replace />;
        } else {
            return <Navigate to="/user/login" replace />;
        }
    }

    console.log(location.pathname.startsWith("/admin"));

    // 5. 권한 검사
    if (allowedRoles) {
        if (!allowedRoles.includes(userRole) && userRole != "ADMIN") {
            return (
                <div className="container mt-5">
                    <h3>접근 권한이 없습니다.</h3>
                    <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
                </div>
            );
        }
        if (location.pathname.startsWith("/admin") && !userRole.includes("ADMIN")) {
            return (
                <div className="container mt-5">
                    <h3>정상적인 접근이 아닙니다.</h3>
                    <p>토큰이 일치하지 않습니다. 다시 로그인 하십시오.</p>
                </div>
            );
        } else if (location.pathname.startsWith("/user") && !userRole.includes("OFFICE")) {
            return (
                <div className="container mt-5">
                    <h3>정상적인 접근이 아닙니다.</h3>
                    <p>토큰이 일치하지 않습니다. 다시 로그인 하십시오.</p>
                </div>
            );
        }
    }

    // 6. 인증과 권한 검사를 통과한 경우
    return <>{children}</>;
};

export default RequireAuth;