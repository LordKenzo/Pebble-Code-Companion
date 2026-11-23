export type ProviderErrorKind = "auth" | "rate" | "network" | "refusal" | "config" | "other";

export class ProviderError extends Error {
  constructor(message: string, readonly kind: ProviderErrorKind) {
    super(message);
  }
}
