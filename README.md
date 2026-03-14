# Subscription Manager

[![License: BSD-2-Clause](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](LICENSE)

[日本語版 README はこちら](README_ja.md)

A mobile/web application to manage all your subscription services in one place. Built with **React Native (Expo)**.

## Features

- **Subscription Tracking** — Add, edit, and delete subscriptions with service name, plan, amount, billing cycle, and next payment date
- **Upcoming Payments** — See payments due within the next 3 days with visual countdown indicators
- **Monthly Spending Overview** — Automatic calculation of total monthly spending
- **Payment Methods** — Track credit/debit cards, PayPal, Apple Pay, Google Pay, Amazon Pay, Paidy, and custom methods
- **User Authentication** — Secure registration and login with JWT tokens and Argon2 password hashing
- **Dark / Light Mode** — Supports system, light, and dark themes
- **Bilingual Support** — Full English and Japanese localization
- **Cross-Platform** — Runs on Android, iOS, and Web

## Tech Stack

| Technology | Purpose |
|---|---|
| [Expo](https://expo.dev) (v54) | React Native framework |
| [TypeScript](https://www.typescriptlang.org/) (v5.9) | Type safety |
| [Expo Router](https://docs.expo.dev/router/introduction/) (v6) | File-based routing |
| [Zustand](https://zustand-demo.pmnd.rs/) (v5) | State management |
| [NativeWind](https://www.nativewind.dev/) (v4) | Tailwind CSS for React Native |
| [react-i18next](https://react.i18next.com/) | Internationalization |
| [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) | Secure token storage |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)

### 1. Clone the repository

```bash
git clone https://github.com/Ahoshinet/subscription-app.git
cd subscription-app
```

### 2. Install dependencies and start

```bash
pnpm install
pnpm start
```

Then open the app on:
- **Android Emulator** — Press `a`
- **iOS Simulator** — Press `i`
- **Web Browser** — Press `w`

## Project Structure

```
subscription-app/
├── app/                  # File-based routes (Expo Router)
│   ├── (tabs)/           # Tab navigation (Home, Calendar, Settings)
│   ├── settings/         # Settings sub-pages
│   ├── add.tsx           # Add subscription
│   ├── detail.tsx        # Subscription detail
│   ├── edit.tsx          # Edit subscription
│   ├── login.tsx         # Login screen
│   └── register.tsx      # Registration screen
├── components/           # Reusable UI components
├── store/                # Zustand state stores
├── lib/api.ts            # API client with token management
├── i18n/                 # Internationalization (en, ja)
└── constants/theme.ts    # Color definitions
```

## Scripts

```bash
pnpm start        # Start Expo dev server
pnpm android      # Start on Android
pnpm ios          # Start on iOS
pnpm web          # Start on Web
pnpm lint         # Run ESLint
```

## Contributing

See [Contributing.md](Contributing.md) for guidelines on branch naming, commit conventions, and pull request workflow.

## License

This project is licensed under the [BSD 2-Clause License](LICENSE).

Copyright (c) 2026, Ahoshinet Groups / darui3018823
