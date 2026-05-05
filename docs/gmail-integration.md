# Gmail連携 (Paidy自動取り込み) / Gmail Integration (Paidy Auto-Import)

## 概要 / Overview

Gmail連携機能を使うと、PaidyのメールをGmailから自動取得し、毎月の請求金額をホーム画面に仮想カードとして表示できます。

With Gmail integration, the app automatically fetches Paidy billing emails from your Gmail and displays the monthly billing amount as a virtual card on the home screen.

---

## 仕組み / How it works

1. **Googleアカウントでサインイン** — `gmail.readonly` スコープのみを要求します。メールの読み取り権限のみで、送信・削除・変更は行いません。

   **Sign in with Google** — Only requests the `gmail.readonly` scope. The app only reads emails and never sends, deletes, or modifies them.

2. **Paidyメールを取得** — `noreply@paidy.com` からの「ご利用確定のお知らせ」を取得し、金額・加盟店名・購入日を解析します。

   **Fetch Paidy emails** — Retrieves "Usage Confirmation" emails from `noreply@paidy.com` and parses the amount, merchant name, and purchase date.

3. **ホーム画面に表示** — 最新月の合計金額と翌月27日（土日祝は翌営業日）の支払予定日を仮想カードとして表示します。

   **Display on home screen** — Shows the latest month's total amount and the next payment date (27th of next month, or the next business day if it falls on a weekend/holiday) as a virtual card.

---

## データの取り扱い / Data Handling

- **アクセストークン** はデバイス上の安全なストレージ（expo-secure-store）にのみ保存され、サーバーには送信されません。

  The **access token** is stored only in the device's secure storage (expo-secure-store) and is never sent to the server.

- **解析済みサマリー**（金額・月・取引一覧）のみサーバーに保存されます。メール本文はサーバーに送信されません。

  Only the **parsed summary** (amount, month, transaction list) is saved to the server. Email body content is never sent to the server.

- データの取り扱いについては[プライバシーポリシー](./privacy-policy.md)（第12条）をご確認ください。

  For details on data handling, please refer to the [Privacy Policy](./privacy-policy.md) (Article 12).

---

## 機種変更・再インストール後 / After Device Change or Reinstall

サーバーに保存されている解析済みデータ（金額・取引履歴）は自動的に復元されます。ただし、アクセストークンはデバイスのSecureStoreにのみ保存されているため、**再同期にはGoogleアカウントへの再サインインが必要**です。

The parsed data (amount, transaction history) saved on the server is automatically restored. However, since the access token is stored only in the device's SecureStore, **re-signing in with your Google account is required to sync again**.

---

## 注意事項 / Notes

- 本機能はベータ版です。予期しない動作が発生する場合があります。

  This feature is in beta. Unexpected behavior may occur.

- Paidyをご利用でない場合、この機能は表示されません（連携しない限りカードは表示されません）。

  If you do not use Paidy, this feature is not relevant (the card will not appear unless you connect).

- アクセストークンはGoogleにより発行後1時間で失効します。失効後に同期する場合は再サインインしてください。

  Access tokens issued by Google expire after 1 hour. Re-sign in if the token has expired when you try to sync.
