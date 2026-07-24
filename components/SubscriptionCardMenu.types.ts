import type { ReactElement } from 'react';
import type { MenuAction } from '@expo/ui/community/menu';

export type SubscriptionCardMenuAction = Omit<
    Pick<MenuAction, 'id' | 'title' | 'image' | 'attributes'>,
    'id'
> & {
    id: string;
};

export interface SubscriptionCardMenuProps {
    actions: SubscriptionCardMenuAction[];
    onSelectAction: (id: string) => void;
    onPress: () => void;
    accessibilityHint?: string;
    testID: string;
    children: ReactElement;
}
