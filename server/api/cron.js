import webpush from 'web-push';
import { listSubscriptions, markSent, deleteById } from '../lib/store.js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:noreply@mydreams.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Крон на Hobby ходит раз в сутки, поэтому «нужный день» считаем
// в часовом поясе самого пользователя, а не сервера.
function localParts(tz) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { weekday: parts.weekday, day: Number(parts.day) };
}

function isDue({ cadence, tz, lastSentAt }) {
  let parts;
  try {
    parts = localParts(tz || 'UTC');
  } catch {
    parts = localParts('UTC');
  }

  const daysSinceSent = lastSentAt
    ? (Date.now() - new Date(lastSentAt).getTime()) / 86400000
    : Infinity;

  if (cadence === 'weekly') {
    // защита от повторной отправки, если крон дёрнули дважды
    return parts.weekday === 'Mon' && daysSinceSent >= 6;
  }
  if (cadence === 'monthly') {
    return parts.day === 1 && daysSinceSent >= 25;
  }
  return false;
}

const PAYLOAD = JSON.stringify({
  title: 'MyDreams',
  body: 'Пора обновить балансы — это займёт пять минут',
  url: '/update',
  tag: 'mydreams-reminder',
});

export default async function handler(req, res) {
  // Vercel подставляет этот заголовок, если задан CRON_SECRET
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }

  const subs = await listSubscriptions();
  const result = { checked: subs.length, sent: 0, skipped: 0, expired: 0, failed: 0 };

  for (const record of subs) {
    if (!isDue(record)) {
      result.skipped++;
      continue;
    }
    try {
      await webpush.sendNotification(record.subscription, PAYLOAD);
      await markSent(record.id, record);
      result.sent++;
    } catch (err) {
      // 404/410 — подписка мертва (приложение удалили с домашнего экрана
      // или переустановили). Держать её дальше смысла нет.
      if (err.statusCode === 404 || err.statusCode === 410) {
        await deleteById(record.id);
        result.expired++;
      } else {
        console.error('push failed', err.statusCode, err.body);
        result.failed++;
      }
    }
  }

  return res.status(200).json(result);
}
