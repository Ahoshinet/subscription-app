# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this directory.

## Commands

```bash
pnpm start        # Expo dev server
pnpm android      # Android emulator
pnpm ios          # iOS simulator
pnpm lint         # ESLint
```

## Architecture

**Routing**: Expo Router (file-based) in `app/`. Tab layout: index (dashboard), calendar, settings. Stack routes: add, login, register, edit, detail.

**State**: Zustand stores in `store/`:
- `useAuthStore.ts` — JWT auth (login/register/logout), token persisted via expo-secure-store
- `useSubscriptionStore.ts` — Subscription CRUD
- `useSettingsStore.ts` — Language, currency, theme preferences
- `usePaymentMethodStore.ts` — Payment method management
- `useAddFormStore.ts` — Form state for subscription creation

**API client**: `lib/api.ts` — injects JWT token on all requests; selects base URL by environment:
- Dev Android emulator: `http://10.0.2.2:8084/api/v1`
- Production: `https://subscription-manager.daruks.com/api/v1`

**Release platforms**: Android and iOS. Web is not a supported release target.

**Styling**: NativeWind (Tailwind CSS for React Native). Dark/light mode via `useColorScheme`.

### Dark mode surfaces

- Use `#0A0A0A` for standard screen backgrounds and matching navigation headers. Do not use pure black (`#000000`) for ordinary app screens.
- Use `#1C1C1C` for elevated or grouped surfaces such as cards, settings rows, and input containers so the surface hierarchy remains visible.
- Keep a pushed settings screen's root background and header consistent with its parent settings screen to avoid a pure-black flash or visual break during navigation.
- Reserve pure black for an intentionally full-black experience, such as image cropping or media presentation.

**i18n**: English and Japanese via react-i18next. Translation files in `i18n/`. Add new keys to both `en.json` and `ja.json`.

## Commits

Use Semantic Commits (e.g. `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
