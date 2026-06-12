import { describe, expect, it } from 'vitest';
import { stripProxyPrefix } from '../src/domain/proxyPath.js';

describe('stripProxyPrefix', () => {
  it('strips service prefixes and preserves query strings', () => {
    expect(stripProxyPrefix('/api/catalog/products?limit=10&offset=20', '/api/catalog')).toEqual({
      apiPrefix: '/api/catalog',
      upstreamPath: '/products?limit=10&offset=20'
    });
  });

  it('maps a bare service prefix to the downstream root', () => {
    expect(stripProxyPrefix('/api/orders', '/api/orders')).toEqual({
      apiPrefix: '/api/orders',
      upstreamPath: '/'
    });
  });

  it('does not match partial prefix names', () => {
    expect(() => stripProxyPrefix('/api/catalogue/products', '/api/catalog')).toThrow(
      'does not match gateway prefix'
    );
  });
});
