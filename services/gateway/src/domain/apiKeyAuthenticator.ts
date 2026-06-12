import { sha256Hex } from '../utils/hash.js';
import type { ApiKeyRepository } from '../repositories/apiKeyRepository.js';

export type ApiKeyAuthFailure = 'missing' | 'unknown';

export interface ApiKeyAuthSuccess {
  ok: true;
  apiKey: string;
  keyHash: string;
}

export interface ApiKeyAuthDenied {
  ok: false;
  reason: ApiKeyAuthFailure;
}

export type ApiKeyAuthResult = ApiKeyAuthSuccess | ApiKeyAuthDenied;

export class ApiKeyAuthenticator {
  constructor(private readonly repository: ApiKeyRepository) {}

  async authenticate(rawApiKey: string | undefined): Promise<ApiKeyAuthResult> {
    const apiKey = rawApiKey?.trim();
    if (!apiKey) {
      return { ok: false, reason: 'missing' };
    }

    const known = await this.repository.has(apiKey);
    if (!known) {
      return { ok: false, reason: 'unknown' };
    }

    return {
      ok: true,
      apiKey,
      keyHash: sha256Hex(apiKey)
    };
  }
}
