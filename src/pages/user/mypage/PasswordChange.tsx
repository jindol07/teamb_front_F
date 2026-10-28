import { FormEvent, useState } from 'react';
import { myPageApi, myPageError } from '../../../api/myPageApi';

// 현재·새 비밀번호 입력과 변경 결과를 표시한다.
export default function PasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // 새 비밀번호를 검증해 변경을 요청하고 처리 후 입력한 비밀번호를 지운다.
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError(''); setMessage('');
    if (newPassword.length < 8 || newPassword.length > 20 || newPassword !== confirmPassword) {
      setError('새 비밀번호는 8~20자로 입력하고 확인 값과 일치해야 합니다.'); return;
    }
    setSaving(true);
    try {
      await myPageApi.changePassword(currentPassword, newPassword, confirmPassword);
      setMessage('비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
    } catch (failure) {
      setError(myPageError(failure, '비밀번호를 변경하지 못했습니다. 현재 비밀번호를 확인해 주세요.'));
    } finally {
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setSaving(false);
    }
  }
  return <section aria-labelledby="mypage-password-title">
    <h5 id="mypage-password-title">비밀번호 변경</h5>
    <form onSubmit={submit} className="d-grid gap-3 mt-3" style={{ maxWidth: 420 }}>
      <label className="form-label mb-0">현재 비밀번호
        <input className="form-control mt-1" type="password" autoComplete="current-password" required
          value={currentPassword} disabled={saving} onChange={e => setCurrentPassword(e.target.value)} />
      </label>
      <label className="form-label mb-0">새 비밀번호
        <input className="form-control mt-1" type="password" autoComplete="new-password" minLength={8} maxLength={20} required
          value={newPassword} disabled={saving} onChange={e => setNewPassword(e.target.value)} />
      </label>
      <label className="form-label mb-0">새 비밀번호 확인
        <input className="form-control mt-1" type="password" autoComplete="new-password" minLength={8} maxLength={20} required
          value={confirmPassword} disabled={saving} onChange={e => setConfirmPassword(e.target.value)} />
      </label>
      <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? '변경 중…' : '비밀번호 변경'}</button>
      {error && <p className="text-danger" role="alert">{error}</p>}
      {message && <p className="text-success" role="status">{message}</p>}
    </form>
  </section>;
}
