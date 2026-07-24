# v1 Regression Baseline

This document records the App behavior that must remain stable while preparing
v1. It is a consumer-side checklist and does not describe Server internals.

## Baseline reference

- Baseline date: 2026-07-24
- App version: `0.16.0`
- Git reference: `2d40ccd` (`main`)
- API contract: `/api/v1`
- New user-facing features are frozen after this baseline.

The Git reference includes the post-tag inspection and payment-method input
fixes that are part of the behavior being stabilized. Future checks should
record the tested commit, device, OS version, and result rather than moving this
reference.

## Automated coverage

Run the following before a change is accepted:

```bash
pnpm test:ci
pnpm test:coverage
pnpm typecheck
pnpm lint
```

GitHub Actions runs the unit test suite on every push and pull request. The
current automated baseline covers:

- Authentication session generation and credential subject parsing
- Authentication request headers, token refresh, and unauthorized handling
- Login, registration, logout, launch restoration, and offline authentication
  state transitions
- Subscription list, create, update, status, and delete API requests
- Payment-method CRUD, icon upload cleanup, legacy icon migration, and
  cross-session response isolation
- Notification permission, scheduling, de-duplication, cancellation, and tap
  routing
- Date-only calculations and recurring payment rollover
- Amount parsing and monthly normalization
- Time-zone conversion and offset formatting
- Preset icon serialization
- Request timeout and caller cancellation

Automated coverage supplements the device checks below; it does not replace
them.

### Coverage baseline

Coverage is collected from all TypeScript modules in `lib/` and `store/`,
including files that no test imports. Test files themselves are excluded.

The initial measurement was recorded from `f0ccbfc` on 2026-07-24:

| Metric | Measured | Enforced minimum |
|---|---:|---:|
| Statements | 46.61% | 45% |
| Branches | 38.44% | 35% |
| Functions | 46.00% | 45% |
| Lines | 48.94% | 45% |

The minimums intentionally leave a small margin for instrumentation differences
while preventing unreviewed coverage loss. Raise them as uncovered critical
modules gain tests. Do not lower them merely to make a regression pass.

GitHub Actions enforces these minimums on every push and pull request and keeps
the generated coverage report as an artifact for 14 days.

## Critical behavior checklist

Use `[x]` only after observing the behavior on the recorded build.

### Authentication

- [ ] Registration succeeds with valid account details and the selected time
      zone, then opens the authenticated App.
- [ ] Registration and login errors remain visible and do not create an
      authenticated session.
- [ ] Login persists the credential on iOS and Android for the next launch.
- [ ] Web login lasts for the browser session and does not use persistent local
      storage.
- [ ] Launch with a valid credential restores the authenticated App.
- [ ] A temporary offline or service error during launch does not discard a
      previously valid credential.
- [ ] A rejected credential returns the user to login and clears user-scoped
      state.
- [ ] Logout clears the credential, subscriptions, settings, payment methods,
      integration data, and scheduled reminders belonging to the prior user.
- [ ] Data from one account never appears after logging into another account.

### Subscription dashboard and CRUD

- [ ] The dashboard displays the authenticated user's subscriptions.
- [ ] Monthly spending normalizes weekly and yearly prices before totaling.
- [ ] Upcoming payments show items due within three days with the correct
      countdown.
- [ ] Overdue recurring dates advance without changing their billing anchor.
- [ ] A subscription can be created with its service, plan, amount, currency,
      billing cycle, payment method, next date, icon, memo, and status.
- [ ] An existing subscription can be opened and edited.
- [ ] Clearing an optional plan, payment detail, icon, or memo remains cleared
      after reloading.
- [ ] Status changes are reflected by both normal controls and long-press
      shortcuts.
- [ ] A subscription can be deleted after confirmation and does not return
      after reloading.
- [ ] Failed create, update, status, or delete requests show an error without
      falsely changing the saved data.

### Payment methods

- [ ] Preset, credit-card, and custom payment methods can be added.
- [ ] Labels, card details, colors, icons, and memos can be edited.
- [ ] Clearing an optional field remains cleared after reloading.
- [ ] A method in use is not silently removed when deletion is rejected.
- [ ] Uploaded custom icons remain visible after restarting the App.

### Settings and integrations

- [ ] English and Japanese changes apply throughout the App.
- [ ] Currency changes update displayed amounts without changing stored
      subscription prices.
- [ ] System, light, and dark theme selections apply consistently to screens,
      navigation headers, cards, and inputs.
- [ ] Changing the account time zone updates date-sensitive displays without
      shifting date-only values unexpectedly.
- [ ] Notification preference changes persist and reminders follow the current
      setting.
- [ ] Gmail/Paidy integration data loads, refreshes, and can be removed without
      affecting unrelated subscriptions.

### Error and offline behavior

- [ ] Offline launch with a previously valid credential keeps locally persisted
      settings and user-scoped data available.
- [ ] A timed-out request is distinguishable from an authentication rejection.
- [ ] Retrying after connectivity returns refreshes the displayed data.
- [ ] Server validation messages are shown without exposing credentials or
      sensitive request contents.
- [ ] Rapid repeated actions are blocked or reported without creating duplicate
      records.

### Platform interactions

- [ ] Long-press actions work through the native interaction appropriate to
      Android and iOS.
- [ ] Every long-press action is also available through the normal interface.
- [ ] Back navigation, keyboard dismissal, date selection, image selection, and
      confirmation dialogs behave normally on both platforms.
- [ ] Safe areas, text scaling, and the on-screen keyboard do not hide required
      controls.

## Minimum device matrix

Record the device and OS version beside each completed run.

| Run | Platform | Theme | Language | Network | Device / OS | Result |
|---|---|---|---|---|---|---|
| 1 | iOS | Light | English | Online |  | [ ] |
| 2 | iOS | Dark | Japanese | Offline recovery |  | [ ] |
| 3 | Android | Light | Japanese | Online |  | [ ] |
| 4 | Android | Dark | English | Offline recovery |  | [ ] |

At least one run on each platform must use a physical device. Web smoke testing
is useful but does not replace either mobile platform.

## Upgrade check

Install the baseline build, create data, and then install the candidate over it:

- [ ] The user remains signed in when the credential is still valid.
- [ ] Language, currency, theme, notification, and time-zone settings remain.
- [ ] Subscriptions and payment methods reload without duplication or loss.
- [ ] Custom icons and integration state remain usable.
- [ ] No migration error or first-launch crash occurs.

## Performance record

Measure release builds on one representative physical iOS device and one
representative physical Android device. Use the same seeded account and network
for the baseline and candidate.

| Metric | iOS baseline | Android baseline | Candidate | Notes |
|---|---:|---:|---:|---|
| Cold launch to usable dashboard |  |  |  | |
| Warm launch to usable dashboard |  |  |  | |
| Dashboard render with 100 subscriptions |  |  |  | |
| Open subscription detail |  |  |  | |
| Save an edited subscription |  |  |  | |
| Peak memory on dashboard |  |  |  | |

Record at least five timing samples and use the median. Performance work must
name the measured regression or improvement; an unmeasured rewrite does not
advance the v1 release.

## Release-candidate record

For each `v1.0.0-rc.N`, add a dated result section containing:

- Commit and build identifiers
- Devices and OS versions
- Automated-check links
- Completed checklist items and known failures
- Upgrade-test result
- Performance comparison against this baseline
