type PhoneAuthEnvironment = Readonly<Record<string, string | undefined>>;

export function isPhoneAuthEnabled(source: PhoneAuthEnvironment = process.env) {
  const provider = source.AUTH_SMS_PROVIDER?.trim().toLowerCase();
  return Boolean(provider && !["change-me", "deferred", "disabled", "none"].includes(provider));
}
