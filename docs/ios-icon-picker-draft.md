# iOS icon picker — postponed native draft

Status: postponed after `v2.0.0-beta26` so the rest of the iOS work can proceed.

The experimental SwiftUI implementation is preserved in Git commit `a96942f`
at `components/SubscriptionIconPickerSheet.ios.tsx`. Restore it from that commit
when work resumes.

Planned design:

- Present the picker with the SwiftUI `BottomSheet`.
- Add a segmented filter for All, Services, Content, and Other near the header.
- Show unselected SF Symbols in monochrome and highlight only the current choice.
- Pick the accent/background tint separately with the native `ColorPicker`.
- Keep the sheet at the large detent and retain the native drag indicator.

Compatibility invariant:

- SF Symbol names and category metadata are presentation-only.
- Persist only the existing `icon:ionicons:...` or `icon:fontawesome5:...` value.
- Do not change the `/api/v1` payload or require a data migration.
