import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../auth/reducers/store';
import { RootState } from '../../../auth/reducers';
import { login } from '../../../auth/actions/authActions';
import { parseJwt } from '../../../auth/jwtUtils';

/**
 * 사용자 로그인 페이지 (/user/login)
 * 현재는 실제 인증을 구현하지 않으며, 로그인 버튼을 누르면 바로 /user로 이동합니다.
 */
export default function UserLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = parseJwt(token);
        if (!decoded) return;
        if (decoded.role !== 'OFFICE') return;

        if (redirectPath == '/') {
            navigate('/user', { replace: true });
        } else {
            navigate(redirectPath, { replace: true });
        }
    }, []);

    // login후 이동할 경로 설정 위해서 useLocation훅을 사용한다.
    const location = useLocation();
    console.log("location.search:" + location.search);
    // 로그인 시 리다이렉트할 경로 설정 (기본값은 메인 페이지)
    const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';

    // redux 설정 추가 --------------------------------------------------
    const dispatch = useAppDispatch();
    // const error = useSelector((state: RootState) => state.auth.error);
    // ---------------------------------------------------------------------

    const submitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const success = await dispatch(login(username, password));

        if (!success) {
            setErrorMessage('아이디 또는 비밀번호를 확인하세요.');
            return;
        }

        if (redirectPath == '/') {
            navigate('/user', { replace: true });
        } else {
            navigate(redirectPath, { replace: true });
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center py-5">
            <div className="w-100" style={{ maxWidth: 400 }}>
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-primary">주차관제 서비스</h2>
                    <p className="text-secondary">회원 서비스를 이용하려면 로그인해주세요.</p>
                </div>

                <form onSubmit={submitLogin}>
                    <div className="mb-3">
                        <label htmlFor="userId" className="form-label">
                            아이디
                        </label>
                        <input type="text" id="userId" className="form-control" placeholder="아이디"
                            value={username} onChange={ (e) => setUsername(e.target.value) } />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="userPw" className="form-label">
                            비밀번호
                        </label>
                        <input type="password" id="userPw" className="form-control" placeholder="비밀번호"
                            value={password } onChange={ (e) => setPassword(e.target.value) } />
                    </div>

                    {errorMessage && <div style={{marginBottom:20,color:'red',}}>{errorMessage}</div>}

                    <button type="submit" className="btn btn-primary w-100 mb-3">
                        로그인
                    </button>
                    <button
                        style={{ backgroundColor: '#03C75A', border: 'none' }}
                        type="button"
                        className="btn btn-primary w-100 mb-3"
                        onClick={() => {
                        }}
                    >
                        <div className="">
                            <div
                                style={{
                                    width: '26px',
                                    height: '26px',
                                    backgroundColor: '#FFFFFF',
                                    color: '#03C75A',
                                    fontSize: '18px',
                                    fontWeight: 900,
                                    display: 'inline-block',
                                    marginRight: 4,
                                }}
                            >
                                N
                            </div>
                            <span>네이버 로그인</span>
                        </div>
                    </button>

                    <div className="d-flex justify-content-between small">
                        <Link to="/user/signup" className="text-decoration-none">
                            회원가입
                        </Link>
                        {/* <Link to="/admin/login" className="text-decoration-none">
                            관리자 로그인 &rarr;
                        </Link> */}
                    </div>
                </form>
            </div>
        </div>
    );
}
