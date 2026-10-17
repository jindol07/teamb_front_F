/*
  알파카 챗봇 상단 프로필
*/
export default function ChatHeader() {
    return (
        <div className="alpaca-chat-header">
            <div className="alpaca-chat-profile">
                <div className="alpaca-profile-icon">
                    <img
                        src="/images/alpha1.png"
                        alt="알파카"
                    />
                </div>
                <div>
                    <div className="fw-bold">
                        알파킹
                    </div>
                    <div className="small text-secondary">
                        AI 주차 도우미
                    </div>
                </div>
            </div>
        </div>
    );
}