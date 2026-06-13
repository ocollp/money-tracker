import { describe, it, expect } from 'vitest';
import { decodeJwtPayload, isAppJwtExpired } from './jwtClient.js';

function makeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${header}.${body}.sig`;
}

describe('jwtClient', () => {
  it('detects expired tokens', () => {
    const expired = makeJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(isAppJwtExpired(expired)).toBe(true);
  });

  it('accepts valid tokens', () => {
    const valid = makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isAppJwtExpired(valid)).toBe(false);
  });

  it('decodes payload', () => {
    const token = makeJwt({ sub: 'abc', exp: 123 });
    expect(decodeJwtPayload(token)).toEqual({ sub: 'abc', exp: 123 });
  });
});
