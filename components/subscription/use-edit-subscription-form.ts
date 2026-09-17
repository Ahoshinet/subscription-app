import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { uploadApi, type Subscription } from '@/lib/api';
import { CURRENCIES, isAmountInputAboveMax, isCurrencyId, parseAmountInput } from '@/lib/currency';
import { dateOnlyToLocalDate, formatDateOnly } from '@/lib/dateUtils';
import { getErrorMessage } from '@/lib/errors';
import { InvalidIconImageError, pickIconImage, type IconSource } from '@/lib/iconPicker';
import { setCropHandler } from '@/lib/imageCropStore';
import {
    buildSubscriptionPresetIconValue,
    isSubscriptionPresetIconValue,
    parseSubscriptionPresetIconValue,
    type SubscriptionIconSelection,
} from '@/lib/subscriptionIcon';
import { useAddFormStore } from '@/store/useAddFormStore';
import { usePaymentMethodStore } from '@/store/usePaymentMethodStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import type { IconSourceOption } from '@/components/IconSourceSheet.types';

export function formatEditDate(date: Date) {
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
}

// State and behaviour shared by the Android and iOS edit screens; each
// platform file only owns its presentation.
export function useEditSubscriptionForm(subscription: Subscription) {
    'use no memo';
    const router = useRouter();
    const navigation = useNavigation();
    const { t } = useTranslation();

    const { updateSubscription } = useSubscriptionStore();

    const [serviceName, setServiceName] = useState(subscription.service_name);
    const [planName, setPlanName] = useState(subscription.plan_name || '');
    const [amount, setAmount] = useState(String(subscription.amount));
    const [nextPaymentDate, setNextPaymentDate] = useState(() => dateOnlyToLocalDate(subscription.next_payment_date));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [iconUri, setIconUri] = useState<string | null>(subscription.icon_url ?? null);
    const [iconPreviewError, setIconPreviewError] = useState(false);
    const [showIconPickerModal, setShowIconPickerModal] = useState(false);
    const [showIconSourceSheet, setShowIconSourceSheet] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [memo, setMemo] = useState(subscription.memo || '');

    const { billingCycle, paymentMethod, currency, setBillingCycle, setPaymentMethod, setCurrency } = useAddFormStore();
    const { methods: paymentMethods } = usePaymentMethodStore();
    const subscriptionCurrency = isCurrencyId(subscription.currency)
        ? subscription.currency
        : 'JPY';

    useEffect(() => {
        setBillingCycle(subscription.billing_cycle);
        setPaymentMethod(subscription.payment_method);
        setCurrency(subscriptionCurrency);
    }, [
        setBillingCycle,
        setCurrency,
        setPaymentMethod,
        subscription.billing_cycle,
        subscription.payment_method,
        subscriptionCurrency,
    ]);

    const initialNextPaymentDate = useMemo(
        () => subscription.next_payment_date,
        [subscription.next_payment_date],
    );
    const isDirty =
        serviceName !== subscription.service_name ||
        planName !== (subscription.plan_name || '') ||
        amount !== String(subscription.amount) ||
        memo !== (subscription.memo || '') ||
        iconUri !== (subscription.icon_url ?? null) ||
        formatDateOnly(nextPaymentDate) !== initialNextPaymentDate ||
        billingCycle !== subscription.billing_cycle ||
        paymentMethod !== subscription.payment_method ||
        currency !== subscriptionCurrency;
    // Refs so the beforeRemove listener sees current values without
    // re-subscribing on every keystroke.
    const isDirtyRef = useRef(isDirty);
    const skipDirtyGuardRef = useRef(false);
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    // Confirm before the screen is removed with unsaved edits — covers the
    // × button, the Android back button, and the modal swipe-down gesture.
    useEffect(() => {
        return navigation.addListener('beforeRemove', (e) => {
            if (skipDirtyGuardRef.current || !isDirtyRef.current) return;
            e.preventDefault();
            Alert.alert(t('edit.discard_title'), t('edit.discard_message'), [
                { text: t('edit.discard_keep'), style: 'cancel' },
                {
                    text: t('edit.discard_confirm'),
                    style: 'destructive',
                    onPress: () => {
                        skipDirtyGuardRef.current = true;
                        navigation.dispatch(e.data.action);
                    },
                },
            ]);
        });
    }, [navigation, t]);

    const handleSave = async () => {
        if (!serviceName || !amount) {
            Alert.alert(t('subscription_form.error_title'), t('subscription_form.error_required'));
            return;
        }
        if (isAmountInputAboveMax(amount)) {
            Alert.alert(t('subscription_form.error_title'), t('subscription_form.error_amount_too_large'));
            return;
        }
        const parsedAmount = parseAmountInput(amount);
        if (parsedAmount === null) {
            Alert.alert(t('subscription_form.error_title'), t('subscription_form.error_invalid_amount'));
            return;
        }

        setIsSubmitting(true);
        let pendingIconUrl: string | undefined;
        try {
            let iconUrl: string | undefined = subscription.icon_url;
            // Only upload if the uri changed and isn't already a server URL
            if (iconUri && !iconUri.startsWith('/uploads') && !iconUri.startsWith('http') && !isSubscriptionPresetIconValue(iconUri)) {
                const uploadResult = await uploadApi.uploadIcon(iconUri);
                iconUrl = uploadResult.url;
                pendingIconUrl = uploadResult.url;
            } else if (iconUri && isSubscriptionPresetIconValue(iconUri)) {
                iconUrl = iconUri;
            }
            // Empty inputs send null so the server clears the stored value
            // (undefined fields would be omitted and keep the old value).
            await updateSubscription(subscription.id, {
                service_name: serviceName,
                plan_name: planName.trim() ? planName.trim() : null,
                amount: parsedAmount,
                currency,
                billing_cycle: billingCycle,
                payment_method: paymentMethod,
                next_payment_date: formatDateOnly(nextPaymentDate),
                icon_url: iconUrl,
                memo: memo.trim() ? memo.trim() : null,
            });
            skipDirtyGuardRef.current = true;
            router.back();
        } catch (error: unknown) {
            if (pendingIconUrl?.startsWith('/uploads/pending/')) {
                await uploadApi.deletePending(pendingIconUrl).catch(() => {});
            }
            Alert.alert(
                t('common.error'),
                getErrorMessage(error, t('edit.error_failed')),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const pickIcon = async (source: IconSource) => {
        try {
            const asset = await pickIconImage(source);
            if (!asset) return;
            setCropHandler((croppedUri) => {
                setIconUri(croppedUri);
                setIconPreviewError(false);
            });
            router.push({
                pathname: '/image-crop',
                params: { uri: asset.uri, width: String(asset.width), height: String(asset.height) },
            });
        } catch (error) {
            if (error instanceof InvalidIconImageError) {
                Alert.alert(t('common.error'), t('billing.icon_file_invalid'));
                return;
            }
            throw error;
        }
    };

    const handleSelectPresetIcon = (icon: SubscriptionIconSelection) => {
        setIconUri(buildSubscriptionPresetIconValue(icon));
        setIconPreviewError(false);
        setShowIconPickerModal(false);
    };

    const handleSelectIconSource = (option: IconSourceOption) => {
        if (option === 'library') setShowIconPickerModal(true);
        else void pickIcon(option);
    };

    const billingCycleLabel = t(`billing_cycle.${billingCycle}`);
    const paymentMethodLabel =
        paymentMethods.find(m => m.id === paymentMethod)?.label ??
        t(`payment_method.${paymentMethod}`);
    const amountPlaceholder = `${CURRENCIES.find(c => c.id === currency)?.symbol ?? currency} 0`;
    const presetIcon = parseSubscriptionPresetIconValue(iconUri);

    return {
        router,
        t,
        serviceName, setServiceName,
        planName, setPlanName,
        amount, setAmount,
        amountPlaceholder,
        currency,
        nextPaymentDate, setNextPaymentDate,
        showDatePicker, setShowDatePicker,
        iconUri,
        iconPreviewError, setIconPreviewError,
        presetIcon,
        showIconPickerModal, setShowIconPickerModal,
        showIconSourceSheet, setShowIconSourceSheet,
        isSubmitting,
        memo, setMemo,
        billingCycleLabel,
        paymentMethodLabel,
        handleSave,
        handleSelectPresetIcon,
        handleSelectIconSource,
    };
}
