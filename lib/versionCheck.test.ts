import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import { fetchWithTimeout } from './fetchWithTimeout';
import { checkRepositoryUpdate } from './versionCheck';

jest.mock('./fetchWithTimeout', () => ({
    fetchWithTimeout: jest.fn(),
}));

const fetchWithTimeoutMock = jest.mocked(fetchWithTimeout);

const response = (status: number, data: unknown): Response => ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn(async () => data),
} as unknown as Response);

describe('checkRepositoryUpdate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns the latest stable GitHub release', async () => {
        fetchWithTimeoutMock.mockResolvedValue(response(200, {
            tag_name: 'v1.0.0',
            html_url: 'https://github.com/Ahoshinet/subscription-app/releases/tag/v1.0.0',
        }));

        await expect(checkRepositoryUpdate('0.16.0')).resolves.toEqual({
            currentVersion: '0.16.0',
            latestVersion: '1.0.0',
            releaseUrl: 'https://github.com/Ahoshinet/subscription-app/releases/tag/v1.0.0',
        });
    });

    test('does not expose an RC tag through the fallback tag list', async () => {
        fetchWithTimeoutMock
            .mockResolvedValueOnce(response(503, {}))
            .mockResolvedValueOnce(response(200, [
                { name: 'v1.0.0-rc.1' },
                { name: 'v0.16.0' },
            ]));

        await expect(checkRepositoryUpdate('0.16.0')).resolves.toBeNull();
    });

    test('uses a stable tag when the latest-release endpoint is unavailable', async () => {
        fetchWithTimeoutMock
            .mockResolvedValueOnce(response(503, {}))
            .mockResolvedValueOnce(response(200, [
                { name: 'v1.0.0-rc.2' },
                { name: 'v1.0.0' },
                { name: 'not-a-version' },
            ]));

        await expect(checkRepositoryUpdate('0.16.0')).resolves.toEqual({
            currentVersion: '0.16.0',
            latestVersion: '1.0.0',
            releaseUrl: 'https://github.com/Ahoshinet/subscription-app/tree/v1.0.0',
        });
    });

    test('returns null when the installed version is current', async () => {
        fetchWithTimeoutMock.mockResolvedValue(response(200, {
            tag_name: 'v1.0.0',
        }));

        await expect(checkRepositoryUpdate('1.0.0')).resolves.toBeNull();
    });
});
