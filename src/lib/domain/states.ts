export const paymentStates = ["unpaid", "processing", "succeeded", "failed"] as const;
export const reviewStates = ["paid_awaiting_admin", "accepted", "rejected", "cancelled"] as const;
export const capacityStates = ["unreserved", "approved_reserved", "released"] as const;
export const fulfillmentStates = [
  "scheduled",
  "in_service_window",
  "owner_reported_complete",
  "admin_verified",
  "partially_delivered",
  "non_delivery_under_review"
] as const;
export const refundStates = ["pending_admin", "in_progress", "refunded", "failed"] as const;
export const settlementStates = [
  "ineligible",
  "eligible_for_admin_review",
  "verified",
  "transfer_in_progress",
  "settled",
  "failed"
] as const;

export interface PaidLineSnapshot {
  id: string;
  cartId: string;
  listingId: string;
  ownerId: string;
  creativeVersionId: string;
  rateRevisionId: string;
  currency: "INR";
  amountPaise: number;
  unitAllocations: ReadonlyArray<{ unitId: string; startsAt: string; amountPaise: number }>;
  serviceTerms: Readonly<Record<string, string | number | boolean>>;
}

export interface BookingStateContract {
  payment: (typeof paymentStates)[number];
  review: (typeof reviewStates)[number] | null;
  capacity: (typeof capacityStates)[number];
  fulfillment: (typeof fulfillmentStates)[number] | null;
  refund: (typeof refundStates)[number] | null;
  settlement: (typeof settlementStates)[number];
}
