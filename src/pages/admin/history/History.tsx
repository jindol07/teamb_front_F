import { useState } from 'react';
import { historyListMock } from '../../../mock/historyMock';

/**
 * 관리자 이력 페이지 (/admin/history)
 * 처리 이력을 Table로 보여주며, 기본적인 형태의 검색 UI만 제공합니다.
 * 실제 검색 API는 구현하지 않습니다.
 */
export default function History() {
  const [keyword, setKeyword] = useState('');

  const filteredList = historyListMock.filter((item) =>
    item.vehicleNumber.includes(keyword),
  );

  const statusBadgeClass = (status: string) => {
    if (status === '완료') return 'bg-success';
    if (status === '처리중') return 'bg-warning text-dark';
    return 'bg-danger';
  };

  return (
    <div>
      <h2 className="page-title">이력</h2>
      <p className="page-description">주차관제 시스템 처리 이력을 확인합니다.</p>

      <div className="d-flex mb-3" style={{ maxWidth: 320 }}>
        <input
          type="text"
          className="form-control"
          placeholder="차량번호로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className="card p-3">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>일시</th>
              <th>차량번호</th>
              <th>작업</th>
              <th>관리자</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((item) => (
              <tr key={item.id}>
                <td>{item.datetime}</td>
                <td>{item.vehicleNumber}</td>
                <td>{item.action}</td>
                <td>{item.admin}</td>
                <td>
                  <span className={`badge ${statusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-secondary py-3">
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
