# 본격 푸시 알림 설정 (앱을 닫아도 알림)

앱이 닫혀 있어도 새 요청 알림이 오게 하려면, 클라이언트 코드 외에 **Supabase 백엔드 설정**이 필요합니다.
아래 5단계를 한 번만 해두면 됩니다. (코드는 이미 다 준비돼 있어요.)

> ⚠️ **VAPID 비공개 키는 절대 깃에 올리지 마세요.** 채팅으로 따로 전달받은 값을 Supabase 비밀값(secret)으로만 넣습니다.

프로젝트 참조(ref): `lxhcefdyalvbvxaanczh`

---

## 1. 구독 저장 테이블 만들기

Supabase 대시보드 → **SQL Editor** → `supabase/schema.sql` 내용을 붙여넣고 **Run**.

## 2. Supabase CLI 설치 & 로그인

```bash
brew install supabase/tap/supabase
supabase login                       # 브라우저로 로그인 (본인이 직접)
supabase link --project-ref lxhcefdyalvbvxaanczh
```

## 3. 비밀값(secret) 등록

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="BOXhnrggGfxOEj9tlmVfSUzertlcxQ3swW-HOqKAW-qh8aWvwCRR4kaHRV0mcc3KOpeZk7gklDaSQxik5hn_C9g" \
  VAPID_PRIVATE_KEY="<채팅으로 받은 비공개 키>" \
  VAPID_SUBJECT="mailto:본인이메일@example.com"
```

`SUPABASE_URL` 과 `SUPABASE_SERVICE_ROLE_KEY` 는 Edge Function 에 자동으로 들어가므로 따로 설정할 필요 없습니다.

## 4. Edge Function 배포

```bash
supabase functions deploy notify-request --no-verify-jwt
```

`--no-verify-jwt` 는 DB Webhook 이 JWT 없이 호출할 수 있게 해줍니다.
배포 후 함수 URL: `https://lxhcefdyalvbvxaanczh.supabase.co/functions/v1/notify-request`

## 5. Database Webhook 연결 (새 요청 → 함수 호출)

Supabase 대시보드 → **Database → Webhooks → Create a new hook**

- **Table**: `requests`
- **Events**: `INSERT` 만 체크
- **Type**: `HTTP Request` → `POST`
- **URL**: `https://lxhcefdyalvbvxaanczh.supabase.co/functions/v1/notify-request`
- **HTTP Headers**: `Content-Type: application/json` (기본)

저장하면 끝.

---

## 사용 방법

1. 두 사람 모두 폰 Safari/Chrome 에서 앱을 **홈 화면에 추가**한 뒤, 추가된 앱으로 엽니다.
   (특히 **iPhone 은 홈 화면에 추가한 PWA 에서만** 푸시가 됩니다. iOS 16.4 이상)
2. 상단에서 본인(와이프/남편)을 선택합니다.
3. **🔔 푸시 알림 켜기** 버튼을 누르고 권한을 허용합니다. (버튼이 "켜짐"으로 바뀌면 성공)
4. 이제 상대가 요청을 올리면, 앱을 닫아둬도 알림이 옵니다.

## 점검 / 문제 해결

- 버튼이 안 보이면: 그 브라우저가 푸시 미지원. iPhone 은 꼭 "홈 화면에 추가"한 앱에서 여세요.
- 알림이 안 오면 순서대로 확인:
  1. `push_subscriptions` 표에 두 사람의 구독 행이 있는지 (member 가 각각 '와이프'/'남편')
  2. Edge Function 로그 (`supabase functions logs notify-request`) 에 호출이 찍히는지
  3. Webhook 이 INSERT 에 연결돼 있는지

## (선택) 보안 강화

함수에 비밀 헤더 검증을 켜려면:
```bash
supabase secrets set WEBHOOK_SECRET="아무_긴_랜덤문자열"
```
그리고 5단계 Webhook 의 HTTP Headers 에 `x-webhook-secret: 아무_긴_랜덤문자열` 을 추가하세요.
