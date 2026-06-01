// 우리집 보드 - 새 요청 푸시 발송 Edge Function
// requests 테이블에 새 행이 INSERT 되면 Database Webhook 이 이 함수를 호출한다.
// 요청자(requester)가 아닌 상대방의 모든 구독으로 Web Push 를 보낸다.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com';
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? '';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  // (선택) 웹훅에 비밀 헤더를 걸었다면 검증
  if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 });
  }

  let body: any = {};
  try { body = await req.json(); } catch (_) {}
  const record = body.record;
  if (!record || !record.item) {
    return new Response('no record', { status: 200 });
  }

  const requester: string = record.requester ?? '';

  // 받는 사람 = 요청자가 아닌 모든 구독 (= 상대방)
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .neq('member', requester);

  if (error) {
    console.error('select error', error);
    return new Response('db error', { status: 500 });
  }

  const payload = JSON.stringify({
    title: `${requester || '누군가'}님의 새 요청`,
    body: `${record.item} — 보드에 올라왔어요`,
    tag: 'request-' + record.id,
    url: './'
  });

  await Promise.all((subs ?? []).map(async (s: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
    } catch (err: any) {
      // 만료/삭제된 구독(404/410)은 정리
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      } else {
        console.error('push error', err?.statusCode, err?.body);
      }
    }
  }));

  return new Response('ok', { status: 200 });
});
