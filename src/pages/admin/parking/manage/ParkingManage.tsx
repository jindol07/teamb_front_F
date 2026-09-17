import { parkingSlotListMock } from '../../../../mock/parkingMock';

/**
 * 관리자 주차관제 관리 페이지 (/admin/parking/manage)
 * 주차면별 상태, 차량번호, 입/출차 시간을 관리하는 기본 화면입니다.
 */
export default function ParkingManage() {
  const statusBadgeClass = (status: string) => {
    if (status === '사용중') return 'bg-primary';
    if (status === '예약') return 'bg-warning text-dark';
    return 'bg-success';
  };

  return (
    <div>
      <h2 className="page-title">주차관제 관리</h2>
      <p className="page-description">주차면 목록을 확인하고 상태를 관리합니다.</p>

      <div className="card p-3">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>주차면 번호</th>
              <th>주차면 상태</th>
              <th>차량번호</th>
              <th>입차시간</th>
              <th>출차예정</th>
              <th>이용상태</th>
            </tr>
          </thead>
          <tbody>
            {parkingSlotListMock.map((slot) => (
              <tr key={slot.id}>
                <td>{slot.slotNumber}</td>
                <td>
                  <span className={`badge ${statusBadgeClass(slot.status)}`}>
                    {slot.status}
                  </span>
                </td>
                <td>{slot.vehicleNumber ?? '-'}</td>
                <td>{slot.entryTime ?? '-'}</td>
                <td>{slot.expectedExit ?? '-'}</td>
                <td>{slot.status === '사용가능' ? '대기' : '이용중'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
