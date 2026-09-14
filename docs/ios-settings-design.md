# iOS Settings UI implementation guide

This document defines the visual and implementation conventions established for
the iOS Settings tab and its child screens. It is the baseline for extending the
iOS settings experience without changing the Android design.

## Scope

- These rules apply to the Settings tab and routes under `app/settings/` on iOS.
- Android keeps its existing implementation until it is redesigned with Material
  Design.
- Do not implement the iOS appearance with large `Platform.OS` branches inside a
  shared screen. Use platform-specific component files.
- Pure black is an intentional exception for this iOS Settings surface. Ordinary
  app screens continue to follow the dark-surface rules in `CLAUDE.md`.

## Platform separation

Routes should remain thin and resolve a platform-specific component:

```tsx
// app/settings/example.tsx
export { default } from '@/components/settings/example-screen';
```

Use these component files:

```text
components/settings/example-screen.tsx      Android/default implementation
components/settings/example-screen.ios.tsx  iOS implementation
```

Keep the existing Android screen behavior and styling in the default file. Do
not import the `.ios` file explicitly from a route; Metro must select it through
the platform extension.

The Settings root follows the same convention:

```text
components/settings/settings-screen.tsx
components/settings/settings-screen.ios.tsx
```

## Color and surface tokens

The intended iOS dark palette is:

| Role | Value |
| --- | --- |
| Screen and navigation header | `#000000` |
| Grouped card or input surface | `#1C1C1E` |
| Primary text | `#FFFFFF` |
| Secondary text | `#8E8E93` |
| Icon background | `#2C2C2E` |
| Standard accent | `#0A84FF` |
| Destructive action | `#FF453A` |
| Separator | `rgba(84, 84, 88, 0.65)` |
| Chevron | `rgba(235, 235, 245, 0.30)` |

For light mode, prefer the iOS grouped background `#F2F2F7`, white cards, the
separator `rgba(60, 60, 67, 0.29)`, and the chevron
`rgba(60, 60, 67, 0.30)`.

Use `SETTINGS_DARK_BACKGROUND` from `constants/settings-theme`. Its `.ios.ts`
variant resolves to `#000000`, while the default token preserves the Android
background.

The screen root and the native navigation header must use the same background
to prevent a color flash during navigation.

## Headers

Every iOS Settings child screen should suppress the header divider:

```tsx
<Stack.Screen
  options={{
    headerShadowVisible: false,
    headerStyle: { backgroundColor },
    headerTintColor: isDark ? '#FFFFFF' : '#000000',
  }}
/>
```

Keep the centered navigation title and native back control. Do not repeat the
same page title at the top of the scroll content.

## Cards, groups, and headings

- Cards use `#1C1C1E` in dark mode and normally have a 16-point corner radius.
- Do not add an outline, border, or decorative shadow around a grouped card.
- Use approximately 32 points between independent card groups.
- Remove organizational captions such as `Account`, `Preferences`, `App Info`,
  `Environment`, `Select Language`, and `IANA time zones` when the card contents
  are already self-explanatory.
- Keep headings that carry content semantics. Terms of Service and Privacy Policy
  article headings must remain, and their effective date remains visible.
- A hero or explanatory card may use a larger radius (currently 28 points), but
  should retain the same borderless surface treatment.

## Rows and density

Use the following baseline for a single-line, iconless information row:

- minimum height: 50 points;
- horizontal padding: 16 points;
- vertical padding: 14 points when needed to reach the target height;
- label: 17 points, medium weight;
- value: 16 points, secondary color;
- long values: `numberOfLines={1}`, `adjustsFontSizeToFit`, and a conservative
  `minimumFontScale` such as `0.85`.

Interactive Settings rows are generally 50–56 points high. Avoid increasing row
height merely because an icon was removed. Verify the density against the native
iOS Settings app rather than judging a single isolated card.

## Separators

Separators are internal row elements, not row borders:

```tsx
<View
  pointerEvents="none"
  style={[
    styles.separator,
    { backgroundColor: colors.separator },
  ]}
/>
```

```tsx
separator: {
  bottom: 0,
  height: StyleSheet.hairlineWidth,
  left: 16,
  position: 'absolute',
  right: 16,
}
```

- Iconless rows use `left: 16` and `right: 16`.
- Rows with leading icons start the separator at the text label. The current
  layouts use `left: 58` for a 30-point icon container and `left: 60` for a
  32-point icon container.
- The final row in a card has no separator.
- Do not use a full-width Tailwind `border-b` for iOS Settings rows.

## Icons and chevrons

- Use `SymbolView` from `expo-symbols` for standard iOS icons.
- Use `chevron.right` for navigation and link rows, normally at 10 by 18 points,
  with `weight="semibold"` and the subdued iOS chevron color.
- Avoid boxed external-link symbols when they look detached from the row. About
  uses the same `chevron.right` treatment as the rest of Settings.
- Brand marks without an SF Symbols equivalent may keep their provider icon. The
  Google logo and payment-provider marks are examples.
- Content images are not UI glyphs. The app icon and creator avatars remain image
  assets.
- About information rows are intentionally iconless, matching the native iOS
  Information layout. Their separators therefore begin at 16 points.

## Forms and automatic saving

The iOS Profile name editor establishes the lightweight form pattern:

- focus the text field on entry when immediate editing is the purpose of the
  screen;
- use the SF Symbol `xmark.circle.fill` for clearing text;
- place the clear control inside the field with a normal trailing inset;
- save on back navigation when the screen explicitly uses automatic saving;
- do not also show a redundant Save button;
- when saving fails (offline, empty name), show the error with a `Keep
  Editing` / `Discard Changes` choice so the user is never trapped on the
  screen; discarding leaves without saving.

Password and other explicit-submit forms may retain their action button. Their
input groups and action surfaces remain borderless, while meaningful separators
between fields remain visible.

## Native search

For a searchable iOS Settings list on iOS 26 or later, prefer the native bottom
search placement:

```tsx
<Stack.SearchBar
  allowToolbarIntegration
  autoCapitalize="none"
  hideWhenScrolling={false}
  obscureBackground={false}
  onChangeText={(event) => setQuery(event.nativeEvent.text)}
  placeholder={placeholder}
  placement="integrated"
/>
<Stack.Toolbar placement="bottom">
  <Stack.Toolbar.SearchBarSlot />
</Stack.Toolbar>
```

The toolbar slot is an iOS 26+ feature. Keep filtering state in React so the
native field only supplies text input.

Lists used with a native header/search toolbar must include:

```tsx
contentInsetAdjustmentBehavior="automatic"
```

This prevents the first rows from being rendered behind the navigation header.
Reserve sufficient bottom content padding (currently 112 points for Time Zone)
so the last row is not hidden by the search toolbar.

## Screen-specific decisions

### Settings root

- No `Account`, `Preferences`, `Integrations`, or `App Info` captions.
- Cards are separated by 32 points.
- Leading setting icons remain SF Symbols.
- Switches use the native `Switch` component with iOS colors.

### Language and Time Zone

- No explanatory list heading.
- No card outline.
- Selection uses the SF Symbol `checkmark`.
- Iconless separators are inset 16 points on both sides.
- Time Zone uses the native bottom search and automatic content inset.

### Help & Support

- Standard glyphs and chevrons use SF Symbols.
- Separators start at the text label (`left: 60`) and end 16 points before the
  card edge.

### Gmail Integration

- Status, warning, explanatory, and mail glyphs use SF Symbols.
- The Google brand mark remains a provider icon.
- Cards and buttons have no outer outlines.
- Small organizational headings inside explanatory cards are omitted.

### Terms and Privacy

- The navigation title is not repeated in the document body.
- The effective date and legal article headings remain.
- The document is one borderless grouped card.
- Article separators are inset 16 points on both sides.

### About

- The hero follows the native General-style composition: left-aligned app icon,
  title, and description in a borderless card.
- App, environment, and credits captions are omitted.
- Information rows have no leading icons.
- Values stay on one line and may shrink slightly on narrow devices.
- Creator avatars remain because they are content, not row glyphs.
- Repository and issue links use subdued `chevron.right` indicators.

## Testing requirements

Add or update an iOS-specific test whenever a platform screen is introduced or
its conventions change. Import the `.ios` component explicitly in the test.

At minimum, assert the relevant rules:

- `headerShadowVisible` is `false`;
- card class names do not introduce outer `border` styles;
- separator insets match the row layout;
- the expected SF Symbol names are used;
- removed organizational headings are absent;
- long values remain single-line;
- native searchable lists use automatic content insets.

Run:

```bash
pnpm test:ci
pnpm typecheck
pnpm lint
git diff --check
```

Also inspect the result on a real iPhone-sized viewport and confirm that the
first and last rows are not hidden by native navigation or toolbar elements.

## Expo cache and preview version

Adding or renaming a platform-specific file can leave a development client using
a stale Metro resolution. First restart Expo with a cleared cache. When the
current beta preview workflow still requires a visible cache marker, increment
both of these prerelease values together:

- `package.json` → `version`;
- `app.json` → `expo.extra.releaseVersion`.

Do not change `expo.version`, `ios.buildNumber`, or `android.versionCode` solely
to invalidate a JavaScript bundle cache. Validate the preview version with:

```bash
node scripts/verify-release-tag.js v2.0.0-betaN
```

Routine style edits inside an already separated `.ios.tsx` file do not require a
preview-version bump unless stale output is actually observed.

## Review checklist

- [ ] The route re-exports a platform-resolved component.
- [ ] Android/default behavior is unchanged.
- [ ] The iOS dark root and header are `#000000`.
- [ ] Cards are `#1C1C1E` and have no outer outline.
- [ ] Redundant group headings are removed; semantic headings remain.
- [ ] Separators use hairline width and correct insets.
- [ ] Standard icons and chevrons use SF Symbols.
- [ ] Row height and typography match native Settings density.
- [ ] Long trailing values stay on one line.
- [ ] Scroll content clears native headers and bottom toolbars.
- [ ] iOS tests, full tests, type checking, lint, and diff checks pass.

