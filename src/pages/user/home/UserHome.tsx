import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Notice as NoticeType } from '../../../mock/noticeMock';
import { getUserNoticeList } from '../../../api/userNoticeApi';
import {
  getUserNotificationRecipientId,
  getUserNotifications,
  getUserUnreadNotificationCount,
  markUserNotificationRead,
  type Notification,
} from '../../../api/notificationApi';
import {
  FaParking,
  FaRegCalendarCheck,
  FaBell,
  FaCheck,
  FaCog,
  FaTimes,
} from 'react-icons/fa';
import { TfiAnnouncement } from 'react-icons/tfi';
import { LuBot, LuHand } from 'react-icons/lu';
import style from './UserHome.module.css';

import parkingBanner from '../../../assets/스마트 지하주차장 출입구.png';

type AnimationStyle = 'shake' | 'bounce' | 'pulse' | 'none';

interface NotificationSettings {
  enabled: boolean;
  animationStyle: AnimationStyle;
  iconSize: number;
  unreadOnly: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  animationStyle: 'shake',
  iconSize: 26,
  unreadOnly: true,
};

const SETTINGS_KEY = 'userHomeNotificationSettings';

function AlpacaMascot() {
  return (
    <svg
      viewBox="0 0 120 135"
      width="84"
      height="94"
      role="img"
      aria-label="파란 A 모자를 쓴 하얀 아기 알파카"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="alpacaWhite" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0f4fa" />
        </linearGradient>
        <linearGradient id="alpacaBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      {/* 귀 */}
      <path
        d="M30 47 C18 37 17 20 23 17
           C31 14 39 29 41 40Z"
        fill="#fff"
        stroke="#e5e7eb"
        strokeWidth="1.5"
      />
      <path
        d="M90 47 C102 37 103 20 97 17
           C89 14 81 29 79 40Z"
        fill="#fff"
        stroke="#e5e7eb"
        strokeWidth="1.5"
      />
      <path d="M27 35 Q23 24 25 23 Q30 27 33 37Z" fill="#ffc7d2" />
      <path d="M93 35 Q97 24 95 23 Q90 27 87 37Z" fill="#ffc7d2" />

      {/* 몸통 */}
      <ellipse
        cx="60"
        cy="112"
        rx="29"
        ry="19"
        fill="url(#alpacaWhite)"
        stroke="#e7ebf2"
        strokeWidth="1.3"
      />
      <ellipse cx="43" cy="124" rx="10" ry="5" fill="#fff" />
      <ellipse cx="77" cy="124" rx="10" ry="5" fill="#fff" />

      {/* 복슬복슬한 얼굴 외곽 */}
      <path
        d="M32 47
           Q26 40 34 35
           Q32 25 43 27
           Q47 18 56 25
           Q65 17 72 26
           Q84 22 87 34
           Q97 37 91 48
           Q101 58 96 73
           Q94 91 80 99
           Q70 106 60 103
           Q48 106 38 98
           Q24 90 23 74
           Q20 58 32 47Z"
        fill="url(#alpacaWhite)"
        stroke="#e7ebf2"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 이마의 솜털 */}
      <path
        d="M34 39
           Q27 31 38 29
           Q39 20 48 27
           Q55 17 61 27
           Q71 19 76 29
           Q87 27 86 37
           Q79 43 72 39
           Q63 44 57 39
           Q47 44 41 39Z"
        fill="#fff"
      />
      <path d="M37 34 Q42 28 46 34" fill="none" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" />
      <path d="M57 31 Q62 25 66 32" fill="none" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 34 Q77 28 80 34" fill="none" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" />

      {/* 얼굴 */}
      <ellipse cx="60" cy="73" rx="27" ry="24" fill="#fff" />

      {/* 볼터치 */}
      <ellipse cx="39" cy="76" rx="8" ry="5" fill="#ffb8ca" opacity=".8" />
      <ellipse cx="81" cy="76" rx="8" ry="5" fill="#ffb8ca" opacity=".8" />

      {/* 커다란 눈 */}
      <ellipse cx="47" cy="64" rx="6.3" ry="8" fill="#302b35" />
      <ellipse cx="73" cy="64" rx="6.3" ry="8" fill="#302b35" />
      <ellipse cx="49" cy="61" rx="2.8" ry="3.3" fill="#fff" />
      <ellipse cx="75" cy="61" rx="2.8" ry="3.3" fill="#fff" />
      <circle cx="44.5" cy="67" r="1.4" fill="#c4b5fd" />
      <circle cx="70.5" cy="67" r="1.4" fill="#c4b5fd" />

      {/* 코와 미소 */}
      <ellipse cx="60" cy="76" rx="4" ry="3" fill="#73534e" />
      <path
        d="M60 79 Q57 84 52 81 M60 79 Q63 84 68 81"
        fill="none"
        stroke="#73534e"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      {/* 파란색 A 모자 */}
      <path
        d="M30 43 Q29 15 60 12 Q91 15 90 43Z"
        fill="url(#alpacaBlue)"
        stroke="#2563eb"
        strokeWidth="1.5"
      />
      <path
        d="M23 40 Q60 31 97 40
           Q94 49 60 49 Q26 49 23 40Z"
        fill="#2563eb"
      />
      <text
        x="60"
        y="35"
        textAnchor="middle"
        fontSize="20"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
        fill="#fff"
      >
        A
      </text>
      <path
        d="M43 20 Q49 16 56 17"
        fill="none"
        stroke="#bfdbfe"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* 작은 손 */}
      <ellipse cx="34" cy="105" rx="9" ry="8" fill="#fff" stroke="#e7ebf2" strokeWidth="1" />
      <ellipse cx="86" cy="105" rx="9" ry="8" fill="#fff" stroke="#e7ebf2" strokeWidth="1" />

      {/* 반짝이는 별 */}
      <path
        d="M13 60 L16 66 L22 69 L16 72 L13 78 L10 72 L4 69 L10 66Z"
        fill="#fbbf24"
      />
      <path
        d="M105 51 L107 56 L112 58 L107 60 L105 65 L103 60 L98 58 L103 56Z"
        fill="#93c5fd"
      />
      <circle cx="103" cy="80" r="2" fill="#f9a8d4" />
    </svg>
  );
}


export default function UserHome() {
  const [latestNotice, setLatestNotice] = useState<NoticeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationError, setNotificationError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [recipientId, setRecipientId] = useState<number | null | undefined>(undefined);
  const recipientType = 'USER';

  useEffect(() => {
    let active = true;
    void getUserNotificationRecipientId().then((id) => {
      if (active) setRecipientId(id);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('알림 설정 저장 실패:', err);
    }
  }, [settings]);

  // 공지사항 조회
  useEffect(() => {
    const fetchLatestNotice = async () => {
      try {
        const data = await getUserNoticeList();

        const sortedNotices = [...data].sort((a, b) => {
          if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
            return a.isPinned ? -1 : 1;
          }

          if (Boolean(a.isImportant) !== Boolean(b.isImportant)) {
            return a.isImportant ? -1 : 1;
          }

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  // 알림 목록 및 읽지 않은 개수 조회
  useEffect(() => {
    let active = true;

    if (recipientId === undefined) {
      return () => {
        active = false;
      };
    }

    if (recipientId === null) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationError(true);
      console.error('알림 조회 실패: 로그인 토큰에서 사용자 ID를 확인할 수 없습니다.');
      return () => {
        active = false;
      };
    }

    const fetchNotifications = async () => {
      try {
        const params = { recipienttypecode: recipientType, recipientid: recipientId };
        const [list, count] = await Promise.all([
          getUserNotifications(params),
          getUserUnreadNotificationCount(params),
        ]);

        if (!active) return;

        setNotifications(list);
        setUnreadCount(count);
        setNotificationError(false);
      } catch (err) {
        if (!active) return;
        console.error('알림 조회 실패:', err);
        setNotificationError(true);
      }
    };

    void fetchNotifications();

    const timer = window.setInterval(() => {
      void fetchNotifications();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [recipientId, recipientType]);

  // 알림 읽음 처리
  const handleReadNotification = async (notification: Notification) => {
    try {
      if (recipientId === null || recipientId === undefined) {
        throw new Error('로그인 사용자 ID를 확인할 수 없습니다.');
      }

      const params = { recipienttypecode: recipientType, recipientid: recipientId };
      if (!notification.isread) {
        await markUserNotificationRead(notification.notificationid, params);
      }

      const [list, count] = await Promise.all([
        getUserNotifications(params),
        getUserUnreadNotificationCount(params),
      ]);

      setNotifications(list);
      setUnreadCount(count);
      setNotificationError(false);
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
      setNotificationError(true);
    }
  };

  const shouldAnimate =
    settings.enabled &&
    settings.animationStyle !== 'none' &&
    (!settings.unreadOnly || unreadCount > 0);

  const animationClass = shouldAnimate
    ? {
        shake: style.notificationShake,
        bounce: style.notificationBounce,
        pulse: style.notificationPulse,
        none: '',
      }[settings.animationStyle]
    : '';

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`container py-4 ${style.userHome}`}>
      <div className={style.homeHeader}>
        <h2 className="page-title mb-0">
          환영합니다 - 배포T <LuHand color="gold" />
        </h2>

        {/* 알림 버튼 */}
        <div className={style.notificationArea}>
          <div className={style.notificationWrapper}>
            <button
              type="button"
              aria-label="알림 목록 열기"
              aria-expanded={notificationOpen}
              onClick={() => {
                setNotificationOpen((prev) => !prev);
                setSettingsOpen(false);
              }}
              className={`${style.notificationButton} ${animationClass}`}
            >
              <FaBell size={settings.iconSize} />

              {unreadCount > 0 && (
                <span className={style.notificationBadge}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className={style.notificationPanel}>
                <div className={style.notificationHeader}>
                  <div>
                    <strong>알림</strong>
                    <p>새로운 소식을 확인해 보세요.</p>
                  </div>

                  <div className={style.notificationHeaderActions}>
                    <button
                      type="button"
                      aria-label="알림 설정"
                      title="알림 설정"
                      onClick={() => setSettingsOpen((prev) => !prev)}
                      className={style.notificationIconButton}
                    >
                      <FaCog />
                    </button>

                    <button
                      type="button"
                      aria-label="알림 닫기"
                      onClick={() => {
                        setNotificationOpen(false);
                        setSettingsOpen(false);
                      }}
                      className={style.notificationIconButton}
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                {settingsOpen && (
                  <div className={style.notificationSettings}>
                    <div className={style.settingsTitle}>알림 커스텀 설정</div>

                    <label className={style.settingsRow}>
                      <span>알림 애니메이션 사용</span>
                      <input
                        type="checkbox"
                        checked={settings.enabled}
                        onChange={(e) => updateSetting('enabled', e.target.checked)}
                      />
                    </label>

                    <label className={style.settingsField}>
                      <span>움직임 스타일</span>
                      <select
                        value={settings.animationStyle}
                        onChange={(e) =>
                          updateSetting(
                            'animationStyle',
                            e.target.value as AnimationStyle,
                          )
                        }
                      >
                        <option value="shake">좌우로 흔들기</option>
                        <option value="bounce">통통 튀기</option>
                        <option value="pulse">맥박 효과</option>
                        <option value="none">움직임 없음</option>
                      </select>
                    </label>

                    <label className={style.settingsField}>
                      <span>종 아이콘 크기: {settings.iconSize}px</span>
                      <input
                        type="range"
                        min="18"
                        max="36"
                        value={settings.iconSize}
                        onChange={(e) =>
                          updateSetting('iconSize', Number(e.target.value))
                        }
                      />
                    </label>

                    <label className={style.settingsRow}>
                      <span>읽지 않은 알림이 있을 때만 움직이기</span>
                      <input
                        type="checkbox"
                        checked={settings.unreadOnly}
                        onChange={(e) => updateSetting('unreadOnly', e.target.checked)}
                      />
                    </label>

                    <button
                      type="button"
                      className={style.resetSettingsButton}
                      onClick={() => setSettings(DEFAULT_SETTINGS)}
                    >
                      기본 설정으로 초기화
                    </button>
                  </div>
                )}

                <div className={style.notificationCount}>
                  읽지 않음 <strong>{unreadCount}</strong>개
                </div>

                {notificationError && (
                  <p className={style.notificationError}>
                    알림을 불러오지 못했습니다. 서버 연결을 확인해 주세요.
                  </p>
                )}

                {!notificationError && notifications.length === 0 && (
                  <div className={style.notificationEmpty}>
                    <FaBell size={25} />
                    <p>새로운 알림이 없습니다.</p>
                  </div>
                )}

                {!notificationError &&
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.notificationid}
                      onClick={() => void handleReadNotification(notification)}
                      className={`${style.notificationItem} ${
                        notification.isread ? '' : style.notificationUnread
                      }`}
                    >
                      <div className={style.notificationItemTop}>
                        <strong>
                          {notification.notificationtypecode === 'VEHICLE_APPROVED'
                            ? '차량 등록 승인'
                            : notification.notificationtypecode === 'VEHICLE_REJECTED'
                              ? '차량 등록 반려'
                              : notification.notificationtypecode === 'VEHICLE_REQUEST'
                                ? '차량 등록 신청'
                                : '알림'}
                        </strong>

                        {notification.isread ? (
                          <FaCheck color="#94a3b8" size={12} aria-label="읽음" />
                        ) : (
                          <span className={style.unreadDot} />
                        )}
                      </div>

                      <p>{notification.message}</p>

                      <span className={style.notificationDate}>
                        {new Date(notification.createdat).toLocaleString('ko-KR')}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="page-description">이용하실 서비스를 선택해주세요.</p>

      {/* 서비스 메뉴 */}
      <div className={style.menuSection}>
        <div className="col-12 col-sm-6 col-lg-3">
          <Link to="/user/parking-status" className="user-menu-card d-block p-4 h-100">
            <h5 className="fw-bold mb-2">
              <FaParking color="blue" /> 주차현황
            </h5>
            <p className="mb-0 text-secondary small">
              현재 주차장 이용 현황을 확인할 수 있습니다.
            </p>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <Link to="/user/notice" className="user-menu-card d-block p-4 h-100">
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
          <Link to="/user/reservation" className="user-menu-card d-block p-4 h-100">
            <h5 className="fw-bold mb-2">
              <FaRegCalendarCheck color="skyblue" /> 예약확인
            </h5>
            <p className="mb-0 text-secondary small">
              예약된 주차 내역을 확인할 수 있습니다.
            </p>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <Link to="/user/chatbot" className="user-menu-card d-block p-4 h-100">
            <h5 className="fw-bold mb-2">
              <LuBot color="gray" /> 1:1 문의
            </h5>
            <p className="mb-0 text-secondary small">
              AI 주차 도우미 알파킹에게 문의할 수 있습니다.
            </p>
          </Link>
        </div>
      </div>

      {/* 지하 주차장 메인 배너 */}
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
