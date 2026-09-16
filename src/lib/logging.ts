const secretKey = /(authorization|cookie|password|secret|token|otp|service.?role|api.?key)/i;

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, secretKey.test(key) ? "[REDACTED]" : redact(nested)])
    );
  }
  return value;
}

export function log(level: "debug" | "info" | "warn" | "error", event: string, context: Record<string, unknown> = {}) {
  const entry = redact({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context
  });
  const output = JSON.stringify(entry);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}
