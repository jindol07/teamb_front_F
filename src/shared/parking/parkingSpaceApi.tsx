/**
 * Spring Boot 관리자 서버(apcms_a)의 주차구획 API 통신 모듈.
 *
 * 원칙:
 * - 임의의 Mock 데이터는 반환하지 않음. 오류면 예외를 던짐.
 * - 관리자/사용자 조회 API를 분리하여 관리자 메모를 사용자에게 노출하지 않음.
 * - VITE_BOOT_API_BASE_URL(.env)로 각 개발자의 백엔드에 직접 요청.
 * - 운영에서는 /public 읽기 API를 apcms_u로 분리하고 권한/배포 경로를 확정해야 함.
 */
// 개인별 서버 주소는 Vite 환경변수(.env, .env.local)에서 읽습니다.
const API_ORIGIN = (import.meta.env.VITE_BOOT_API_BASE_URL ?? '').replace(/\/$/, '');
const BASE_URL = `${API_ORIGIN}/alpharking/admin/api/parking/spaces`;

/** 공개 현황 소켓도 기존 주차구획 GET과 동일한 서버를 사용합니다. */
export function getParkingWebSocketUrl(): string {
  const url = new URL(`${API_ORIGIN}/alpharking/admin/ws/parking/spaces`, window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

/** 실제 Oracle 테이블 JOIN 결과에 해당하는 서버 응답 JSON. */
export interface ParkingSpaceDto {
  parkingSpaceId: number;
  floorNo: number;
  zoneCode: string;
  spaceNumber: string;
  /** 백엔드에서 조합한 AI팀 공통 구획 코드 */
  spaceCode: string;
  spaceTypeCode: string;
  spaceStatusCode: string;
  xPosition: number | null;
  yPosition: number | null;
  width: number | null;
  height: number | null;
  /** 관리자에게만 반환하며 사용자 공개 API에는 존재하지 않음. */
  memo?: string | null;
  /** 관리자 응답 전용. 공개 API에는 포함되지 않습니다. */
  vehicleNumber?: string | null;
  updatedAt?: string | null;
}

/** 서버 메시지를 숨기지 않고 호출자에게 전달하는 공통 fetch 함수. */
async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    // 관리자 로그인 시 세션 쿠키를 전송하도록 준비. 현재 로그인 페이지는 아직 시연용.
    credentials: 'include',
    cache: 'no-store',
    ...init,
  });
  if (!response.ok) {
    // 로그인 미구현(401), 서버 장애(5xx), 경로 오류(404) 등을 UI에서 구분할 수 있음.
    throw new Error(`주차구획 API 오류: HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`주차구획 API가 JSON이 아닌 응답을 반환했습니다: ${contentType || 'Content-Type 없음'}`);
  }
  return (await response.json()) as T;
}

/** 관리자는 메모를 포함한 구획 목록 조회. 세션의 adminId가 있어야 성공. */
export function fetchAdminParkingSpaces(signal?: AbortSignal) {
  return request<ParkingSpaceDto[]>(BASE_URL, { signal });
}

/** 일반 사용자는 메모/민감 정보를 제외한 구획 목록 조회. */
export function fetchPublicParkingSpaces(signal?: AbortSignal) {
  return request<ParkingSpaceDto[]>(`${BASE_URL}/public`, { signal });
}

/**
 * 관리자 메모 변경. 변경 성공 후 서버가 DB의 최신 구획 1개를 다시 반환함.
 * 변경 ID는 프론트 임시 id가 아닌 실제 PARKING_SPACE_ID여야 함.
 * 서버에서는 adminId를 요청 본문에서 신뢰하지 않고 세션에서 가져옴.
 */
export function saveParkingMemo(parkingSpaceId: number, memo: string) {
  return request<ParkingSpaceDto>(`${BASE_URL}/${parkingSpaceId}/memo`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memo }),
  });
}

/** 관리자 구획 강제 변경: 인증 세션이 없으면 HTTP 401. */
export function saveParkingSpace(
  parkingSpaceId: number,
  input: { spaceStatusCode: string; spaceTypeCode: string; memo: string; changeReason: string }
) {
  return request<ParkingSpaceDto>(`${BASE_URL}/${parkingSpaceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
