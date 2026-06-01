<div align="center">
  <img src="icons/icon-192.png" width="96" alt="우리집 보드 아이콘">
  <h1>우리집 보드</h1>
  <p>버튼으로 부탁하고, 버튼으로 끝내요 — 함께 사는 사람들을 위한 집안일·요청 보드</p>
</div>

---

## 소개

**우리집 보드**는 함께 사는 사람들(부부·가족·룸메이트)이 집안일이나 사다 줄 것을 가볍게 부탁하고
처리 상황을 공유하는 모바일 웹앱입니다. **그룹 코드**로 모이기만 하면 누구나 쓸 수 있어요.

- 👨‍👩‍👧 **그룹 만들기 / 코드로 참여** — 로그인 없이 6자리 코드로 함께 쓰기
- 🥛 자주 쓰는 요청(우유·빵·계란·휴지·쓰레기)은 버튼 한 번으로 올리기
- 🔄 요청 → **내가 할게**(맡음) → **완료** 의 간단한 흐름
- ⏰ 기한 설정, 기한순/요청순 정렬
- 📲 멤버가 요청·맡음·완료하면 **푸시 알림** (앱을 닫아둬도 옴)
- 📡 모든 멤버 화면이 **실시간 동기화** (새로고침 불필요)
- 📥 **웹에서 바로 설치(PWA)** — 앱스토어 없이 홈 화면에 추가

단일 HTML 파일 프런트엔드 + Supabase 백엔드로 동작하며, Vercel로 배포되어 있습니다.
범용 서비스로의 확장 계획은 [`ROADMAP.md`](./ROADMAP.md) 를 참고하세요.

## 기술 구성

| 영역 | 사용 기술 |
|---|---|
| 프런트엔드 | 단일 `index.html` (인라인 CSS/JS, 프레임워크 없음) |
| 데이터/실시간 | Supabase (Postgres + Realtime) |
| 백그라운드 푸시 | Service Worker + Web Push (VAPID) + Supabase Edge Function + DB Webhook |
| 홈 화면 앱 | PWA (manifest + apple-touch-icon) |
| 배포 | Vercel (GitHub `main` push 시 자동 재배포) |

## 사용법

### 1. 홈 화면에 추가 (각자 폰에서 한 번)

- **iPhone (Safari)**: 사이트 열기 → 공유 → **홈 화면에 추가**
  > iPhone은 홈 화면에 추가한 앱에서만 푸시가 됩니다 (iOS 16.4+).
- **Android (Chrome)**: 메뉴 → **앱 설치 / 홈 화면에 추가**

### 2. 처음 설정

1. 추가된 앱을 엽니다.
2. **그룹 만들기**(이름 입력 → 코드 발급) 또는 받은 **코드로 참여** 합니다.
3. 상단에서 **본인** 을 선택합니다. → 이 기기에 기억됩니다.
4. **＋ 초대** 버튼으로 코드/링크를 공유해 함께 쓸 사람을 부릅니다.
5. **🔔 푸시 알림 켜기** 버튼을 누르고 권한을 허용합니다. (버튼이 "켜짐"으로 바뀌면 성공)

### 3. 매일 쓰기

| 하고 싶은 것 | 방법 |
|---|---|
| 부탁하기 | 자주 쓰는 요청 버튼 누르기, 또는 **직접 입력** |
| 내가 처리하겠다 | 요청 카드의 **내가 할게** |
| 다 했다 | **✓ 완료** |
| 이름/기한 바꾸기 | 카드의 **✎** |
| 지우기 | 카드의 **×** |

상대가 요청을 올리거나 맡거나 완료하면 알림이 옵니다. (내 동작·단순 수정은 알림 없음)

## 개발 / 배포

```bash
# 로컬에서 보기 (정적 파일)
open index.html        # 또는 python3 -m http.server 후 localhost 접속

# 배포: main 에 push 하면 Vercel 이 자동 재배포
git add -A && git commit -m "..." && git push origin main
```

백그라운드 푸시(Edge Function·Webhook·시크릿)를 새 환경에 다시 세팅하려면
[`PUSH_SETUP.md`](./PUSH_SETUP.md) 를 참고하세요.

## 문서

- [`ROADMAP.md`](./ROADMAP.md) — 범용 서비스 전환 단계별 계획
- [`PUSH_SETUP.md`](./PUSH_SETUP.md) — 푸시 백엔드 설정 가이드
- [`DEVLOG.md`](./DEVLOG.md) — 개발 과정 기록 (요청·작업·결정·아키텍처)

## 파일 구조

```
woorijip-board/
├─ index.html                         # 앱 본체 (UI + 로직 + 그룹/푸시)
├─ sw.js                              # 서비스워커 (백그라운드 푸시 수신)
├─ manifest.webmanifest               # PWA 매니페스트
├─ icon.svg, icons/                   # 앱 아이콘
├─ supabase/
│  ├─ schema.sql                      # push_subscriptions 테이블
│  ├─ migration-groups.sql            # 그룹(범용 서비스) 마이그레이션 ← 1회 실행
│  └─ functions/notify-request/       # 푸시 발송 Edge Function (그룹 범위)
├─ ROADMAP.md                         # 범용 서비스 로드맵
├─ PUSH_SETUP.md                      # 백엔드 설정 가이드
└─ DEVLOG.md                          # 개발 기록
```
