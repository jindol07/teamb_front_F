import { CircleAlert } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';
/*
  채팅 입력 Props
*/
interface ChatInputProps {
    input: string;
    onInputChange: (text: string) => void;
    onSendMessage: () => void;
    onTranscriptChange: (text: string) => void;
    voiceError: string | null;
    onVoiceErrorChange: (message: string | null) => void;
}
export default function ChatInput({
    input,
    onInputChange,
    onSendMessage,
    onTranscriptChange,
    voiceError,
    onVoiceErrorChange
}: ChatInputProps) {
    /*
      Enter 키로 메시지 전송
    */
    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === 'Enter') {
            onSendMessage();
        }
    };
    return (
        <div className="alpaca-chat-input-wrapper">
            <div className="alpaca-chat-input-area">
                {/* 메시지 입력창 */}
                <input
                    type="text"
                    className="form-control"
                    placeholder="질문을 입력하거나 음성으로 말씀하세요."
                    value={input}
                    onChange={(e) =>
                        onInputChange(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                />
                {/* 음성 인식 버튼 */}
                <VoiceRecorder
                    onTranscriptChange={
                        onTranscriptChange
                    }
                    onErrorChange={
                        onVoiceErrorChange
                    }
                />
                {/* 전송 버튼 */}
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onSendMessage}
                >
                    전송
                </button>
            </div>
            {/* 음성 인식 오류 메시지 */}
            {voiceError && (
                <div
                    className="alpaca-voice-error"
                    role="alert"
                >
                    <CircleAlert size={18} />
                    <span>
                        {voiceError}
                    </span>
                </div>
            )}
        </div>
    );
}