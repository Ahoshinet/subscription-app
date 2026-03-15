# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this directory.

## Commands

```bash
pnpm start        # Expo dev server
pnpm android      # Android emulator
pnpm ios          # iOS simulator
pnpm web          # Web browser
pnpm lint         # ESLint
```

## Architecture

**Routing**: Expo Router (file-based) in `app/`. Tab layout: index (dashboard), add, settings. Stack routes: login, register, edit, detail.

**State**: Zustand stores in `store/`:
- `useAuthStore.ts` — JWT auth (login/register/logout), token persisted via expo-secure-store
- `useSubscriptionStore.ts` — Subscription CRUD
- `useSettingsStore.ts` — Language, currency, theme preferences
- `usePaymentMethodStore.ts` — Payment method management
- `useAddFormStore.ts` — Form state for subscription creation

**API client**: `lib/api.ts` — injects JWT token on all requests; selects base URL by environment:
- Dev web: `http://localhost:8084/api`
- Dev Android emulator: `http://10.0.2.2:8084/api`
- Production: `https://subscription-manager.daruks.com/api`

**Styling**: NativeWind (Tailwind CSS for React Native). Dark/light mode via `useColorScheme`.

**i18n**: English and Japanese via react-i18next. Translation files in `i18n/`. Add new keys to both `en.json` and `ja.json`.

## Commits

Use Semantic Commits (e.g. `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
