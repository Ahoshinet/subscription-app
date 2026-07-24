import { Pressable } from 'react-native';
import { MenuView } from '@expo/ui/community/menu';
import type { SubscriptionCardMenuProps } from './SubscriptionCardMenu.types';

export function SubscriptionCardMenu({
    actions,
    onSelectAction,
    onPress,
    accessibilityHint,
    testID,
    children,
}: SubscriptionCardMenuProps) {
    return (
        <MenuView
            actions={actions}
            onPressAction={(event) => onSelectAction(event.nativeEvent.event)}
            shouldOpenOnLongPress
            testID={testID}
        >
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityHint={accessibilityHint}
            >
                {children}
            </Pressable>
        </MenuView>
    );
}
