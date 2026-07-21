import { applyCors } from '../lib/cors.js';
import { saveSubscription } from '../lib/store.js';

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
  // Эндпоинт должен принадлежать известному push-сервису, иначе это мусор
  if (!/^https:\/\//.test(subscription.endpoint)) {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  try {
    const id = await saveSubscription({ subscription, cadence, tz });
    return res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error('subscribe failed', err);
    return res.status(500).json({ error: 'Storage error' });
  }
}
