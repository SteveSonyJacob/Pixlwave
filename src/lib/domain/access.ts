export const accountModes = ["advertiser", "owner"] as const;
export type AccountMode = (typeof accountModes)[number];
export type PrincipalKind = AccountMode | "admin";

export const capabilities = [
  "profile:read",
  "profile:update",
  "marketplace:browse",
  "cart:manage",
  "campaign:read-own",
  "listing:manage-own",
  "fulfillment:read-confirmed-own",
  "fulfillment:evidence-submit-own",
  "admin:access",
  "booking-request:read-all",
  "booking-request:decide",
  "published-rate:change",
  "platform-admin:grant"
] as const;

export type Capability = (typeof capabilities)[number];

export const permissionMatrix: Record<PrincipalKind, readonly Capability[]> = {
  advertiser: ["profile:read", "profile:update", "marketplace:browse", "cart:manage", "campaign:read-own"],
  owner: [
    "profile:read",
    "profile:update",
    "marketplace:browse",
    "listing:manage-own",
    "fulfillment:read-confirmed-own",
    "fulfillment:evidence-submit-own"
  ],
  admin: capabilities
};

export function can(principal: PrincipalKind, capability: Capability) {
  return permissionMatrix[principal].includes(capability);
}
