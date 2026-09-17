import { useEffect, useState } from 'react';

/**
 * useAgent
 * ------------------------------------------------------------------
 * 현재 접속 환경이 PC인지 모바일인지 대략적으로 판단하는 커스텀 훅입니다.
 *
 * ⚠️ 주의:
 * 이 훅은 "조건부로 다른 UI를 보여줘야 할 때"(예: 모바일에서는 버튼 텍스트를
 * 짧게, PC에서는 안내 문구를 추가로 보여주는 경우)를 위한 보조 도구입니다.
 *
 * 실제 레이아웃이 화면 크기에 따라 자연스럽게 바뀌는 "반응형 레이아웃"은
 * 이 훅이 아니라 Bootstrap 5의 Grid 시스템(Container/Row/Col)과
 * CSS Media Query로 구현합니다.
 *
 * 즉,
 *  - useAgent        → "PC냐 모바일이냐"를 알아야 하는 조건부 로직/UI에만 사용
 *  - Bootstrap Grid   → 실제 레이아웃 배치는 여기서 담당
 *
 * 사용 예:
 * ```tsx
 * const { isMobile } = useAgent();
 * return <button>{isMobile ? '예약' : '주차 예약하기'}</button>;
 * ```
 */

interface UseAgentResult {
  /** 모바일 기기로 판단되면 true */
  isMobile: boolean;
  /** PC(데스크톱)로 판단되면 true */
  isPC: boolean;
  /** 판단에 사용된 원본 User Agent 문자열 */
  userAgent: string;
}

function detectMobile(ua: string): boolean {
  // 대표적인 모바일 기기 키워드로 판단합니다.
  // (완벽한 판단은 아니며, 대략적인 UI 분기용으로만 사용합니다.)
  return /Android|iPhone|iPad|iPod|Mobile|BlackBerry|Windows Phone/i.test(ua);
}

export default function useAgent(): UseAgentResult {
  const [userAgent, setUserAgent] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setUserAgent(ua);
    setIsMobile(detectMobile(ua));
  }, []);

  return {
    isMobile,
    isPC: !isMobile,
    userAgent,
  };
}
