import { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Coins,
  Sparkles,
  Wallet,
} from 'lucide-react';
import defaultMascot from '../../../assets/기본 마일리지.png';
import earnedMascot from '../../../assets/마일리지 적립.png';
import style from './MileageHistory.module.css';
import usedMascot from '../../../assets/마일리지-사용완료.png';
import MileageDetail from './MileageDetail';

type MileageStatus = 'default' | 'earned' | 'used';
type MileageDetailType = 'earned' | 'used';

type StatusContent = {
  title: string;
  description: string;
  badge: string;
  image: string;
  buttonText: string;
  action: () => void;
};

export default function MileageHistory() {
  const [status, setStatus] = useState<MileageStatus>('default');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [detailType, setDetailType] = useState<'earned' | 'used' | null>(null);

  const openHistory = (type: MileageDetailType) => {
    setDetailType(type);
  };

  const statusContentMap: Record<MileageStatus, StatusContent> = {
    default: {
      title: 'AI Alpha Parking Mileage',
      description: '주차할 때마다 혜택을 차곡차곡 모아 보세요.',
      badge: '기본 마일리지',
      image: defaultMascot,
      buttonText: '적립 내역 보기',
      action: () => openHistory('earned'),
    },
    earned: {
      title: '마일리지 적립 완료!',
      description: '주차 이용 리워드가 마일리지에 반영되었어요.',
      badge: '적립 완료',
      image: earnedMascot,
      buttonText: '적립 내역 확인',
      action: () => openHistory('earned'),
    },
    used: {
      title: '마일리지 사용 완료!',
      description: '보유 마일리지를 사용했어요. 다음 주차에도 알파킹을 이용해 주세요.',
      badge: '사용 완료',
      image: usedMascot,
      buttonText: '사용 내역 확인',
      action: () => openHistory('used'),
    },
  };

  const statusContent = statusContentMap[status];
  if (detailType !== null) {
    return (
      <div className={style.mileageHistory}>
        <button
          type="button"
          className="outline-button"
          onClick={() => setDetailType(null)}
        >← 마일리지로 돌아가기</button>
        <MileageDetail initialType={detailType} />
      </div>
    );
  }
  return (
    <div className={style.mileageHistory}>
      <section className="page-content" id="mileage">
        <div className={style.mileageHistory}>
          <section className="page-content" id="mileage">
            {/* 기존 마일리지 메인 화면 */}
          </section>

          {isGuideOpen && (
            <div className="mileage-guide-overlay" onClick={() => setIsGuideOpen(false)}>
              <section
                className="mileage-guide-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mileage-guide-title"
                onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="mileage-guide-close"
                  aria-label="닫기"
                  onClick={() => setIsGuideOpen(false)}
                >×</button>
                <span className="mileage-guide-label">AI ALPHA PARKING REWARDS</span>
                <h2 id="mileage-guide-title">마일리지 이용 안내</h2>
                <p className="mileage-guide-description">
                  알파킹 이용으로 쌓은 마일리지의 적립 및 사용 내역을 확인해 보세요.</p>
                <div className="mileage-guide-item">
                  <strong>01. 마일리지 적립</strong>
                  <p>주차 이용 후 적립된 마일리지를 마일리지 화면에서 확인할 수 있어요.</p>
                </div>
                <div className="mileage-guide-item">
                  <strong>02. 마일리지 사용</strong>
                  <p>사용 가능한 마일리지는 서비스에서 지원하는 결제 조건에 따라 사용할 수 있어요.</p>
                </div>
                <div className="mileage-guide-item">
                  <strong>03. 이용 내역 확인</strong>
                  <p>적립 내역과 사용 내역을 구분해 마일리지 변동 내역을 확인할 수 있어요.</p>
                </div>
                <p className="mileage-guide-notice">
                  ※ 구체적인 적립 기준 및 사용 조건은 서비스 정책에 따라 적용됩니다.</p>
                <button
                  type="button"
                  className="mileage-guide-confirm"
                  onClick={() => setIsGuideOpen(false)}
                >확인</button>
              </section>
            </div>
          )}
        </div>
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> MY REWARDS
            </div>
            <h1>마일리지</h1>
            <p>알파킹과 함께 쌓은 리워드를 한눈에 확인하세요.</p>
          </div>
          <button
            type="button"
            className="outline-button"
            onClick={() => setIsGuideOpen(true)}
          >
            <CircleHelp size={17} /> 마일리지 이용 안내
          </button>
        </div>

        <div className="hero-grid">
          <section className="balance-card">
            <div className="balance-topline">
              <span className="balance-icon">
                <Wallet size={18} />
              </span>
              <span>MY MILEAGE</span>
              <span className="live-dot" />
            </div>
            <p className="balance-label">사용 가능한 마일리지</p>
            <div className="balance-amount">
              12,500<span>P</span>
            </div>
            <div className="balance-note">
              <Sparkles size={15} /> 주차 요금 결제 시 현금처럼 사용하세요.
            </div>
            <div className="balance-bottom">
              <div>
                <span>이번 달 적립</span>
                <strong className="positive">+3,200 P</strong>
              </div>
              <div className="balance-separator" />
              <div>
                <span>이번 달 사용</span>
                <strong className="negative">−2,000 P</strong>
              </div>
            </div>
            <div className="balance-watermark">
              <Coins size={130} />
            </div>
          </section>

          <section className={`mascot-card state-${status}`}>
            <div className="mascot-copy">
              <span className="status-chip">
                <span /> {statusContent.badge}
              </span>
              <h2>{statusContent.title}</h2>
              <p>{statusContent.description}</p>
              <button
                type="button"
                className="primary-button"
                onClick={statusContent.action}
              >
                {statusContent.buttonText}
                <ChevronRight size={17} />
              </button>
            </div>
            <img
              className="mascot-image"
              src={statusContent.image}
              alt={
                status === 'earned'
                  ? '마일리지 적립을 축하하는 알파킹 캐릭터'
                  : status === 'used'
                    ? '마일리지 사용 완료 상태의 알파킹 캐릭터'
                    : 'AI Alpha Parking 알파카와 주차 차량 캐릭터'
              }
            />
            {status === 'used' && (
              <div className="used-completion-badge">
                <CheckCircle2 size={16} />
                <span>사용 완료</span>
              </div>
            )}
            <div className="mascot-glow" />
          </section>
        </div>

        <section className="state-preview-section">
          <div className="section-title-row">
            <div>
              <h2>마일리지 상태 미리보기</h2>
              <p>각 상태를 선택해 프런트엔드 표시를 확인하세요.</p>
            </div>
            <span className="demo-label">UI DEMO</span>
          </div>
          <div className="state-preview-grid">
            <button
              type="button"
              className={`state-preview ${status === 'default' ? 'selected' : ''}`}
              onClick={() => setStatus('default')}
            >
              <div className="preview-image-wrap">
                <img src={defaultMascot} alt="기본 마일리지 이미지" />
              </div>
              <span className="preview-title">기본 마일리지</span>
              <span className="preview-subtitle">AI Alpha Parking</span>
            </button>
            <button
              type="button"
              className={`state-preview ${status === 'earned' ? 'selected' : ''}`}
              onClick={() => setStatus('earned')}
            >
              <div className="preview-image-wrap earned">
                <img src={earnedMascot} alt="마일리지 적립 완료 이미지" />
              </div>
              <span className="preview-title">적립 완료</span>
              <span className="preview-subtitle">마일리지 적립!</span>
            </button>
            <button
              type="button"
              className={`state-preview ${status === 'used' ? 'selected' : ''}`}
              onClick={() => setStatus('used')}
            >
              <div className="preview-image-wrap used">
                <img src={usedMascot} alt="마일리지 사용 완료 이미지" />
              </div>
              <span className="preview-title">사용 완료</span>
              <span className="preview-subtitle">마일리지 사용 완료!</span>
            </button>
          </div>
        </section>
      </section>
    </div>
  );
}
