import type { SubscriptionIconSelection } from '../lib/subscriptionIcon';

export interface SubscriptionIconPickerSheetProps {
    visible: boolean;
    isDark: boolean;
    title: string;
    cancelLabel: string;
    doneLabel: string;
    colorLabel: string;
    categoryLabels: {
        all: string;
        service: string;
        content: string;
        other: string;
    };
    initialIcon?: SubscriptionIconSelection | null;
    onClose: () => void;
    onSelect: (icon: SubscriptionIconSelection) => void;
}
