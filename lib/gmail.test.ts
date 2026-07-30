import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { TextDecoder as NodeTextDecoder } from 'node:util';

import { fetchWithTimeout } from './fetchWithTimeout';
import {
  fetchGoogleUserEmail,
  fetchPaidyTransactions,
  GmailAuthError,
} from './gmail';

jest.mock('./fetchWithTimeout', () => ({
  fetchWithTimeout: jest.fn(),
}));

const fetchWithTimeoutMock = jest.mocked(fetchWithTimeout);

globalThis.TextDecoder = NodeTextDecoder as typeof TextDecoder;
globalThis.atob = (value: string): string => {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const input = value.replace(/=+$/, '');
  let bits = 0;
  let bitCount = 0;
  let decoded = '';
  for (const character of input) {
    const index = alphabet.indexOf(character);
    if (index < 0) continue;
    bits = (bits << 6) | index;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      decoded += String.fromCharCode((bits >> bitCount) & 0xff);
      bits &= bitCount === 0 ? 0 : (1 << bitCount) - 1;
    }
  }
  return decoded;
};

const jsonResponse = (status: number, data: unknown): Response => ({
  status,
  ok: status >= 200 && status < 300,
  json: jest.fn(async () => data),
} as unknown as Response);

const toUtf8Bytes = (value: string): number[] => {
  const encoded = encodeURIComponent(value);
  const bytes: number[] = [];
  for (let index = 0; index < encoded.length;) {
    if (encoded[index] === '%') {
      bytes.push(Number.parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 3;
    } else {
      bytes.push(encoded.charCodeAt(index));
      index += 1;
    }
  }
  return bytes;
};

const toQuotedPrintable = (value: string): string => {
  const encoded = toUtf8Bytes(value);
  return Array.from(encoded, (byte) => {
    if (byte === 10) return '\n';
    if (byte >= 33 && byte <= 126 && byte !== 61) {
      return String.fromCharCode(byte);
    }
    return `=${byte.toString(16).padStart(2, '0').toUpperCase()}`;
  }).join('');
};

const toBase64Url = (value: string): string => {
  const bytes = toUtf8Bytes(value);
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let encoded = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const chunk = (first << 16)
      | ((second ?? 0) << 8)
      | (third ?? 0);
    encoded += alphabet[(chunk >> 18) & 63];
    encoded += alphabet[(chunk >> 12) & 63];
    if (second !== undefined) encoded += alphabet[(chunk >> 6) & 63];
    if (third !== undefined) encoded += alphabet[chunk & 63];
  }
  return encoded;
};

const transactionDetail = (
  body: string,
  subject = '【Paidy】ご利用確定のお知らせ',
) => ({
  payload: {
    headers: [{ name: 'Subject', value: subject }],
    parts: [{
      mimeType: 'multipart/alternative',
      parts: [{
        mimeType: 'text/plain',
        body: { data: toBase64Url(toQuotedPrintable(body)) },
      }],
    }],
  },
});

describe('fetchPaidyTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns null when Gmail has no matching messages', async () => {
    fetchWithTimeoutMock.mockResolvedValue(jsonResponse(200, {
      messages: [],
    }));

    await expect(fetchPaidyTransactions('gmail-token')).resolves.toBeNull();

    expect(fetchWithTimeoutMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/me/messages?'),
      {
        headers: { Authorization: 'Bearer gmail-token' },
      },
    );
  });

  test('paginates messages and totals only the latest billing month', async () => {
    fetchWithTimeoutMock.mockImplementation(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes('pageToken=next-page')) {
        return jsonResponse(200, { messages: [{ id: 'july-2' }] });
      }
      if (requestUrl.includes('/users/me/messages?')) {
        return jsonResponse(200, {
          messages: [{ id: 'june-1' }, { id: 'july-1' }],
          nextPageToken: 'next-page',
        });
      }
      if (requestUrl.includes('/messages/june-1?')) {
        return jsonResponse(200, transactionDetail([
          'ご利用上限額 100,000円',
          'ご利用金額：900円',
          'ご利用日：2026年6月30日',
          'ご利用店：Old Store',
        ].join('\n')));
      }
      if (requestUrl.includes('/messages/july-1?')) {
        return jsonResponse(200, transactionDetail([
          'ご利用上限額 100,000円',
          'ご利用金額：1,200円',
          'ご利用日：2026年7月20日',
          'ご利用店：First Store',
        ].join('\n')));
      }
      if (requestUrl.includes('/messages/july-2?')) {
        return jsonResponse(200, transactionDetail([
          'ご利用金額：2,300円',
          'ご利用日：2026年7月21日',
          '加盟店名：Second Store',
        ].join('\n')));
      }
      if (requestUrl.includes('holidays-jp.github.io')) {
        return jsonResponse(200, {});
      }
      throw new Error(`Unexpected URL: ${requestUrl}`);
    });

    await expect(fetchPaidyTransactions('gmail-token')).resolves.toEqual({
      totalAmount: 3500,
      month: '2026-07',
      nextPaymentDate: '2026-08-27',
      transactions: [
        {
          date: '2026年7月20日',
          amount: 1200,
          merchant: 'First Store',
        },
        {
          date: '2026年7月21日',
          amount: 2300,
          merchant: 'Second Store',
        },
      ],
    });

    expect(fetchWithTimeoutMock).toHaveBeenCalledWith(
      expect.stringContaining('pageToken=next-page'),
      expect.any(Object),
    );
  });

  test('moves a weekend payment date past a Japanese holiday', async () => {
    fetchWithTimeoutMock.mockImplementation(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes('/users/me/messages?')) {
        return jsonResponse(200, { messages: [{ id: 'may-1' }] });
      }
      if (requestUrl.includes('/messages/may-1?')) {
        return jsonResponse(200, transactionDetail([
          'ご利用金額：1,000円',
          'ご利用日：2026年5月20日',
          'ショップ名：Weekend Store',
        ].join('\n')));
      }
      if (requestUrl.includes('holidays-jp.github.io')) {
        return jsonResponse(200, {
          '2026-06-29': 'Test holiday',
        });
      }
      throw new Error(`Unexpected URL: ${requestUrl}`);
    });

    const result = await fetchPaidyTransactions('gmail-token');

    expect(result?.nextPaymentDate).toBe('2026-06-30');
  });

  test('ignores messages with an unrelated subject', async () => {
    fetchWithTimeoutMock
      .mockResolvedValueOnce(jsonResponse(200, {
        messages: [{ id: 'unrelated' }],
      }))
      .mockResolvedValueOnce(jsonResponse(200, transactionDetail(
        'ご利用金額：1,000円\nご利用日：2026年7月20日',
        'Paidyからのお知らせ',
      )));

    await expect(fetchPaidyTransactions('gmail-token')).resolves.toBeNull();
  });

  test('reports a relevant message whose body cannot be parsed', async () => {
    fetchWithTimeoutMock
      .mockResolvedValueOnce(jsonResponse(200, {
        messages: [{ id: 'broken' }],
      }))
      .mockResolvedValueOnce(jsonResponse(200, transactionDetail(
        'ご利用金額と利用日のない本文',
      )));

    await expect(fetchPaidyTransactions('gmail-token'))
      .rejects.toThrow('Some Paidy messages could not be retrieved or parsed');
  });

  test('reports a failed detail request instead of returning a partial total', async () => {
    fetchWithTimeoutMock
      .mockResolvedValueOnce(jsonResponse(200, {
        messages: [{ id: 'ok' }, { id: 'failed' }],
      }))
      .mockResolvedValueOnce(jsonResponse(200, transactionDetail([
        'ご利用金額：1,000円',
        'ご利用日：2026年7月20日',
      ].join('\n'))))
      .mockResolvedValueOnce(jsonResponse(500, {}));

    await expect(fetchPaidyTransactions('gmail-token'))
      .rejects.toThrow('Some Paidy messages could not be retrieved or parsed');
  });

  test('preserves a Gmail authorization failure', async () => {
    fetchWithTimeoutMock.mockResolvedValue(jsonResponse(401, {}));

    await expect(fetchPaidyTransactions('expired-token'))
      .rejects.toBeInstanceOf(GmailAuthError);
  });

  test('rejects malformed Gmail message references', async () => {
    fetchWithTimeoutMock.mockResolvedValue(jsonResponse(200, {
      messages: [{ threadId: 'missing-id' }],
    }));

    await expect(fetchPaidyTransactions('gmail-token'))
      .rejects.toThrow('Invalid Gmail message reference');
  });
});

describe('fetchGoogleUserEmail', () => {
  test('returns the email from Google user info', async () => {
    fetchWithTimeoutMock.mockResolvedValue(jsonResponse(200, {
      email: 'user@example.com',
    }));

    await expect(fetchGoogleUserEmail('gmail-token'))
      .resolves.toBe('user@example.com');
    expect(fetchWithTimeoutMock).toHaveBeenCalledWith(
      'https://www.googleapis.com/userinfo/v2/me',
      {
        headers: { Authorization: 'Bearer gmail-token' },
      },
    );
  });

  test('rejects a failed Google user-info request', async () => {
    fetchWithTimeoutMock.mockResolvedValue(jsonResponse(503, {}));

    await expect(fetchGoogleUserEmail('gmail-token'))
      .rejects.toThrow('Failed to fetch Google user info');
  });

  test('rejects user info without a valid email', async () => {
    fetchWithTimeoutMock.mockResolvedValue(jsonResponse(200, {
      email: null,
    }));

    await expect(fetchGoogleUserEmail('gmail-token'))
      .rejects.toThrow('Google user info response is missing an email address');
  });
});
