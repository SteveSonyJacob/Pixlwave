export type ProviderPlace = {
  provider: "mappls" | "google";
  providerPlaceId: string;
  displayName: string;
};

export type FirstPartyLocation = {
  latitude: number;
  longitude: number;
  locality: string;
  district: string;
  stateCode: string;
  countryCode: "IN";
  sourceProvider: ProviderPlace["provider"];
  sourcePlaceId: string;
};

export interface MapsAdapter {
  search(query: string): Promise<ProviderPlace[]>;
  resolve(place: ProviderPlace): Promise<FirstPartyLocation>;
}

export interface PaymentCollectionAdapter {
  createCartOrder(input: { cartId: string; amountPaise: number; currency: "INR" }): Promise<{ providerOrderId: string }>;
  verifyCapturedEvent(rawBody: Uint8Array, signature: string): Promise<{ providerPaymentId: string; capturedAt: string }>;
  // Refund execution is deliberately absent: Pixlwave records only admin-completed manual refunds.
}

export interface MessageAdapter {
  send(input: { to: string; template: string; variables: Record<string, string> }): Promise<{ providerMessageId: string }>;
}

export interface ObjectStorageAdapter {
  createUpload(input: { ownerId: string; purpose: "creative" | "evidence"; contentType: string }): Promise<{ signedUrl: string }>;
  createDownload(input: { objectKey: string; viewerId: string; expiresInSeconds: number }): Promise<{ signedUrl: string }>;
}
