/* 우리집 보드 - 서비스워커
   앱이 닫혀 있어도 푸시를 받아 알림을 띄운다. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// 서버(Edge Function)가 보낸 푸시 수신
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}

  event.waitUntil((async () => {
    // 앱이 이미 화면에 떠 있으면 페이지의 팝업(토스트)이 처리하므로 시스템 알림은 생략
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const focused = clients.some((c) => c.visibilityState === 'visible' && c.focused);
    if (focused) return;

    await self.registration.showNotification(data.title || '우리집 보드', {
      body: data.body || '새 요청이 있어요',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      tag: data.tag || 'request',
      data: { url: data.url || './' }
    });
  })());
});

// 알림을 누르면 앱을 열거나 이미 열린 창으로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) { c.focus(); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
