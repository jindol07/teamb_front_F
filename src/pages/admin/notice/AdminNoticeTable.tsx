import { Link } from 'react-router-dom';
import type { Notice } from '../../../mock/noticeMock';
import { getCategoryBadge } from './noticeUtils';

interface AdminNoticeTableProps {
  notices: Notice[];
}

export default function AdminNoticeTable({ notices }: AdminNoticeTableProps) {
  return (
    <div className="card p-3">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>번호</th>
              <th>공지 유형</th>
              <th>제목</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>조회수</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((notice, index) => (
              <tr key={notice.id}>
                {/* 번호 */}
                <td>{notices.length - index}</td>
                {/* 공지 유형 */}
                <td>
                  <span className={`badge ${getCategoryBadge(notice.category)}`}>
                    {notice.category}
                  </span>
                </td>
                {/* 제목 */}
                <td>
                  <Link
                    to={`/admin/notice/${notice.id}`}
                    className="text-decoration-none text-dark"
                  >
                    <div className="d-flex align-items-center">
                      {/* 중요 / 고정 표시 영역: 항상 동일한 너비 */}
                      <div
                        className="d-flex align-items-center gap-1 flex-shrink-0"
                        style={{ width: '110px' }}
                      >
                        {notice.isImportant && (
                          <span className="text-danger fw-bold small">[중요]</span>
                        )}
                        {notice.isPinned && <span className="badge bg-dark">고정</span>}
                      </div>
                      {/* 첨부파일 아이콘 / 제목 영역 */}
                      {/* 첨부파일 아이콘 / 제목 영역 */}
                      <div className="d-flex align-items-center gap-2">
                        {/* 첨부파일 유무와 관계없이 동일한 너비 확보 */}
                        <span
                          className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: '20px' }}
                          title={
                            (notice.attachmentCount ?? notice.attachments.length) > 0
                              ? '첨부파일 있음'
                              : undefined
                          }
                        >
                          {(notice.attachmentCount ?? notice.attachments.length) > 0
                            ? '📎'
                            : null}
                        </span>
                        <span>{notice.title}</span>
                      </div>
                    </div>
                  </Link>
                </td>
                {/* 작성자 */}
                <td>{notice.writer}</td>
                {/* 작성일 */}
                <td>{notice.createdAt}</td>
                {/* 조회수 */}
                <td>{notice.views}</td>
              </tr>
            ))}
            {/* 검색 결과가 없는 경우 */}
            {notices.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
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
