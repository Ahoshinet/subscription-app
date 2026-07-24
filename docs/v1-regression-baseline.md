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
- Authentication error normalization for unknown thrown values
- Subscription list, create, update, status, and delete API requests
- Subscription Store renewal fallback, CRUD state transitions, error handling,
  authentication-session isolation, and logout reset
- Payment-method CRUD, icon upload cleanup, legacy icon migration, and
  cross-session response isolation, including unsupported type normalization
- Settings synchronization, update failure handling, cross-session isolation,
  and language/currency/theme validation
- Notification permission, scheduling, de-duplication, cancellation, and tap
  routing
- Paidy integration loading, account-scoped token storage, reauthentication,
  synchronization, deletion retry, cross-session isolation, and logout reset
- Gmail message pagination, MIME/plain-text decoding, Paidy transaction
  extraction, latest-month totals, business-day rollover, partial-failure
  rejection, and external-response validation
- UI error normalization, typed dashboard rows and routes, validated
  language/currency selections, and runtime-validated icon names
- Stable update discovery that excludes release-candidate tags from the
  fallback GitHub tag list
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

The initial measurement was recorded from `f0ccbfc` on 2026-07-24. The current
measurement was recorded from `f39ab50` after release-candidate discovery
coverage on 2026-07-25:

| Metric | Initial | Current | Enforced minimum |
|---|---:|---:|---:|
| Statements | 46.61% | 77.94% | 76% |
| Branches | 38.44% | 66.52% | 64% |
| Functions | 46.00% | 75.87% | 74% |
| Lines | 48.94% | 81.40% | 79% |

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

### Measurement protocol

Use the tagged `v0.16.0` release build for the baseline and the exact candidate
commit for the comparison. Do not compare a development build with a release
build.

1. Use the same physical device, OS version, account, 100-subscription data set,
   network, theme, and language for both builds.
2. Disable battery saver, connect to the same network, close unrelated apps,
   and let the device temperature return to normal before each run.
3. Record five samples per timing and report the median. Preserve the individual
   samples in the release-candidate record.
4. For "dashboard usable", use a screen recording and count from launch until
   the loading state has disappeared and the list accepts input. Android's
   `am start -W` and iOS launch instrumentation are useful secondary proxies,
   but do not replace this user-visible endpoint.
5. Measure detail opening and edited-subscription saving from the initiating
   tap until the destination or updated value is visible and interactive.
6. Measure peak memory while scrolling the seeded dashboard with Android Studio
   Profiler and Xcode Instruments. Point-in-time memory readings are supporting
   evidence only.

For Android, after installing and preparing the release build, collect repeatable
activity-start and PSS proxy data with:

```bash
pnpm perf:android -- --label baseline --output docs/performance/android-v0.16.0.json
pnpm perf:android -- --label candidate --output docs/performance/android-candidate.json
```

The command refuses emulators by default and records device/build metadata. The
output files are evidence attachments; copy the user-visible medians and
profiler peak into the table below.

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

### Optimization decision

Investigate a candidate when a repeated comparison on the same device shows
either:

- A timing median worse by both more than 10% and more than 100 ms
- Dashboard peak memory worse by more than 10%
- A visible interaction stall or dropped-frame regression

Keep an optimization only when the repeated measurement improves the named
problem without failing the regression gates. If no measured problem crosses
these criteria, record `No optimization required` for Goal 6; making no code
change is the expected outcome, not a missing release step.

## Release-candidate record

For each `v1.0.0-rc.N`, add a dated result section containing:

- Commit and build identifiers
- Devices and OS versions
- Automated-check links
- Completed checklist items and known failures
- Upgrade-test result
- Performance comparison against this baseline

The project release version, package metadata, About screen, and Git tag use
`1.0.0-rc.N`. The native marketing version remains `1.0.0` only because iOS
requires a numeric `CFBundleShortVersionString`; `expo.extra.releaseVersion`
preserves the complete RC identity in the app configuration. Each RC also gets
monotonically increasing Android `versionCode` / iOS `buildNumber` values.
GitHub Actions marks RC tags as prereleases, so normal update discovery
continues to return only stable releases.

If the final RC passes without a fix, run `pnpm version:build` to increment only
the two native build identifiers, remove the RC suffix from project metadata,
commit that metadata-only promotion, and tag it `v1.0.0`. If a fix is required,
increment the native build identifiers and issue the next RC instead.

### v1.0.0-rc.1 — 2026-07-25

- Candidate: commit `589a45c3268b34385487a566572a7ee32ff0915b`,
  tag `v1.0.0-rc.1`, Android `versionCode` 2, iOS `buildNumber` 2
- Automated checks:
  [Code Quality](https://github.com/Ahoshinet/subscription-app/actions/runs/30120117771),
  [Tests](https://github.com/Ahoshinet/subscription-app/actions/runs/30120183805),
  [Android](https://github.com/Ahoshinet/subscription-app/actions/runs/30120183895),
  and
  [iOS](https://github.com/Ahoshinet/subscription-app/actions/runs/30120183795)
  passed
- Release:
  [GitHub prerelease](https://github.com/Ahoshinet/subscription-app/releases/tag/v1.0.0-rc.1)
  contains arm64-v8a APK, x86_64 APK, and unsigned IPA assets
- Devices and OS versions: pending real-device validation
- Upgrade test from `v0.16.0`: pending
- Performance comparison: pending
- Known failures: none in automated release checks; real-device gates remain
  open
