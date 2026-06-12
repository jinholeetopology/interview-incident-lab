import { describe, expect, it } from 'vitest';
import { ApiKeyAuthenticator } from '../src/domain/apiKeyAuthenticator.js';
import { ApiKeyRepository } from '../src/repositories/apiKeyRepository.js';
import { MockRedis } from './fakes/mockRedis.js';
import { sha256Hex } from '../src/utils/hash.js';

describe('ApiKeyAuthenticator', () => {
  it('loads env keys into Redis and accepts known keys', async () => {
    const redis = new MockRedis();
    const repository = new ApiKeyRepository(redis);
    await repository.seed(['demo-key-1', 'demo-key-2']);

    const result = await new ApiKeyAuthenticator(repository).authenticate('demo-key-1');

    expect(result).toEqual({
      ok: true,
      apiKey: 'demo-key-1',
      keyHash: sha256Hex('demo-key-1')
    });
  });

  it('denies missing and unknown keys without leaking stored keys', async () => {
    const redis = new MockRedis();
    const repository = new ApiKeyRepository(redis);
    await repository.seed(['demo-key-1']);
    const authenticator = new ApiKeyAuthenticator(repository);

    await expect(authenticator.authenticate(undefined)).resolves.toEqual({ ok: false, reason: 'missing' });
    await expect(authenticator.authenticate('nope')).resolves.toEqual({ ok: false, reason: 'unknown' });
  });
});
