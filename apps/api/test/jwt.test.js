import { describe, expect, it } from 'vitest';
import { signAppJwt, verifyAppJwt } from '../src/lib/jwt.js';

describe('jwt', () => {
  it('round-trips googleSub in signed token', () => {
    const token = signAppJwt('google-sub-123');
    const payload = verifyAppJwt(token);
    expect(payload.googleSub).toBe('google-sub-123');
  });

  it('throws when verifying a malformed or wrong token', () => {
    expect(() => verifyAppJwt('not-a-jwt')).toThrow();
  });
});
