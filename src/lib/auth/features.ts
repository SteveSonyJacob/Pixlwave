type PhoneAuthEnvironment = Readonly<Record<string, string | undefined>>;

export function isPhoneAuthEnabled(source: PhoneAuthEnvironment = process.env) {
  const provider = source.AUTH_SMS_PROVIDER?.trim().toLowerCase();
  return Boolean(provider && !["change-me", "deferred", "disabled", "none"].includes(provider));
}

export function isGoogleAuthEnabled(source: PhoneAuthEnvironment = process.env) {
  return source.AUTH_OAUTH_PROVIDERS
    ?.split(",")
    .map((provider) => provider.trim().toLowerCase())
    .includes("google") ?? false;
}
