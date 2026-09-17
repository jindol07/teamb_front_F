# APCMS (AI Parking Control Management System)

AI 기반 주차관제 웹 서비스의 React 프론트엔드 **초기 템플릿**입니다.

> 이 프로젝트는 **완성된 서비스가 아니라**, 여러 명의 React 초급 개발자가
> 하나의 공통 템플릿을 기반으로 각자 담당 페이지를 이어서 개발할 수 있도록 만든
> **팀 협업용 초기 프로젝트 구조**입니다.

---

## 목차

1. [프로젝트 소개](#1-프로젝트-소개)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 실행 방법](#3-프로젝트-실행-방법)
4. [폴더 구조](#4-폴더-구조)
5. [각 폴더 역할](#5-각-폴더-역할)
6. [사용자 페이지 구조](#6-사용자-페이지-구조)
7. [관리자 페이지 구조](#7-관리자-페이지-구조)
8. [Routing 구조](#8-routing-구조)
9. [새로운 페이지 추가 방법](#9-새로운-페이지-추가-방법)
10. [새로운 관리자 메뉴 추가 방법](#10-새로운-관리자-메뉴-추가-방법)
11. [Mock Data 사용 방법](#11-mock-data-사용-방법)
12. [useAgent 사용 방법](#12-useagent-사용-방법)
13. [Git Branch 전략](#13-git-branch-전략)
14. [Commit Message 규칙](#14-commit-message-규칙)
15. [향후 Axios / Spring Boot 연동 방법](#15-향후-axios--spring-boot-연동-방법)

---

## 1. 프로젝트 소개

- **서비스명**: 주차관제 웹 서비스 (APCMS)
- **프로젝트 성격**: 국비지원 교육과정 파이널 프로젝트
- **개발자 수준**: 대부분 비전공자 / React 초급 개발자
- **현재 구현 범위**: 화면, Layout, Routing, Navigation, 기본 UI, Mock Data,
  반응형 기본 구조, Chart.js Dashboard, 로그인 화면, 페이지 이동까지만 구현합니다.
  실제 서버 통신 및 비즈니스 로직(인증, CRUD, 예약 처리 등)은 구현하지 않습니다.

가장 중요한 원칙은 **"초급 개발자가 쉽게 이해하고 이어서 개발할 수 있는 프로젝트"**를
만드는 것입니다. 복잡한 디자인 패턴이나 과도한 추상화는 사용하지 않습니다.

---

## 2. 기술 스택

| 구분 | 기술 |
| --- | --- |
| 언어 | TypeScript |
| 라이브러리 | React 18 |
| 빌드 도구 | Vite |
| 라우팅 | React Router (v6) |
| CSS 프레임워크 | Bootstrap 5 |
| 차트 | Chart.js + react-chartjs-2 |
| 코드 스타일 | ESLint + Prettier |
| 패키지 매니저 | **Yarn** |
| 향후 API 통신 | Axios (현재는 미사용) |

> ⚠️ 이 프로젝트는 **Yarn**을 기준으로 합니다. `npm install`, `npm start` 대신
> 반드시 `yarn install`, `yarn start`를 사용해주세요.

---

## 3. 프로젝트 실행 방법

```bash
# 1. 패키지 설치
yarn install

# 2. 개발 서버 실행
yarn start
# (yarn dev 도 동일하게 동작합니다)
```

실행 후 브라우저에서 아래 주소로 접속합니다.

```
http://localhost:3000
```

접속하면 자동으로 `/user/login` (사용자 로그인 화면)으로 이동합니다.

### 기타 명령어

```bash
yarn build     # 프로덕션 빌드
yarn preview   # 빌드 결과 미리보기
yarn lint      # ESLint 코드 검사
yarn format    # Prettier로 코드 포맷팅
```

---

## 4. 폴더 구조

```
APCMS/
├── public/
├── src/
│   ├── assets/                 # 이미지, 아이콘 등 정적 파일
│   ├── components/
│   │   └── common/             # 여러 페이지에서 재사용하는 공통 UI (Loading 등)
│   ├── hooks/
│   │   └── useAgent.ts         # PC / 모바일 판단 커스텀 훅
│   ├── layout/                 # 사용자 / 관리자 공통 레이아웃
│   │   ├── UserLayout.tsx
│   │   ├── UserHeader.tsx
│   │   ├── UserFooter.tsx
│   │   ├── AdminLayout.tsx
│   │   ├── AdminHeader.tsx
│   │   └── AdminSidebar.tsx
│   ├── pages/
│   │   ├── user/
│   │   │   ├── login/
│   │   │   ├── home/
│   │   │   ├── parking-status/
│   │   │   ├── notice/
│   │   │   └── reservation/
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   ├── dashboard/      # SummaryCards, ParkingPieChart, VehicleBarChart, RecentInfo
│   │   │   ├── notice/
│   │   │   ├── parking/
│   │   │   │   ├── manage/
│   │   │   │   └── status/
│   │   │   ├── vehicle/
│   │   │   └── history/
│   │   └── NotFound.tsx        # 404 페이지
│   ├── mock/                   # 화면에 사용하는 Mock Data
│   │   ├── dashboardMock.ts
│   │   ├── noticeMock.ts
│   │   ├── parkingMock.ts
│   │   ├── vehicleMock.ts
│   │   ├── historyMock.ts
│   │   └── userMock.ts
│   ├── router/
│   │   ├── AppRouter.tsx       # 전체 Router 진입점
│   │   ├── UserRouter.tsx      # 사용자 Route 모음
│   │   └── AdminRouter.tsx     # 관리자 Route 모음
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 5. 각 폴더 역할

| 폴더 | 역할 |
| --- | --- |
| `pages` | 실제 화면 단위. 팀원이 담당한 기능을 이 안에서 작업합니다. |
| `components/common` | Header, Footer, Sidebar, Button, Modal, Loading처럼 여러 페이지에서 재사용하는 공통 UI. 특정 페이지에서만 쓰는 작은 UI는 그냥 해당 페이지 폴더 안에 작성해도 됩니다. |
| `layout` | 사용자 / 관리자 전체 페이지를 감싸는 공통 레이아웃. |
| `hooks` | 재사용 가능한 Custom Hook (`useAgent` 등). |
| `mock` | 백엔드 API를 대신하는 테스트용 데이터. |
| `router` | React Router 관련 설정 전부. |

---

## 6. 사용자 페이지 구조

```
User Login (/user/login)
    ↓ 로그인 버튼 클릭
User Home (/user)
    ├── 주차현황 (/user/parking-status)
    ├── 공지사항 (/user/notice)
    └── 주차예약 (/user/reservation)
```

- 로그인 화면은 `UserLayout` 없이 단독 화면으로 구성됩니다.
- 나머지 화면은 모두 `UserLayout`(Header + Footer)을 공유합니다.
- PC / 모바일을 모두 고려하며, 반응형 레이아웃은 Bootstrap 5 Grid로 처리합니다.

---

## 7. 관리자 페이지 구조

```
Admin Login (/admin/login)
    ↓ 로그인 버튼 클릭
Admin Layout (Header + Sidebar)
    ├── 대시보드 (/admin/dashboard)
    ├── 공지사항 (/admin/notice)
    ├── 주차관제 (Dropdown)
    │     ├── 관리 (/admin/parking/manage)
    │     └── 현황 (/admin/parking/status)
    ├── 차량관리 (/admin/vehicle)
    └── 이력 (/admin/history)
```

- 관리자 로그인 화면은 `AdminLayout` 없이 단독 화면으로 구성됩니다.
- `주차관제` 메뉴는 Dropdown이며, `AdminSidebar.tsx`에서 `useRef`로
  바깥 클릭 감지를, `useState`로 열림/닫힘 상태를 관리합니다.
  (이유: 열림 상태는 화면을 다시 그려야 하므로 useState가 필요하고,
  바깥 클릭 감지에는 useRef로 DOM을 직접 참조하는 것이 더 안정적이기
  때문입니다. `AdminSidebar.tsx` 상단 주석에 자세히 설명되어 있습니다.)

---

## 8. Routing 구조

| Route | 설명 |
| --- | --- |
| `/user/login` | 사용자 로그인 |
| `/user` | 사용자 메인 |
| `/user/parking-status` | 사용자 주차현황 |
| `/user/notice` | 사용자 공지사항 |
| `/user/reservation` | 사용자 주차예약 |
| `/admin/login` | 관리자 로그인 |
| `/admin/dashboard` | 관리자 대시보드 |
| `/admin/notice` | 관리자 공지사항 |
| `/admin/parking/manage` | 관리자 주차관제 관리 |
| `/admin/parking/status` | 관리자 주차관제 현황 |
| `/admin/vehicle` | 관리자 차량관리 |
| `/admin/history` | 관리자 이력 |
| `/404`, 그 외 모든 경로 | 404 Not Found |

모든 Route는 `src/router/UserRouter.tsx`와 `src/router/AdminRouter.tsx`에서
정의되고, `src/router/AppRouter.tsx`에서 하나로 합쳐집니다.

---

## 9. 새로운 페이지 추가 방법

예시: **사용자 "이용내역" 페이지**를 새로 추가한다고 가정합니다.

**1단계. pages에 새 폴더와 파일 생성**

```
src/pages/user/history/UserHistory.tsx
```

```tsx
// src/pages/user/history/UserHistory.tsx
export default function UserHistory() {
  return (
    <div className="container py-4">
      <h2 className="page-title">이용내역</h2>
      <p className="page-description">나의 주차 이용내역을 확인합니다.</p>
      {/* 여기에 Mock Data와 UI를 작성합니다 */}
    </div>
  );
}
```

**2단계. Mock Data가 필요하다면 mock 폴더에 추가**

```ts
// src/mock/userHistoryMock.ts
export const userHistoryMock = [
  { id: 1, date: '2026-08-30', vehicleNumber: '12가 3456' },
];
```

**3단계. UserRouter.tsx에 Route 한 줄 추가**

```tsx
// src/router/UserRouter.tsx
import UserHistory from '../pages/user/history/UserHistory';

// ... <Route path="/user" element={<UserLayout />}> 내부에 추가
<Route path="history" element={<UserHistory />} />
```

**4단계. 필요하다면 UserHome.tsx 등에 이동 링크(메뉴) 추가**

```tsx
<Link to="/user/history">이용내역 보기</Link>
```

**5단계. 실행 및 확인**

```bash
yarn start
```

브라우저에서 `http://localhost:3000/user/history` 로 접속해 확인합니다.

---

## 10. 새로운 관리자 메뉴 추가 방법

예시: **"통계" 메뉴**를 관리자 Sidebar에 추가한다고 가정합니다.

**1단계. 페이지 생성**

```
src/pages/admin/statistics/Statistics.tsx
```

**2단계. AdminRouter.tsx에 Route 추가**

```tsx
// src/router/AdminRouter.tsx
import Statistics from '../pages/admin/statistics/Statistics';

// ... <Route path="/admin" element={<AdminLayout />}> 내부에 추가
<Route path="statistics" element={<Statistics />} />
```

**3단계. AdminSidebar.tsx에 메뉴 항목 추가**

```tsx
// src/layout/AdminSidebar.tsx
<li className="nav-item">
  <span
    className={menuItemClass(location.pathname === '/admin/statistics')}
    onClick={() => goTo('/admin/statistics')}
  >
    통계
  </span>
</li>
```

> `AdminSidebar.tsx`는 여러 팀원이 공유하는 공통 파일입니다.
> 수정 전에 팀원과 상의해주세요.

---

## 11. Mock Data 사용 방법

현재 백엔드가 없으므로 모든 화면은 `src/mock/` 폴더의 데이터를 사용합니다.

```ts
// 사용 예 (src/pages/user/parking-status/ParkingStatus.tsx)
import { parkingSummaryMock } from '../../../mock/parkingMock';

const { totalSpots, currentParked, availableSpots } = parkingSummaryMock;
```

추후 Spring Boot API가 준비되면 아래처럼 **데이터를 가져오는 부분만** 바꾸면 됩니다.
컴포넌트의 JSX(화면 부분)는 거의 그대로 유지할 수 있습니다.

```
지금:  Mock Data        → Component → UI
향후:  Spring Boot API  → Axios     → Component → UI
```

---

## 12. useAgent 사용 방법

`src/hooks/useAgent.ts`는 현재 접속 환경이 PC인지 모바일인지 판단하는 훅입니다.

```tsx
import useAgent from '../../hooks/useAgent';

function SomePage() {
  const { isMobile, isPC } = useAgent();

  return <div>{isMobile ? '모바일 화면' : 'PC 화면'}</div>;
}
```

> ⚠️ **주의**: `useAgent`는 "조건부 UI 분기"에만 사용합니다.
> 실제 레이아웃이 화면 크기에 따라 자연스럽게 바뀌는 반응형 처리는
> Bootstrap 5의 Grid 시스템(`row`, `col-*`)과 CSS Media Query로 구현합니다.

---

## 13. Git Branch 전략

```
main        # 배포 가능한 안정 버전
develop     # 팀 통합 개발 브랜치

feature/user-login
feature/user-home
feature/parking-status
feature/reservation

feature/admin-dashboard
feature/admin-notice
feature/admin-parking
feature/admin-vehicle
feature/admin-history
```

각 팀원은 담당 기능을 `feature/기능명` 브랜치에서 개발한 뒤,
개발이 끝나면 `develop`으로 Merge(Pull Request)합니다.

```
feature/user-reservation  →  develop
```

### 팀원의 기본 작업 순서

1. `develop` 최신 코드 pull
2. `feature/기능명` 브랜치 생성
3. 담당 페이지 확인 (`pages/...`)
4. 필요한 Component 작성
5. Mock Data 사용
6. Router 확인 (`router/UserRouter.tsx` 또는 `AdminRouter.tsx`)
7. 화면 구현
8. 로컬 테스트 (`yarn start`)
9. Commit
10. Pull Request
11. `develop` Merge

---

## 14. Commit Message 규칙

```
feat: 사용자 로그인 페이지 구현
feat: 관리자 대시보드 추가
feat: 주차관제 드롭다운 구현
feat: 사용자 주차예약 UI 추가

style: 관리자 대시보드 반응형 수정

fix: 관리자 라우팅 오류 수정

refactor: Header 컴포넌트 분리
```

| 접두어 | 의미 |
| --- | --- |
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `style` | 디자인/스타일 변경 (기능 변화 없음) |
| `refactor` | 코드 구조 개선 (기능 변화 없음) |

---

## 15. 향후 Axios / Spring Boot 연동 방법

현재는 Axios 실제 요청을 구현하지 않습니다. 추후 연동 시 아래 흐름을 따릅니다.

```
Spring Boot API
      ↓
   Axios (src/api/axios.ts 위치 예정)
      ↓
  API Response
      ↓
   Component
      ↓
      UI
```

**예상 진행 순서**

1. `src/api/axios.ts` 생성 후 공통 Axios 인스턴스 설정
   ```ts
   import axios from 'axios';

   export const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL,
   });
   ```
2. `.env` 파일에 `VITE_API_URL` 설정 (`.env.example` 참고, `.env`는 Git에 올리지 않습니다)
3. 각 페이지에서 `mock` 대신 `api.get('/parking/status')` 형태로 교체
4. 로딩 상태 표시가 필요하면 `components/common/Loading.tsx` 활용

---

## 참고: 공통 파일 협업 원칙

아래 파일은 여러 팀원이 함께 사용하는 공통 영역이므로, 수정 전 팀원과 상의해주세요.

- `App.tsx`
- `router/*`
- `layout/*`
- `index.css`
- `package.json`

각 팀원은 가능한 한 자신이 담당한 `pages/user/...` 또는 `pages/admin/...`
폴더 내부에서 작업하는 것을 원칙으로 합니다.

## 참고: TypeScript 설정 관련 안내

초기 요구 설정(`module`/`moduleResolution`: `node16`)은 Node.js 환경 기준
설정이라, Vite 기반 프론트엔드 프로젝트에서는 import 시 확장자를 강제하는 등
초급 개발자에게 혼란을 줄 수 있어 `moduleResolution: "bundler"`로 조정했습니다.
(TypeScript 특성상 `moduleResolution: "bundler"`를 쓰려면 `module`도 함께
`ESNext`로 맞춰야 해서 두 값을 같이 조정했습니다.) `target`은 문서 기준인
`es6`을 그대로 유지했습니다.

--0916
yarn add react-konva@18
yarn add konva react-konva bootstrap