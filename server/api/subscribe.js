import { applyCors } from '../lib/cors.js';
import { saveSubscription, countSubscriptions } from '../lib/store.js';

// CORS проверяется браузером и не мешает обычному curl, а эндпоинт публичный.
// Поэтому режем мусор по домену: подписка обязана указывать на настоящий
// push-сервис. Худшее, что сможет сделать чужой, — подписать своё устройство
// и получать напоминания обновить балансы.
const PUSH_HOSTS = [
  /\.push\.apple\.com$/,
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /\.push\.services\.mozilla\.com$/,
  /\.notify\.windows\.com$/,
];

// Личное приложение: пары устройств хватает с большим запасом
const MAX_SUBSCRIPTIONS = 20;

function isValidPushEndpoint(endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && PUSH_HOSTS.some((re) => re.test(url.hostname));
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { subscription, cadence, tz } = req.body ?? {};

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  if (cadence !== 'weekly' && cadence !== 'monthly') {
    return res.status(400).json({ error: 'Invalid cadence' });
  }
  if (!isValidPushEndpoint(subscription.endpoint)) {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  try {
    // Повторная подписка того же устройства перезаписывает запись, поэтому
    // лимит проверяем только для новых
    if ((await countSubscriptions(subscription.endpoint)) >= MAX_SUBSCRIPTIONS) {
      return res.status(429).json({ error: 'Too many subscriptions' });
    }
    const id = await saveSubscription({ subscription, cadence, tz });
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error('subscribe failed', err);
    return res.status(500).json({ error: 'Storage error' });
  }
}
