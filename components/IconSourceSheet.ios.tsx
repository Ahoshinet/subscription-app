import { useEffect, useRef } from 'react';
import { ActionSheetIOS } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { IconSourceOption, IconSourceSheetProps } from './IconSourceSheet.types';

const OPTIONS: IconSourceOption[] = ['photos', 'files', 'library'];

// Native action sheet: RN's Alert is capped at 3 buttons on Android, and the
// iOS sheet is the platform-idiomatic picker for "where does this come from".
export default function IconSourceSheet({ visible, onClose, onSelect }: IconSourceSheetProps) {
    const { t } = useTranslation();
    // Keep callbacks in refs so inline handlers don't re-open the sheet on every render.
    const callbacks = useRef({ onClose, onSelect });
    useEffect(() => {
        callbacks.current = { onClose, onSelect };
    }, [onClose, onSelect]);

    useEffect(() => {
        if (!visible) return;
        ActionSheetIOS.showActionSheetWithOptions(
            {
                title: t('billing.icon_source_title'),
                message: t('billing.icon_source_message'),
                options: [
                    t('billing.icon_source_photos'),
                    t('billing.icon_source_files'),
                    t('billing.icon_source_library'),
                    t('billing.cancel'),
                ],
                cancelButtonIndex: OPTIONS.length,
            },
            (index) => {
                callbacks.current.onClose();
                const option = OPTIONS[index];
                if (option) callbacks.current.onSelect(option);
            },
        );
    }, [visible, t]);

    return null;
}
