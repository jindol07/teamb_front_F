import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { myPageApi, myPageError } from '../../../api/myPageApi';
import { logoutAction } from '../../../auth/actions/authActions';
import { useAppDispatch } from '../../../auth/reducers/store';
import PasswordChange from './PasswordChange';
import styles from './MyInfo.module.css';

// 비밀번호 변경과 확인 절차를 포함한 회원 탈퇴 화면을 제공한다.
export default function AccountManagement() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // 비밀번호와 확인 문구를 검증해 탈퇴하고 성공 시 기존 로그아웃 흐름으로 이동한다.
  async function withdraw(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (!currentPassword || confirmation !== '탈퇴') {
      setError('현재 비밀번호와 확인 문구 ‘탈퇴’를 입력해 주세요.'); return;
    }
    setSaving(true);
    try {
      await myPageApi.withdraw(currentPassword, confirmation);
    } catch (failure) {
      setError(myPageError(failure, '탈퇴하지 못했습니다. 비밀번호와 계정 상태를 확인해 주세요.'));
      setCurrentPassword(''); setSaving(false); return;
    }
    // 탈퇴 성공 후에는 기존 로그아웃 흐름으로 현재 기기의 로컬 세션과 refresh 토큰을 정리한다.
    setCurrentPassword('');
    await dispatch(logoutAction());
    navigate('/user/login', { replace: true, state: { message: '회원 탈퇴가 완료되었습니다.' } });
  }
  return <div className={styles.accountGrid}>
    <PasswordChange />
    <section aria-labelledby="mypage-withdraw-title">
      <h5 id="mypage-withdraw-title">회원 탈퇴</h5>
      <p className={styles.muted}>탈퇴하면 서비스 이용이 종료됩니다. 기존 주차·관리비·마일리지 거래 기록은 보존됩니다.</p>
      {!open && <button className="btn btn-outline-danger mt-2" type="button" onClick={() => setOpen(true)}>회원 탈퇴</button>}
      {open && <form className="d-grid gap-3 mt-3" onSubmit={withdraw}>
        <label className="form-label mb-0">현재 비밀번호
          <input className="form-control mt-1" type="password" autoComplete="current-password" required
            value={currentPassword} disabled={saving} onChange={e => setCurrentPassword(e.target.value)} />
        </label>
        <label className="form-label mb-0">확인을 위해 ‘탈퇴’를 입력하세요.
          <input className="form-control mt-1" autoComplete="off" required
            value={confirmation} disabled={saving} onChange={e => setConfirmation(e.target.value)} />
        </label>
        <div className={styles.actions}>
          <button className="btn btn-danger" type="submit" disabled={saving || confirmation !== '탈퇴'}>{saving ? '처리 중…' : '확인 후 회원 탈퇴'}</button>
          <button className="btn btn-outline-secondary" type="button" disabled={saving} onClick={() => {
            setOpen(false); setCurrentPassword(''); setConfirmation(''); setError('');
          }}>돌아가기</button>
        </div>
        {error && <p className="text-danger" role="alert">{error}</p>}
      </form>}
    </section>
  </div>;
}
