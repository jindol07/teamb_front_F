// 주차 입·출차 내역
// - 입차시간 기준 최신순 정렬
// - 한 페이지에 10건씩 페이지 처리
import { useState } from 'react';
interface ParkingHistory {
    id: number;
    carNumber: string;
    entranceTime: string;
    exitTime: string | null;
}
/**
 * 테스트용 주차 이용 내역
 * 추후 Spring Boot API에서 받아오는 데이터로 변경
 */
const mockData: ParkingHistory[] = [
    {
        id: 1,
        carNumber: '12가3456',
        entranceTime: '2026-09-20T08:30:00',
        exitTime: '2026-09-20T09:40:00',
    },
    {
        id: 2,
        carNumber: '12가3456',
        entranceTime: '2026-09-22T10:20:00',
        exitTime: '2026-09-22T13:10:00',
    },
    {
        id: 3,
        carNumber: '12가3456',
        entranceTime: '2026-09-21T09:10:00',
        exitTime: null,
    },
];
export default function ParkingHistory() {
    /**
     * 현재 페이지 번호
     * 처음에는 1페이지
     */
    const [page, setPage] = useState(1);
    /*
     * 한 페이지에 표시할 데이터 개수
     */
    const pageSize = 10;
    /**
     * 입차시간 기준 최신순 정렬
     *
     * [...mockData]
     * 원본 mockData를 복사
     *
     * sort()
     * → 복사한 배열을 정렬
     *
     * b - a
     * → 최신 날짜가 먼저 오도록 내림차순 정렬
     */
    const sortedData = [...mockData].sort(
        (a, b) =>
            new Date(b.entranceTime).getTime() -
            new Date(a.entranceTime).getTime()
    );
    /**
     * 현재 페이지에서 시작할 데이터 위치
     *
     * 1페이지 → 0
     * 2페이지 → 10
     * 3페이지 → 20
     */
    const startIndex =
        (page - 1) * pageSize;
    /**
     * 최신순으로 정렬된 데이터에서
     * 현재 페이지에 필요한 10건만 가져옴
     */
    const pageData =
        sortedData.slice(
            startIndex,
            startIndex + pageSize
        );
    /**
     * 전체 페이지 수 계산
     *
     * 예:
     * 25건 / 10건 = 2.5
     * Math.ceil(2.5) = 3페이지
     */
    const totalPages =
        Math.ceil(sortedData.length / pageSize);
    return (
        <div className="card p-4">
            <h4 className="mb-4">
                주차 이용 내역
            </h4>
            <table className="table">
                <thead>
                    <tr>
                        <th>차량번호</th>
                        <th>입차시간</th>
                        <th>출차시간</th>
                    </tr>
                </thead>
                <tbody>
                    {pageData.map((history) => (
                        <tr key={history.id}>
                            {/* 차량번호 */}
                            <td>
                                {history.carNumber}
                            </td>
                            {/* 입차시간 */}
                            <td>
                                {history.entranceTime}
                            </td>
                            {/* 출차시간 */}
                            <td>
                                {/*추차하지않을 시 주차중 표시 */}
                                {history.exitTime ?? '주차중'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* ==========================
                페이지 버튼
               ========================== */}
            <div className="d-flex gap-2 justify-content-center">
                {Array.from(
                    { length: totalPages },
                    (_, index) => (
                        <button
                            key={index + 1}
                            className={`btn ${page === index + 1
                                ? 'btn-primary'
                                : 'btn-outline-primary'
                                }`}
                            onClick={() =>
                                setPage(index + 1)
                            }
                        >
                            {index + 1}
                        </button>
                    )
                )}
            </div>
        </div>
    );
}