// 비밀번호 변경
import { useState } from 'react';
export default function PasswordChange() {
    const [currentPassword, setCurrentPassword] = useState('');
    //현재 비밀번호
    const [newPassword, setNewPassword] = useState('');
    //변경하려는 새 비밀번호
    const [confirmPassword, setConfirmPassword] = useState('');
    //새 비밀번호 확인
    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        // console.log 비번출력코드 제거
        console.log({
            currentPassword,
            newPassword,
        });
        // 추후 Spring Boot API 호출 *** 
    };
    return (
        <div className="card p-4">
            <h4 className="mb-4">
                비밀번호 변경
            </h4>
            <div className="mb-3">
                <label className="form-label">
                    현재 비밀번호
                </label>
                <input
                    // type="password": 실제 문자가 노출되지않음
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) =>
                        setCurrentPassword(e.target.value)
                    }
                />
            </div>
            <div className="mb-3">
                <label className="form-label">
                    새 비밀번호
                </label>
                <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) =>
                        setNewPassword(e.target.value)
                    }
                />
            </div>
            <div className="mb-3">
                <label className="form-label">
                    새 비밀번호 확인
                </label>
                <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) =>
                        setConfirmPassword(e.target.value)
                    }
                />
            </div>
            <button
                className="btn btn-primary"
                onClick={handleChangePassword}
            >
                비밀번호 변경
            </button>
        </div>
    );
}