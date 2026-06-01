# 개발 기록 (DEVLOG)

"우리집 보드" 웹앱을 Claude Code와 함께 만들고 배포한 과정을 시간순으로 정리한 문서입니다.
사용자(남편)의 요청과 그에 따라 진행한 작업·결정을 기록합니다.

---

## 1. 프로젝트 셋업

**요청:** `~/Downloads/index.html` 파일로 프로젝트 폴더를 만들어 가져오기

- `woorijip-board/` 폴더 생성, `index.html` 복사
- 파일 정체 확인: "우리집 보드" — 부부용 집안일/요청 보드 (단일 HTML, 인라인 CSS/JS, Supabase 백엔드)

**요청:** `git init`
- git 저장소 초기화 (`main` 브랜치)
- git 계정 확인: `Brad <sangkyoum@cigro.io>` (global 설정)

**요청:** 첫 커밋
- `b2e0c23` — 우리집 보드 웹앱 추가 (386줄)

---

## 2. GitHub & Vercel 배포

**요청:** Vercel 저장소 연결 — "너가 할 수 있나?"
- 방식 선택: **GitHub → Vercel 연동** (push 시 자동 재배포)

**요청:** push 하자 (새 저장소 public 으로)
- `gh repo create skkim02/woorijip-board --public` → push
- 저장소: https://github.com/skkim02/woorijip-board
- Vercel은 대시보드에서 import (정적 사이트라 별도 설정 불필요)

**질문:** 재배포는 push만 하면 되지? → **네.** GitHub 연동 시 `main` push마다 자동 배포.

**질문:** `vercel.json` 만들어야 해? → **아니요.** 루트에 index.html만 있는 정적 사이트는 자동 감지됨.

---

## 3. 홈 화면 앱 아이콘 (PWA)

**요청:** 홈 화면에 추가용 아이콘 디자인
- 디자인 컴셉 선택: **체크리스트 보드** (테라코타 배경 + 흰색 체크리스트)
- `icon.svg` 디자인 → `librsvg`(brew 설치)로 PNG 변환
  - `apple-touch-icon.png`(180), `icon-192/512.png`, `favicon-16/32.png`
- `manifest.webmanifest` 생성 (standalone, 테마색 `#E07856`)
- `index.html <head>`에 아이콘/매니페스트 태그 추가
- 커밋 `9bff1cc`

---

## 4. 알림 기능 — 1단계: 앱이 열려있을 때

**요청:** 요청이 들어오면 알림 + 팝업
- 범위 선택: **앱이 열려있을 때만** (서버 작업 없이 클라이언트만)
- 기존 Supabase 실시간 구독에 "새 요청(INSERT) 감지 → 알림" 연결
  - 화면 팝업(토스트) + "딩" 소리(WebAudio) + 시스템 알림(권한 시)
  - 내가 올린 건 제외, 상대가 올렸을 때만
- 커밋 `9dc1334`

---

## 5. 알림 기능 — 2단계: 본격 푸시 (앱 닫혀도 알림)

**요청:** 본격 푸시로 확장
- 구조: 서비스워커 + Web Push + Supabase Edge Function + DB Webhook
- 제작물:
  - `sw.js` — 서비스워커 (push 수신 → 알림, 앱이 떠 있으면 생략)
  - `index.html` — "🔔 푸시 알림 켜기" 버튼, 구독 → `push_subscriptions` 저장
  - `supabase/schema.sql` — 구독 테이블 + RLS
  - `supabase/functions/notify-request/index.ts` — 푸시 발송 함수
  - `PUSH_SETUP.md` — 백엔드 설정 가이드
  - `.gitignore` — 비밀값 보호
- VAPID 키 생성 (공개키는 코드에, 비공개키는 Supabase 시크릿으로만)
- 커밋 `0957b2c`

### 배포 작업 (CLI)
- `supabase login` (사용자 직접) → 프로젝트 `family-board`(ref: lxhcefdyalvbvxaanczh) 링크
- Edge Function 배포 (로그인 토큰으로 정상)
- 시크릿 등록: CLI 버그로 로그인 토큰 거부 → **Personal Access Token** 발급해 우회
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` 등록
- 사용자: SQL Editor에서 `schema.sql` 실행 + Database Webhook 연결

### 테스트
- REST로 요청 삽입 → Webhook → 함수 → 애플 푸시까지 실제 폰 수신 확인 ✅

---

## 6. 버그 수정: 기기별 '나' 저장

**제보:** "남편" 선택 후 앱을 다시 켜면 "와이프"로 초기화됨
- 원인: `currentUser`가 매번 기본값으로 시작, 선택을 저장 안 함
- 수정: `localStorage`에 선택 저장 + 시작 시 복원, 구독 정보도 복원된 '나'에 맞춤
- 커밋 `ecf1d56` (Persist selected member)

---

## 7. 알림 확장: 맡음/완료

**요청:** 완료/맡음 때도 알림
- 클라이언트: `완료` 시 처리자 기록, 실시간 핸들러가 상태 변경(맡음/완료) 감지 → 상대에게 알림
- Edge Function: UPDATE 이벤트 처리 — "맡았어요/완료했어요" 푸시 (동작한 사람 제외), 단순 수정은 무시
- 사용자: Webhook에 UPDATE 이벤트 추가
- 함수 재배포
- 커밋 `69b6dfc` (Notify on claim/complete)

**질문:** 재배포하면 홈 화면에 다시 추가해야 해? → **아니요.** 아이콘은 URL 바로가기라 자동으로 최신 버전 로드. (아이콘 그림 자체를 바꿀 때만 재추가 필요)

**질문:** 알림 기능에 Webhook이 꼭 필요해? → **앱이 닫혀있을 때는 필요.** 폰이 스스로 변화를 못 알기 때문에 서버(함수)가 대신 푸시를 보내야 하고, Webhook이 "데이터 변경 → 함수 호출"을 잇는 다리 역할.

---

## 8. 최종 검증

**요청:** 기획대로 정상 동작하는지 테스트
- 함수 분기 로직 5케이스 (새요청/맡음/완료/단순수정/빈데이터) — 전부 기대대로
- 실제 DB 동작으로 상태 전이 + Webhook + 실제 발송 검증
- 폰 수신 확인: 새요청/맡음/완료 3개 도착, 단순 수정은 무음 ✅

**결과:** 기획대로 완벽 동작. 와이프 폰까지 등록하면 양방향 완성.

---

## 최종 아키텍처

```
[와이프/남편 폰] ──요청──> [Supabase requests 테이블]
                                  │ (INSERT/UPDATE)
                                  ▼
                          [Database Webhook]
                                  │
                                  ▼
                   [Edge Function: notify-request]
                          │ (요청자/처리자 제외한 상대 구독 조회)
                          ▼
                  [Web Push → 애플/구글 푸시 서버]
                          ▼
                  [상대 폰 알림] (앱 닫혀있어도)

* 앱이 열려있을 때는 실시간 구독(websocket)이 직접 감지 → 앱 내 팝업
```

## 주요 파일
- `index.html` — 앱 본체 (UI + 클라이언트 로직 + 푸시 구독)
- `sw.js` — 서비스워커 (백그라운드 푸시 수신)
- `manifest.webmanifest`, `icon.svg`, `icons/` — PWA/아이콘
- `supabase/schema.sql` — 구독 테이블
- `supabase/functions/notify-request/index.ts` — 푸시 발송 함수
- `PUSH_SETUP.md` — 백엔드 설정 가이드
