// 우리집 보드 - 푸시 발송 Edge Function
// requests 테이블 변경 시 Database Webhook 이 이 함수를 호출한다.
//   - INSERT(새 요청)    → 요청자가 아닌 상대에게 "새 요청" 알림
//   - UPDATE(맡음/완료)  → 동작한 사람이 아닌 상대에게 "맡았어요/완료했어요" 알림
// (item/기한 수정 등 상태가 안 바뀐 UPDATE 는 알림 없음)

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

// 특정 사람(actor)이 아닌 상대의 모든 구독으로 푸시를 보낸다.
async function sendToOthers(actor: string, title: string, body: string, tag: string) {
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .neq('member', actor);
  if (error) { console.error('select error', error); return; }

  const payload = JSON.stringify({ title, body, tag, url: './' });
  await Promise.all((subs ?? []).map(async (s: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      } else {
        console.error('push error', err?.statusCode, err?.body);
      }
    }
  }));
}

Deno.serve(async (req) => {
  if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 });
  }

  let body: any = {};
  try { body = await req.json(); } catch (_) {}
  const { type, record, old_record } = body;
  if (!record || !record.item) return new Response('no record', { status: 200 });

  if (type === 'INSERT') {
    const requester = record.requester ?? '누군가';
    await sendToOthers(
      requester,
      `${requester}님의 새 요청`,
      `${record.item} — 보드에 올라왔어요`,
      'request-' + record.id
    );
  } else if (type === 'UPDATE') {
    // 상태가 실제로 바뀐 경우만 (수정 등은 무시)
    if (old_record && old_record.status === record.status) {
      return new Response('no status change', { status: 200 });
    }
    const actor = record.assignee ?? '누군가';
    if (record.status === '내가 맡음') {
      await sendToOthers(actor, `${actor}님이 맡았어요`, record.item, 'status-' + record.id);
    } else if (record.status === '완료') {
      await sendToOthers(actor, `${actor}님이 완료했어요`, record.item, 'status-' + record.id);
    }
  }

  return new Response('ok', { status: 200 });
});
