import { afterEach, describe, expect, jest, test } from '@jest/globals';

import { fetchWithTimeout, RequestTimeoutError } from './fetchWithTimeout';

const originalFetch = globalThis.fetch;

function createAbortableFetch() {
    return jest.fn((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
            const rejectAsAborted = () => {
                const error = new Error('Aborted');
                error.name = 'AbortError';
                reject(error);
            };

            if (init?.signal?.aborted) {
                rejectAsAborted();
            } else {
                init?.signal?.addEventListener('abort', rejectAsAborted, { once: true });
            }
        }));
}

describe('fetchWithTimeout', () => {
    afterEach(() => {
        jest.useRealTimers();
        globalThis.fetch = originalFetch;
    });

    test('returns the response and forwards an internal abort signal', async () => {
        const response = { ok: true } as Response;
        const fetchMock = jest.fn(async () => response);
        globalThis.fetch = fetchMock as typeof fetch;

        await expect(fetchWithTimeout('/api/subscriptions', { method: 'GET' }, 1000))
            .resolves.toBe(response);
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/subscriptions',
            expect.objectContaining({
                method: 'GET',
                signal: expect.any(AbortSignal),
            }),
        );
    });

    test('throws RequestTimeoutError when the deadline expires', async () => {
        jest.useFakeTimers();
        globalThis.fetch = createAbortableFetch() as typeof fetch;

        const request = fetchWithTimeout('/api/subscriptions', {}, 500);
        const assertion = expect(request).rejects.toEqual(new RequestTimeoutError(500));

        await jest.advanceTimersByTimeAsync(500);
        await assertion;
    });

    test('preserves a caller-initiated abort error', async () => {
        jest.useFakeTimers();
        globalThis.fetch = createAbortableFetch() as typeof fetch;
        const controller = new AbortController();

        const request = fetchWithTimeout(
            '/api/subscriptions',
            { signal: controller.signal },
            500,
        );
        controller.abort();

        await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    });
});
