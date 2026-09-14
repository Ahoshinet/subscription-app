import type { SubscriptionIconSelection } from '../lib/subscriptionIcon';

export interface SubscriptionIconPickerSheetProps {
    visible: boolean;
    isDark: boolean;
    title: string;
    cancelLabel: string;
    comingSoonMessage: string;
    onClose: () => void;
    onSelect: (icon: SubscriptionIconSelection) => void;
}
