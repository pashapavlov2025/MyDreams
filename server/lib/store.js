import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';

const redis = Redis.fromEnv();

const SET_KEY = 'mydreams:subs';
const subKey = (id) => `mydreams:sub:${id}`;

// Эндпоинт длинный и содержит токен — в качестве ключа берём его хеш
export function subscriptionId(endpoint) {
  return createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
}

export async function saveSubscription({ subscription, cadence, tz }) {
  const id = subscriptionId(subscription.endpoint);
  const existing = await redis.get(subKey(id));

  await redis.set(subKey(id), {
    subscription,
    cadence,
    tz: tz || 'UTC',
    // при смене расписания не сбрасываем историю отправок
    lastSentAt: existing?.lastSentAt ?? null,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });
  await redis.sadd(SET_KEY, id);
  return id;
}

/** Сколько подписок уже лежит, не считая переподписку этого же устройства. */
export async function countSubscriptions(excludeEndpoint) {
  const ids = await redis.smembers(SET_KEY);
  if (!ids) return 0;
  const skip = excludeEndpoint ? subscriptionId(excludeEndpoint) : null;
  return ids.filter((id) => id !== skip).length;
}

export async function deleteSubscription(endpoint) {
  const id = subscriptionId(endpoint);
  await redis.del(subKey(id));
  await redis.srem(SET_KEY, id);
}

export async function deleteById(id) {
  await redis.del(subKey(id));
  await redis.srem(SET_KEY, id);
}

export async function listSubscriptions() {
  const ids = await redis.smembers(SET_KEY);
  if (!ids || ids.length === 0) return [];

  const records = await Promise.all(ids.map((id) => redis.get(subKey(id))));
  return ids
    .map((id, i) => (records[i] ? { id, ...records[i] } : null))
    .filter(Boolean);
}

export async function markSent(id, record) {
  await redis.set(subKey(id), { ...record, lastSentAt: new Date().toISOString() });
}
