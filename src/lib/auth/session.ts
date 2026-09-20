export function isSessionIdleExpired(lastActivityMs: number | null, nowMs: number, idleMinutes: number) {
  if (lastActivityMs === null || !Number.isFinite(lastActivityMs)) return false;
  return nowMs - lastActivityMs >= idleMinutes * 60_000;
}
