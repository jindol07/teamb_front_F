import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../auth/reducers/store';
import { adminLogin, login } from '../../../auth/actions/authActions';
import { parseJwt } from '../../../auth/jwtUtils';

/**
 * 관리자 로그인 페이지 (/admin/login)
 * 사용자 로그인과 완전히 분리된 화면입니다.
 */
export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = parseJwt(token);
        if (!decoded) return;
        if (decoded.role !== 'ADMIN') return;

        if (redirectPath == '/') {
            navigate('/admin/dashboard', { replace: true });
        } else {
            navigate(redirectPath, { replace: true });
        }
    }, []);

    // login후 이동할 경로 설정 위해서 useLocation훅을 사용한다.
    const location = useLocation();

    // 로그인 시 리다이렉트할 경로 설정 (기본값은 메인 페이지)
    const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';

    // redux 설정 추가 --------------------------------------------------
    const dispatch = useAppDispatch();
    // const error = useSelector((state: RootState) => state.auth.error);
    // ---------------------------------------------------------------------

    const submitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage('');

        const success = await dispatch(adminLogin(username, password));
        
        if (!success) {
            setErrorMessage('아이디 또는 비밀번호를 확인하세요.');
            return;
        }

        if (redirectPath == '/') {
            navigate('/admin/dashboard', { replace: true });
        } else {
            navigate(redirectPath, { replace: true });
        }
    };


    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: '100vh', backgroundColor: 'var(--admin-primary)' }}
        >
            <div className="bg-white p-4 rounded w-100" style={{ maxWidth: 400 }}>
                <div className="text-center mb-4">
                    <h2 className="fw-bold" style={{ color: 'var(--admin-primary)' }}>
                        주차관제 관리자 시스템
                    </h2>
                    <p className="text-secondary small">관리자 계정으로 로그인해주세요.</p>
                </div>

                <form onSubmit={submitLogin}>
                    <div className="mb-3">
                        <label htmlFor="adminId" className="form-label">
                            아이디
                        </label>
                        <input type="text" id="adminId" className="form-control" placeholder="아이디"
                            value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="adminPw" className="form-label">
                            비밀번호
                        </label>
                        <input type="password" id="adminPw" className="form-control" placeholder="비밀번호"
                            value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    {errorMessage && <div style={{marginBottom:20,color:'red',}}>{errorMessage}</div>}

                    <button type="submit" className="btn btn-primary w-100 mb-3">
                        로그인
                    </button>

                    <div className="d-flex justify-content-between small">
                        {/* <Link to="/admin/signup" className="text-decoration-none">관리자 가입</Link> */}
                        <Link to="/user/login" className="text-decoration-none">
                            &larr; 사용자 로그인으로 이동
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
