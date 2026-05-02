const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

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

  const dateMatch = body.match(dateRegex);
  const amountMatch = body.match(amountRegex);
  if (!dateMatch || !amountMatch) return null;

  const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);

  // merchant is the next non-empty line after the amount line
  const lines = body.split('\n').map(l => l.trim());
  const amountLineIdx = lines.findIndex(l => amountRegex.test(l));
  let merchant = '';
  for (let i = amountLineIdx + 1; i < lines.length; i++) {
    if (lines[i].length > 0) {
      merchant = lines[i];
      break;
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

// "2026-05" → "2026-06-27"
function nextPaymentDateFromMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const next = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`;
  return `${next}-27`;
}

async function gmailFetch(path: string, accessToken: string): Promise<any> {
  const res = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
  return res.json();
}

export async function fetchPaidyTransactions(accessToken: string): Promise<PaidySummary | null> {
  const query = encodeURIComponent('from:@paidy.com subject:ご利用確定のお知らせ');
  const listData = await gmailFetch(
    `/users/me/messages?q=${query}&maxResults=50`,
    accessToken
  );

  const messages: any[] = listData.messages ?? [];
  if (messages.length === 0) return null;

  const transactions: PaidyTransaction[] = [];

  await Promise.all(
    messages.map(async (msg: any) => {
      try {
        const detail = await gmailFetch(`/users/me/messages/${msg.id}?format=full`, accessToken);
        const body = findTextPlainPart(detail.payload);
        if (!body) return;
        const tx = parseTransactionFromBody(body);
        if (tx) transactions.push(tx);
      } catch {
        // skip malformed messages
      }
    })
  );

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
    nextPaymentDate: nextPaymentDateFromMonth(latestMonth),
    transactions: latestTxs,
  };
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Google user info');
  const data = await res.json();
  return data.email as string;
}
