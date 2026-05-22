function hashString(value) {
  let hash = 2166136261;
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function makeCacheKey(namespace, ...parts) {
  return `${namespace}:${hashString(parts.join("\u0001"))}`;
}

export async function readCachedJSON(cache, key) {
  if (!cache?.get) return null;

  const text = await cache.get(key);
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function writeCachedJSON(cache, key, value, ttlSeconds = 6 * 60 * 60) {
  if (!cache?.put) return value;

  await cache.put(key, JSON.stringify(value), {
    expirationTtl: ttlSeconds,
  });
  return value;
}
