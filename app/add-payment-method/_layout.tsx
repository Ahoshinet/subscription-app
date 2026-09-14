import { Stack } from 'expo-router';

// iOS-only modal flow. The root Stack presents this whole group as a single
// `presentation: 'modal'` sheet, and this nested Stack owns navigation *inside*
// that sheet. Brand confirmation is pushed onto this Stack so it slides in from
// the right within the sheet (like Reminders' "List" picker) instead of being
// pushed onto the root navigator behind the sheet.
export default function AddPaymentMethodLayout() {
    return (
        <Stack screenOptions={{ headerBackTitle: ' ', headerBackButtonDisplayMode: 'minimal' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="[brandId]" />
        </Stack>
    );
}
