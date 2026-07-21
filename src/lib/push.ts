// Клиентская часть web push. Всё здесь обязано быть необязательным:
// приложение работает офлайн и без сервера, push — это надстройка,
// любая её поломка не должна ломать основной сценарий.

export type Cadence = 'off' | 'weekly' | 'monthly';

const API_URL = process.env.NEXT_PUBLIC_PUSH_API_URL ?? '';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export const CADENCE_STORAGE_KEY = 'mydreams_push_cadence';

export function isConfigured(): boolean {
  return Boolean(API_URL && VAPID_PUBLIC_KEY);
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * На iOS push работает только для приложения, добавленного на домашний экран.
 * Во вкладке Safari API формально есть, но подписка не создастся — поэтому
 * это надо показать пользователю до того, как он нажмёт кнопку.
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function needsHomeScreenInstall(): boolean {
  return isIOS() && !isStandalone();
}

export function getPermission(): NotificationPermission | null {
  if (!isPushSupported()) return null;
  return Notification.permission;
}

// VAPID-ключ приходит в base64url, а applicationServerKey ждёт Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return (await reg?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

export class PushError extends Error {
  constructor(public code: 'unsupported' | 'not-configured' | 'denied' | 'install-required' | 'failed') {
    super(code);
  }
}

export async function enablePush(cadence: Exclude<Cadence, 'off'>): Promise<void> {
  if (!isPushSupported()) throw new PushError('unsupported');
  if (!isConfigured()) throw new PushError('not-configured');
  if (needsHomeScreenInstall()) throw new PushError('install-required');

  // requestPermission обязан вызываться из пользовательского жеста, иначе
  // iOS молча откажет
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new PushError('denied');

  const reg = await registerServiceWorker();
  if (!reg) throw new PushError('failed');
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const res = await fetch(`${API_URL}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      cadence,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  if (!res.ok) throw new PushError('failed');

  localStorage.setItem(CADENCE_STORAGE_KEY, cadence);
}

export async function disablePush(): Promise<void> {
  localStorage.setItem(CADENCE_STORAGE_KEY, 'off');
  const sub = await getExistingSubscription();
  if (!sub) return;

  // Сначала снимаем с сервера, потом отписываемся локально: если порядок
  // обратный, сервер продолжит слать на мёртвый эндпоинт
  try {
    await fetch(`${API_URL}/api/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch {
    // сервер недоступен — всё равно отписываемся локально
  }
  try {
    await sub.unsubscribe();
  } catch {
    // already gone
  }
}

export function getStoredCadence(): Cadence {
  if (typeof localStorage === 'undefined') return 'off';
  const v = localStorage.getItem(CADENCE_STORAGE_KEY);
  return v === 'weekly' || v === 'monthly' ? v : 'off';
}

/** Локальное уведомление — для проверки, что канал вообще работает. */
export async function sendTestNotification(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw new PushError('failed');
  await reg.showNotification('MyDreams', {
    body: 'Проверка уведомлений — всё работает',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'mydreams-test',
  });
}
