import { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import {
    DropdownMenu,
    DropdownMenuItem,
    Host,
    RNHostView,
    Text as ComposeText,
    useMaterialColors,
} from '@expo/ui/jetpack-compose';
import type {
    SubscriptionCardMenuAction,
    SubscriptionCardMenuProps,
} from './SubscriptionCardMenu.types';

interface ActionItemProps {
    action: SubscriptionCardMenuAction;
    destructiveColor: string;
    onSelectAction: (id: string) => void;
    dismiss: () => void;
}

function ActionItem({
    action,
    destructiveColor,
    onSelectAction,
    dismiss,
}: ActionItemProps) {
    if (action.attributes?.hidden) {
        return null;
    }

    const elementColors = action.attributes?.destructive
        ? {
            textColor: destructiveColor,
            disabledTextColor: destructiveColor,
        }
        : undefined;

    return (
        <DropdownMenuItem
            enabled={!action.attributes?.disabled}
            elementColors={elementColors}
            onClick={() => {
                onSelectAction(action.id);
                dismiss();
            }}
        >
            <DropdownMenuItem.Text>
                <ComposeText>{action.title}</ComposeText>
            </DropdownMenuItem.Text>
        </DropdownMenuItem>
    );
}

export function SubscriptionCardMenu({
    actions,
    onSelectAction,
    onPress,
    accessibilityHint,
    testID,
    children,
}: SubscriptionCardMenuProps) {
    const [expanded, setExpanded] = useState(false);
    const destructiveColor = useMaterialColors().error;
    const dismiss = useCallback(() => setExpanded(false), []);
    const open = useCallback(() => setExpanded(true), []);

    return (
        <Host matchContents>
            <DropdownMenu expanded={expanded} onDismissRequest={dismiss}>
                <DropdownMenu.Trigger>
                    <RNHostView matchContents>
                        <Pressable
                            onPress={onPress}
                            onLongPress={open}
                            accessibilityRole="button"
                            accessibilityHint={accessibilityHint}
                            testID={testID}
                        >
                            {children}
                        </Pressable>
                    </RNHostView>
                </DropdownMenu.Trigger>
                <DropdownMenu.Items>
                    {actions.map((action) => (
                        <ActionItem
                            key={action.id}
                            action={action}
                            destructiveColor={destructiveColor}
                            onSelectAction={onSelectAction}
                            dismiss={dismiss}
                        />
                    ))}
                </DropdownMenu.Items>
            </DropdownMenu>
        </Host>
    );
}
