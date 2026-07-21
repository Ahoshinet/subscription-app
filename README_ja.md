# Subscription Manager

[![License: BSD-2-Clause](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](LICENSE)

[English README](README.md)

サブスクリプションを一目で確認、まとめて管理。意図しない支払いはもう存在しません。

サブスクリプションサービスを一元管理するためのモバイル/Webアプリケーションです。**React Native (Expo)** で構築されています。

## 主な機能

- **サブスクリプション管理** — サービス名、プラン、金額、請求サイクル、次回支払日を入力してサブスクを追加・編集・削除
- **支払い予定の通知** — 3日以内に迫る支払いをカウントダウン表示
- **月額費用の概算** — 月々の合計支出を自動計算
- **支払い方法の管理** — クレジットカード、PayPal、Apple Pay、Google Pay、Amazon Pay、Paidy などに対応
- **ユーザー認証** — JWT トークンと Argon2 パスワードハッシュによる安全な認証
- **ダーク / ライトモード** — システム設定・ライト・ダークテーマに対応
- **日英バイリンガル対応** — 英語と日本語の完全なローカライゼーション
- **クロスプラットフォーム** — Android、iOS、Web で動作

## 技術スタック

| 技術 | 用途 |
|---|---|
| [Expo](https://expo.dev) (v55) | React Native フレームワーク |
| [TypeScript](https://www.typescriptlang.org/) (v5.9) | 型安全性 |
| [Expo Router](https://docs.expo.dev/router/introduction/) (v55) | ファイルベースルーティング |
| [Zustand](https://zustand-demo.pmnd.rs/) (v5) | 状態管理 |
| [NativeWind](https://www.nativewind.dev/) (v4) | Tailwind CSS for React Native |
| [react-i18next](https://react.i18next.com/) | 国際化 |
| [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) | Android/iOSでのトークンの安全な保存 |

Web版の認証トークンはブラウザのセッションストレージにのみ保持され、
ブラウザセッション終了時に削除されます。ローカルストレージには永続化しません。

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/) (v18 以上)
- [pnpm](https://pnpm.io/)

### 1. リポジトリをクローン

```bash
git clone https://github.com/Ahoshinet/subscription-app.git
cd subscription-app
```

### 2. 依存関係のインストールと起動

```bash
pnpm install
pnpm start
```

起動後、以下のプラットフォームでアプリを開けます:
- **Android エミュレータ** — `a` キーを押す
- **iOS シミュレータ** — `i` キーを押す
- **Web ブラウザ** — `w` キーを押す

## プロジェクト構成

```
subscription-app/
├── app/                  # ファイルベースルーティング (Expo Router)
│   ├── (tabs)/           # タブナビゲーション (ホーム, カレンダー, 設定)
│   ├── settings/         # 設定サブページ
│   ├── add.tsx           # サブスクリプション追加
│   ├── detail.tsx        # サブスクリプション詳細
│   ├── edit.tsx          # サブスクリプション編集
│   ├── login.tsx         # ログイン画面
│   └── register.tsx      # 新規登録画面
├── components/           # 再利用可能な UI コンポーネント
├── store/                # Zustand ステートストア
├── lib/api.ts            # トークン管理付き API クライアント
├── i18n/                 # 国際化 (en, ja)
└── constants/theme.ts    # カラー定義
```

## スクリプト

```bash
pnpm start        # Expo 開発サーバーを起動
pnpm android      # Android で起動
pnpm ios          # iOS で起動
pnpm web          # Web で起動
pnpm lint         # ESLint を実行
```

## API ドキュメント

リクエスト・レスポンス形式やエラーコードを含む完全な API リファレンスは [docs/api.md](docs/api.md) をご覧ください。

## コントリビューション

ブランチ命名規則、コミット規約、プルリクエストのワークフローについては [Contributing.md](Contributing.md) をご覧ください。

## ライセンス

このプロジェクトは [BSD 2-Clause License](LICENSE) の下でライセンスされています。

Copyright (c) 2026, Ahoshinet Groups / darui3018823
