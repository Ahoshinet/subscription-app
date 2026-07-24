import { beforeEach, describe, expect, test } from '@jest/globals';

import {
    activateAuthSession,
    captureAuthSession,
    getAuthTokenUserId,
    invalidateAuthSession,
    isAuthSessionCurrent,
} from './authSession';

function createUnsignedToken(claims: Record<string, unknown>): string {
    const payload = globalThis.btoa(JSON.stringify(claims))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return `header.${payload}.signature`;
}

describe('authSession', () => {
    beforeEach(() => {
        invalidateAuthSession();
    });

    test('extracts a non-empty subject from a JWT payload', () => {
        expect(getAuthTokenUserId(createUnsignedToken({ sub: 'user-123' }))).toBe('user-123');
        expect(getAuthTokenUserId(createUnsignedToken({ sub: '' }))).toBeNull();
        expect(getAuthTokenUserId(createUnsignedToken({ sub: 123 }))).toBeNull();
        expect(getAuthTokenUserId('not-a-token')).toBeNull();
    });

    test('tracks whether a captured session is still current', () => {
        expect(captureAuthSession()).toBeNull();

        const first = activateAuthSession('user-1');
        expect(captureAuthSession()).toEqual(first);
        expect(isAuthSessionCurrent(first)).toBe(true);

        const second = activateAuthSession('user-2');
        expect(isAuthSessionCurrent(first)).toBe(false);
        expect(isAuthSessionCurrent(second)).toBe(true);

        invalidateAuthSession();
        expect(isAuthSessionCurrent(second)).toBe(false);
        expect(captureAuthSession()).toBeNull();
    });
});
