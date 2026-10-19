import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Notice as NoticeType } from '../../../mock/noticeMock';
import { getUserNoticeList } from '../../../api/userNoticeApi';
import { FaParking, FaRegCalendarCheck } from 'react-icons/fa';
import { TfiAnnouncement } from 'react-icons/tfi';
import { LuBot, LuHand } from 'react-icons/lu';
import style from './UserHome.module.css';

// 지하 주차장 메인 배너 이미지
import parkingBanner from '../../../assets/스마트 지하주차장 출입구.png';

/**
 * 사용자 메인 페이지 (/user)
 * 주차현황 / 공지사항 / 주차예약 등의 기능 메뉴로 이동
 */
export default function UserHome() {
  const [latestNotice, setLatestNotice] =
    useState<NoticeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLatestNotice = async () => {
      try {
        const data = await getUserNoticeList();

        const sortedNotices = [...data].sort((a, b) => {
          // 1순위: 고정 공지
          if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
            return a.isPinned ? -1 : 1;
          }

          // 2순위: 중요 공지
          if (Boolean(a.isImportant) !== Boolean(b.isImportant)) {
            return a.isImportant ? -1 : 1;
          }

          // 3순위: 최신 등록일
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
        });

        setLatestNotice(sortedNotices[0] ?? null);
      } catch (err) {
        console.error('메인 공지사항 조회 실패:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchLatestNotice();
  }, []);

  return (
    <div className={`container py-4 ${style.userHome}`}>
      <h2 className="page-title">
        환영합니다 <LuHand color="gold" />
      </h2>

      <p className="page-description">
        이용하실 서비스를 선택해주세요.
      </p>

      {/* 서비스 메뉴: 사진 위에 배치 */}
      <div className={style.menuSection}>
        <div className="col-12 col-sm-6 col-lg-3">
          <Link
            to="/user/parking-status"
            className="user-menu-card d-block p-4 h-100"
          >
            <h5 className="fw-bold mb-2">
              <FaParking color="blue" /> 주차현황
            </h5>
            <p className="mb-0 text-secondary small">
              현재 주차장 이용 현황을 확인할 수 있습니다.
            </p>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <Link
            to="/user/notice"
            className="user-menu-card d-block p-4 h-100"
          >
            <h5 className="fw-bold mb-2">
              <TfiAnnouncement color="orangered" /> 공지사항
            </h5>
            <p className="mb-0 text-secondary small">
              {loading
                ? '공지사항을 불러오는 중입니다.'
                : error
                  ? '공지사항을 불러오지 못했습니다.'
                  : latestNotice
                    ? `최근 공지사항: ${latestNotice.title}`
                    : '등록된 공지사항이 없습니다.'}
            </p>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <Link
            to="/user/reservation"
            className="user-menu-card d-block p-4 h-100"
          >
            <h5 className="fw-bold mb-2">
              <FaRegCalendarCheck color="skyblue" /> 예약확인
            </h5>
            <p className="mb-0 text-secondary small">
              예약된 주차 내역을 확인할 수 있습니다.
            </p>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <Link
            to="/user/chatbot"
            className="user-menu-card d-block p-4 h-100"
          >
            <h5 className="fw-bold mb-2">
              <LuBot color="gray" /> 1:1 문의
            </h5>
            <p className="mb-0 text-secondary small">
              AI 주차 도우미 알파킹에게 문의할 수 있습니다.
            </p>
          </Link>
        </div>
      </div>

      {/* 지하 주차장 메인 배너: 크기를 줄여 메뉴 아래에 표시 */}
      <div className={style.parkingBanner}>
        <img
          src={parkingBanner}
          alt="AI Alpha Parking 지하 주차장 관제 시스템"
          className={style.parkingBannerImage}
        />
      </div>
    </div>
  );
}