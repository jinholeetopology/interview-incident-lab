export interface RequestContext {
  requestId?: string;
}

export interface FxRate {
  base: string;
  quote: string;
  rate: number;
  fetchedAt: string;
}

export interface PaymentsClient {
  getFxRate(base: string, quote: string, ctx?: RequestContext): Promise<FxRate>;
  checkReady(): Promise<void>;
}
