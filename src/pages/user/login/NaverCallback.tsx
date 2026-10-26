import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOffice, naverLogin } from '../../../auth/actions/authActions';
import { loginSuccess } from '../../../auth/reducers/authReducer';
import { useAppDispatch } from '../../../auth/reducers/store';
import { parseJwt } from '../../../auth/jwtUtils';
import { saveTokens } from '../../../api/axios';

const REDIRECT_KEY = 'naver_redirect_path';

/**
 * 네이버 로그인 콜백 (/user/oauth/naver/callback)
 *
 * 네이버가 돌려준 code/state를 백엔드로 넘기고, 기존 로그인과 동일하게
 * access/refresh 토큰을 저장한 뒤 원래 페이지로 이동한다.
 */
export default function NaverCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // React.StrictMode에서는 effect가 두 번 실행된다.
    // 네이버 code는 1회용이라 두 번째 요청은 실패하므로 한 번만 처리한다.
    const requested = useRef(false);

    useEffect(() => {
        if (requested.current) return;
        requested.current = true;

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error || !code || !state) {
            navigate('/user/login?naver=cancel', { replace: true });
            return;
        }

        (async () => {
            const result = await naverLogin(code, state);

            if (!result.ok) {
                sessionStorage.setItem('naver_login_error', result.message);
                navigate('/user/login?naver=fail', { replace: true });
                return;
            }

            saveTokens(result.accessToken, result.refreshToken, 'user');

            // 로그인 아이디는 토큰 subject로 채우고, 실패하면 기존 API로 보완한다.
            const payload = parseJwt(result.accessToken);
            let loginId = typeof payload?.sub === 'string' ? payload.sub : '';

            if (!loginId) {
                const office = await getOffice();
                loginId = office?.data?.username ?? '';
            }

            if (loginId) localStorage.setItem('username', loginId);
            dispatch(loginSuccess({ username: loginId, token: result.accessToken }));

            const savedRedirect = sessionStorage.getItem(REDIRECT_KEY);
            sessionStorage.removeItem(REDIRECT_KEY);

            const target =
                savedRedirect && savedRedirect.startsWith('/') ? savedRedirect : '/user';

            navigate(target, { replace: true });
        })();
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="container py-5 text-center">
            <div className="spinner-border text-success mb-3" role="status" />
            <p className="mb-0">네이버 로그인 처리 중입니다...</p>
        </div>
    );
}
