/**
 * Loading
 * ------------------------------------------------------------------
 * 데이터를 불러오는 동안 보여줄 공통 로딩 컴포넌트입니다.
 * 지금은 Mock Data만 사용하므로 실제로 오래 보일 일은 없지만,
 * 추후 Axios로 실제 API를 호출하게 되면 로딩 상태 표시에 사용합니다.
 *
 * 사용 예:
 * ```tsx
 * {isLoading ? <Loading /> : <내용 />}
 * ```
 */
export default function Loading() {
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">불러오는 중...</span>
      </div>
    </div>
  );
}
