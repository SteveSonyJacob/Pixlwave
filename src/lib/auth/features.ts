export function isPhoneAuthEnabled(source: NodeJS.ProcessEnv = process.env) {
  const provider = source.AUTH_SMS_PROVIDER?.trim().toLowerCase();
  return Boolean(provider && !["change-me", "deferred", "disabled", "none"].includes(provider));
}
