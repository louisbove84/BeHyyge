export type RateWindow = {
  windowStart: number;
  count: number;
};

export function nextRateCount(
  current: RateWindow | null,
  now: number,
  windowMs: number,
  limit: number,
) {
  if (!current || now - current.windowStart >= windowMs) {
    return { windowStart: now, count: 1, allowed: true };
  }
  if (current.count >= limit) {
    return { windowStart: current.windowStart, count: current.count, allowed: false };
  }
  return { windowStart: current.windowStart, count: current.count + 1, allowed: true };
}
