import { fetchWithTimeout } from './fetchWithTimeout';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

// Thrown when the Gmail access token is expired/revoked (HTTP 401).
// expo-auth-session access tokens live ~1 hour, so callers must route the
// user back through the auth prompt when they see this.
export class GmailAuthError extends Error {
  constructor() {
    super('Gmail authorization expired');
    this.name = 'GmailAuthError';
  }
}

export interface PaidyTransaction {
  date: string;
  amount: number;
  merchant: string;
}

export interface PaidySummary {
  totalAmount: number;
  month: string;            // "2026-05"
  nextPaymentDate: string;  // "2026-06-27"
  transactions: PaidyTransaction[];
}

function decodeBase64Url(data: string): Uint8Array {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

function decodeQuotedPrintable(input: string): string {
  const withoutSoftBreaks = input.replace(/=\r?\n/g, '');
  const bytes: number[] = [];
  let i = 0;
  while (i < withoutSoftBreaks.length) {
    if (
      withoutSoftBreaks[i] === '=' &&
      i + 2 < withoutSoftBreaks.length &&
      /[0-9A-Fa-f]{2}/.test(withoutSoftBreaks.slice(i + 1, i + 3))
    ) {
      bytes.push(parseInt(withoutSoftBreaks.slice(i + 1, i + 3), 16));
      i += 3;
    } else {
      bytes.push(withoutSoftBreaks.charCodeAt(i));
      i++;
    }
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
}

function findTextPlainPart(payload: any): string | null {
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    const bytes = decodeBase64Url(payload.body.data);
    const raw = new TextDecoder('latin1').decode(bytes);
    return decodeQuotedPrintable(raw);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const result = findTextPlainPart(part);
      if (result) return result;
    }
  }
  return null;
}

function parseTransactionFromBody(body: string): PaidyTransaction | null {
  const dateRegex = /(\d{4}年\d{1,2}月\d{1,2}日)/;
  const amountRegex = /(\d{1,3}(?:,\d{3})*)\s*円/;

  const lines = body.split('\n').map(l => l.trim());

  // Prefer label-anchored lines (e.g. 「ご利用金額」「ご利用日」) so unrelated
  // figures like 「ご利用上限額 100,000円」 are never picked up. Fall back to
  // the first matching line for older/unknown mail layouts, skipping known
  // non-transaction amounts.
  const findLabeledIdx = (label: RegExp, value: RegExp) =>
    lines.findIndex(l => label.test(l) && value.test(l));

  let amountLineIdx = findLabeledIdx(/ご利用金額/, amountRegex);
  if (amountLineIdx === -1) {
    amountLineIdx = lines.findIndex(l => !/上限/.test(l) && amountRegex.test(l));
  }
  const amountMatch = amountLineIdx !== -1 ? lines[amountLineIdx].match(amountRegex) : null;

  const dateLineIdx = findLabeledIdx(/ご利用日/, dateRegex);
  const dateMatch = dateLineIdx !== -1
    ? lines[dateLineIdx].match(dateRegex)
    : body.match(dateRegex);

  if (!dateMatch || !amountMatch) return null;

  const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);

  // Merchant: prefer the labeled store line; otherwise keep the old
  // heuristic of the next non-empty line after the amount line.
  let merchant = '';
  const merchantLineIdx = lines.findIndex(l => /(ご利用店|加盟店|ショップ名)/.test(l));
  if (merchantLineIdx !== -1) {
    merchant = lines[merchantLineIdx]
      .replace(/^.*?(ご利用店舗?|ご利用店|加盟店名?|ショップ名)\s*[:：]?\s*/, '')
      .trim();
    if (!merchant) {
      // Label and value are on separate lines
      for (let i = merchantLineIdx + 1; i < lines.length; i++) {
        if (lines[i].length > 0) {
          merchant = lines[i];
          break;
        }
      }
    }
  }
  if (!merchant) {
    for (let i = amountLineIdx + 1; i < lines.length; i++) {
      if (lines[i].length > 0) {
        merchant = lines[i];
        break;
      }
    }
  }

  return { date: dateMatch[1], amount, merchant };
}

// "2026年5月2日" → "2026-05"
function parseDateToYearMonth(dateStr: string): string | null {
  const m = dateStr.match(/(\d{4})年(\d{1,2})月/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, '0')}`;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function fetchJpHolidaysForYear(year: number): Promise<Set<string>> {
  try {
    const res = await fetchWithTimeout(`https://holidays-jp.github.io/api/v1/${year}/date.json`);
    if (!res.ok) return new Set();
    const data: Record<string, string> = await res.json();
    return new Set(Object.keys(data));
  } catch {
    return new Set();
  }
}

// "2026-05" → "2026-06-27" (advanced to next business day if weekend/JP holiday)
async function nextPaymentDateFromMonth(month: string): Promise<string> {
  const [year, mon] = month.split('-').map(Number);
  const nextYear = mon === 12 ? year + 1 : year;
  const nextMon = mon === 12 ? 1 : mon + 1;
  const holidays = await fetchJpHolidaysForYear(nextYear);
  const d = new Date(nextYear, nextMon - 1, 27);
  while (d.getDay() === 0 || d.getDay() === 6 || holidays.has(toISODate(d))) {
    d.setDate(d.getDate() + 1);
  }
  return toISODate(d);
}

async function gmailFetch(path: string, accessToken: string): Promise<any> {
  const res = await fetchWithTimeout(`${GMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401) throw new GmailAuthError();
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
  return res.json();
}

export async function fetchPaidyTransactions(accessToken: string): Promise<PaidySummary | null> {
    // Japanese in the query URL can be misinterpreted; filter by subject in code instead.
  const query = encodeURIComponent('from:noreply@paidy.com newer_than:90d');
  const messages: any[] = [];
  let pageToken: string | undefined;
  do {
    const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const listData = await gmailFetch(
      `/users/me/messages?q=${query}&maxResults=100${pageParam}`,
      accessToken
    );
    messages.push(...(listData.messages ?? []));
    pageToken = listData.nextPageToken;
  } while (pageToken);

  if (messages.length === 0) return null;

  const transactions: PaidyTransaction[] = [];
  let processingFailed = false;

  // Avoid firing hundreds of Gmail detail requests at once while still
  // keeping synchronization reasonably fast.
  for (let start = 0; start < messages.length; start += 10) {
    const batch = messages.slice(start, start + 10);
    await Promise.all(batch.map(async (msg: any) => {
      try {
        const detail = await gmailFetch(`/users/me/messages/${msg.id}?format=full`, accessToken);
        const headers: any[] = detail.payload?.headers ?? [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value ?? '';
        if (!subject.includes('ご利用確定のお知らせ')) return;
        const body = findTextPlainPart(detail.payload);
        if (!body) {
          processingFailed = true;
          return;
        }
        const tx = parseTransactionFromBody(body);
        if (tx) {
          transactions.push(tx);
        } else {
          processingFailed = true;
        }
      } catch (error) {
        if (error instanceof GmailAuthError) throw error;
        processingFailed = true;
      }
    }));
  }

  if (processingFailed) {
    throw new Error('Some Paidy messages could not be retrieved or parsed');
  }

  if (transactions.length === 0) return null;

  // group by year-month, pick latest
  const byMonth: Record<string, PaidyTransaction[]> = {};
  for (const tx of transactions) {
    const ym = parseDateToYearMonth(tx.date);
    if (!ym) continue;
    if (!byMonth[ym]) byMonth[ym] = [];
    byMonth[ym].push(tx);
  }

  const latestMonth = Object.keys(byMonth).sort().at(-1);
  if (!latestMonth) return null;

  const latestTxs = byMonth[latestMonth];
  const totalAmount = latestTxs.reduce((sum, tx) => sum + tx.amount, 0);

  return {
    totalAmount,
    month: latestMonth,
    nextPaymentDate: await nextPaymentDateFromMonth(latestMonth),
    transactions: latestTxs,
  };
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetchWithTimeout('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Google user info');
  const data = await res.json();
  return data.email as string;
}
