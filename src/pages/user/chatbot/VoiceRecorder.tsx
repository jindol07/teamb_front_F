import { CircleDot, Mic, Square, CircleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
// 브라우저 SpeechRecognition 타입 정의
interface SpeechRecognitionResultItem {
    transcript: string;
}
interface SpeechRecognitionEventData {
    resultIndex: number;
    results: ArrayLike<{
        isFinal: boolean;
        [index: number]: SpeechRecognitionResultItem;
    }>;
}
interface SpeechRecognitionErrorData {
    error: string;
}
interface SpeechRecognitionInstance {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechRecognitionEventData) => void) | null;
    onerror: ((event: SpeechRecognitionErrorData) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
}
interface SpeechRecognitionConstructor {
    new(): SpeechRecognitionInstance;
}
interface VoiceRecorderProps {
    onTranscriptChange: (text: string) => void;
    // 추가: 부모 컴포넌트에 오류 메시지 전달
    onErrorChange: (message: string | null) => void;
}
// 최대 음성 인식 시간 30초
const MAX_RECORDING_TIME = 30000;
export default function VoiceRecorder({
    onTranscriptChange,
    onErrorChange
}: VoiceRecorderProps) {
    // 현재 음성 인식 상태
    const [isRecording, setIsRecording] = useState(false);
    // 음성 인식 객체 저장
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    // 자동 종료 타이머 저장
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 부모 컴포넌트의 최신 콜백 저장
    const onTranscriptChangeRef = useRef(onTranscriptChange);
    // 추가: 오류 콜백 저장
    const onErrorChangeRef = useRef(onErrorChange);
    useEffect(() => {
        onTranscriptChangeRef.current = onTranscriptChange;
        onErrorChangeRef.current = onErrorChange;
    }, [onTranscriptChange, onErrorChange]);
    // 컴포넌트 종료 시 자원 정리
    useEffect(() => {
        return () => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
            }
            const recognition = recognitionRef.current;
            if (recognition) {
                recognition.onresult = null;
                recognition.onerror = null;
                recognition.onend = null;
                recognition.stop();
            }
        };
    }, []);
    // 음성 인식 시작
    const startRecording = () => {
        // 추가: 이전 오류 메시지 초기화
        onErrorChangeRef.current(null);
        // 브라우저 음성 인식 API 확인
        const browserWindow = window as typeof window & {
            SpeechRecognition?: SpeechRecognitionConstructor;
            webkitSpeechRecognition?: SpeechRecognitionConstructor;
        };
        const SpeechRecognition =
            browserWindow.SpeechRecognition ||
            browserWindow.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            // 추가: alert 대신 오류 메시지 전달
            onErrorChangeRef.current(
                "현재 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저에서 이용해 주세요."
            );
            return;
        }
        // 음성 인식 객체 생성
        const recognition = new SpeechRecognition();
        // 한국어 음성 인식
        recognition.lang = "ko-KR";
        // 연속 음성 인식
        recognition.continuous = true;
        // 말하는 중간 결과도 표시
        recognition.interimResults = true;
        // 음성 인식 객체 저장
        recognitionRef.current = recognition;
        // 음성 인식 결과 처리
        recognition.onresult = (event) => {
            let finalText = "";
            let interimText = "";
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalText += result[0].transcript.trim() + " ";
                } else {
                    interimText += result[0].transcript;
                }
            }
            const text = (finalText + interimText).trim();
            // 부모 컴포넌트로 텍스트 전달
            onTranscriptChangeRef.current(text);
        };
        // 추가: 오류 종류에 따라 메시지 전달
        recognition.onerror = (event) => {
            console.error("음성 인식 오류:", event.error);
            let errorMessage = "";
            switch (event.error) {
                case "not-allowed":
                case "service-not-allowed":
                    errorMessage =
                        "마이크 사용 권한을 허용해 주세요.";
                    break;
                case "audio-capture":
                    errorMessage =
                        "마이크를 찾을 수 없습니다. 연결 상태를 확인해 주세요.";
                    break;
                case "no-speech":
                    errorMessage =
                        "음성이 감지되지 않았어요. 다시 말씀해 주세요.";
                    break;
                case "network":
                    errorMessage =
                        "네트워크 연결을 확인한 후 다시 시도해 주세요.";
                    break;
                case "aborted":
                    // 사용자가 중단한 경우 안내 생략
                    break;
                default:
                    errorMessage =
                        "음성 인식에 실패했습니다. 다시 시도해 주세요.";
            }
            // 추가: 부모에게 오류 메시지 전달
            if (errorMessage) {
                onErrorChangeRef.current(errorMessage);
            }
        };
        // 음성 인식 종료 처리
        recognition.onend = () => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            recognitionRef.current = null;
            setIsRecording(false);
        };
        try {
            recognition.start();
            setIsRecording(true);
            // 최대 30초 후 자동 종료
            timerRef.current = setTimeout(() => {
                recognition.stop();
            }, MAX_RECORDING_TIME);
        } catch (error) {
            console.error("음성 인식 시작 오류:", error);
            // 추가: 시작 오류 메시지 전달
            onErrorChangeRef.current(
                "음성 인식을 시작할 수 없습니다. 다시 시도해 주세요."
            );
            recognitionRef.current = null;
            setIsRecording(false);
        }
    };
    // 사용자가 직접 음성 인식 종료
    const stopRecording = () => {
        recognitionRef.current?.stop();
    };
    return (
        <button
            type="button"
            className={
                isRecording
                    ? "btn btn-outline-danger d-flex align-items-center gap-2"
                    : "btn btn-outline-secondary d-flex align-items-center gap-2"
            }
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? "음성 인식 종료" : "음성 인식 시작"}
        >
            {isRecording ? (
                <>
                    <CircleDot size={18} color="#ef4444" />
                    인식 중...
                    <Square size={16} fill="currentColor" />
                    종료
                </>
            ) : (
                <Mic size={18} />
            )}
        </button>
    );
}