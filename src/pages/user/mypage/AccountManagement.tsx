//로그아웃·회원탈퇴
export default function AccountManagement() {
    const handleWithdraw = () => {
        const result =
            confirm(
                '정말 회원탈퇴하시겠습니까?'
            );
        if (!result) {
            return;
        }
        // Spring Boot 회원탈퇴 API 호출
    };
    return (
        <div className="card p-4">
            <h4 className="mb-4">
                계정 관리
            </h4>
            <div>
                <h5 className="text-danger">
                    회원탈퇴
                </h5>
                <p className="text-muted">
                    회원탈퇴 후 계정 복구가 어려울 수 있습니다.
                </p>
                <button
                    className="btn btn-danger"
                    onClick={handleWithdraw}
                >
                    회원탈퇴
                </button>
            </div>
        </div>
    );
}