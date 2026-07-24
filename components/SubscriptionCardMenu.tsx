import { Pressable } from 'react-native';
import type { SubscriptionCardMenuProps } from './SubscriptionCardMenu.types';

export function SubscriptionCardMenu({
    onPress,
    accessibilityHint,
    testID,
    children,
}: SubscriptionCardMenuProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityHint={accessibilityHint}
            testID={testID}
        >
            {children}
        </Pressable>
    );
}
