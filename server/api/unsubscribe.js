import { applyCors } from '../lib/cors.js';
import { deleteSubscription } from '../lib/store.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { endpoint } = req.body ?? {};
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

  try {
    await deleteSubscription(endpoint);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('unsubscribe failed', err);
    return res.status(500).json({ error: 'Storage error' });
  }
}
