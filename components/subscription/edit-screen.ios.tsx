import React from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

import {
    ADD_DARK_BACKGROUND,
    ADD_DARK_CARD_BACKGROUND,
    ADD_DARK_HEADER_BACKGROUND,
    ADD_DARK_SEPARATOR,
} from '@/constants/add-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { resolveIconUrl, type Subscription } from '@/lib/api';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import IconSourceSheet from '@/components/IconSourceSheet';
import SubscriptionIconPickerSheet from '@/components/SubscriptionIconPickerSheet';
import { formatEditDate, useEditSubscriptionForm } from './use-edit-subscription-form';

// iOS edit sheet. Mirrors the add sheet: layered Reminders-style palette,
// native header bar items with SF Symbols, borderless grouped cards with
// inset hairline separators, and the inline date picker.
const LIGHT = {
    background: '#F2F2F7',
    header: '#F2F2F7',
    card: '#FFFFFF',
    separator: 'rgba(60, 60, 67, 0.29)',
    text: '#000000',
    secondary: '#6D6D72',
    placeholder: '#AEAEB2',
    chevron: 'rgba(60, 60, 67, 0.30)',
    iconWell: '#E5E5EA',
    accent: '#007AFF',
};

const DARK = {
    background: ADD_DARK_BACKGROUND,
    header: ADD_DARK_HEADER_BACKGROUND,
    card: ADD_DARK_CARD_BACKGROUND,
    separator: ADD_DARK_SEPARATOR,
    text: '#FFFFFF',
    secondary: '#8E8E93',
    placeholder: '#636366',
    chevron: 'rgba(235, 235, 245, 0.30)',
    iconWell: '#3A3A3C',
    accent: '#0A84FF',
};

export default function EditSubscriptionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? DARK : LIGHT;

    const { subscriptions } = useSubscriptionStore();
    const numId = Number(id);
    const subscription = !isNaN(numId) ? subscriptions.find(s => s.id === numId) : undefined;

    if (!subscription) {
        return (
            <View style={[styles.screen, styles.centered, { backgroundColor: colors.background }]}>
                <Stack.Screen
                    options={{
                        title: 'Not Found',
                        headerShadowVisible: false,
                        headerStyle: { backgroundColor: colors.header },
                        headerTintColor: colors.text,
                    }}
                />
                <Text style={{ fontSize: 17, color: colors.secondary }}>{t('edit.not_found')}</Text>
            </View>
        );
    }

    return <EditSubscriptionForm key={subscription.id} subscription={subscription} />;
}

function Separator({ color }: { color: string }) {
    return <View pointerEvents="none" style={[styles.separator, { backgroundColor: color }]} />;
}

function EditSubscriptionForm({ subscription }: { subscription: Subscription }) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = isDark ? DARK : LIGHT;
    const form = useEditSubscriptionForm(subscription);
    const { router, t } = form;

    const inputStyle = [singleLineTextInputStyle, styles.input, { color: colors.text }];

    const renderNavRow = (
        label: string,
        value: string,
        onPress: () => void,
        options: { last?: boolean; expanded?: boolean; testID?: string } = {},
    ) => (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.row}
            testID={options.testID}
        >
            <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
            <View style={styles.rowTrailing}>
                <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                    numberOfLines={1}
                    style={[styles.rowValue, { color: colors.secondary }]}
                >
                    {value}
                </Text>
                <SymbolView
                    name={options.expanded ? 'chevron.down' : 'chevron.right'}
                    resizeMode="scaleAspectFit"
                    style={styles.chevron}
                    tintColor={colors.chevron}
                    weight="semibold"
                />
            </View>
            {options.last ? null : <Separator color={colors.separator} />}
        </Pressable>
    );

    return (
        <KeyboardAvoidingView style={styles.screen} behavior="padding">
            <Stack.Screen
                options={{
                    title: t('edit.title'),
                    headerBackVisible: false,
                    unstable_headerLeftItems: () => [{
                        type: 'button',
                        label: t('billing.cancel'),
                        accessibilityLabel: t('billing.cancel'),
                        icon: { type: 'sfSymbol', name: 'xmark' },
                        variant: 'plain',
                        disabled: form.isSubmitting,
                        onPress: () => router.back(),
                    }],
                    unstable_headerRightItems: () => [{
                        type: 'button',
                        label: t('edit.submit'),
                        accessibilityLabel: t('edit.submit'),
                        icon: { type: 'sfSymbol', name: 'checkmark' },
                        variant: 'done',
                        disabled: form.isSubmitting,
                        onPress: () => { void form.handleSave(); },
                    }],
                    headerStyle: { backgroundColor: colors.header },
                    headerTintColor: colors.text,
                    headerTitleAlign: 'center',
                    headerShadowVisible: false,
                    headerShown: true,
                }}
            />

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                style={[styles.screen, { backgroundColor: colors.background }]}
                testID="ios-edit-scroll"
            >
                {/* Icon */}
                <View style={styles.hero}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={form.iconUri ? t('subscription_form.icon_change') : t('subscription_form.icon_add')}
                        onPress={() => form.setShowIconSourceSheet(true)}
                        style={styles.heroButton}
                    >
                        <View style={[styles.iconWell, { backgroundColor: colors.iconWell }]}>
                            {form.presetIcon ? (
                                form.presetIcon.pack === 'fontawesome5' ? (
                                    <FontAwesome5 name={form.presetIcon.name} size={32} color={form.presetIcon.color} />
                                ) : (
                                    <Ionicons name={form.presetIcon.name} size={32} color={form.presetIcon.color} />
                                )
                            ) : form.iconUri && !form.iconPreviewError ? (
                                <Image
                                    source={{ uri: resolveIconUrl(form.iconUri) }}
                                    style={styles.iconImage}
                                    onError={() => form.setIconPreviewError(true)}
                                />
                            ) : (
                                <SymbolView
                                    name="camera.fill"
                                    resizeMode="scaleAspectFit"
                                    style={styles.iconPlaceholder}
                                    tintColor={colors.secondary}
                                />
                            )}
                        </View>
                        <Text style={[styles.heroLabel, { color: colors.accent }]}>
                            {form.iconUri ? t('subscription_form.icon_change') : t('subscription_form.icon_add')}
                        </Text>
                    </Pressable>
                </View>

                {/* Basics */}
                <View style={[styles.card, { backgroundColor: colors.card }]} testID="ios-edit-basics-card">
                    <View style={styles.row}>
                        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('subscription_form.service_name')}</Text>
                        <TextInput
                            keyboardAppearance={isDark ? 'dark' : 'light'}
                            onChangeText={form.setServiceName}
                            placeholder={t('subscription_form.service_name_placeholder')}
                            placeholderTextColor={colors.placeholder}
                            selectionColor={colors.accent}
                            style={inputStyle}
                            value={form.serviceName}
                        />
                        <Separator color={colors.separator} />
                    </View>
                    <View style={styles.row}>
                        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('subscription_form.plan_name')}</Text>
                        <TextInput
                            keyboardAppearance={isDark ? 'dark' : 'light'}
                            onChangeText={form.setPlanName}
                            placeholder={t('subscription_form.plan_name_placeholder')}
                            placeholderTextColor={colors.placeholder}
                            selectionColor={colors.accent}
                            style={inputStyle}
                            value={form.planName}
                        />
                        <Separator color={colors.separator} />
                    </View>
                    <View style={styles.row}>
                        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('subscription_form.amount')}</Text>
                        <TextInput
                            keyboardAppearance={isDark ? 'dark' : 'light'}
                            keyboardType="numeric"
                            onChangeText={form.setAmount}
                            placeholder={form.amountPlaceholder}
                            placeholderTextColor={colors.placeholder}
                            selectionColor={colors.accent}
                            style={inputStyle}
                            value={form.amount}
                        />
                        <Separator color={colors.separator} />
                    </View>
                    {renderNavRow(
                        t('subscription_form.currency'),
                        form.currency,
                        () => router.push('/settings/currency-picker'),
                        { last: true, testID: 'ios-edit-currency-row' },
                    )}
                </View>

                {/* Payment */}
                <View style={[styles.card, { backgroundColor: colors.card }]} testID="ios-edit-payment-card">
                    {renderNavRow(
                        t('subscription_form.next_payment_date'),
                        formatEditDate(form.nextPaymentDate),
                        () => form.setShowDatePicker(!form.showDatePicker),
                        { expanded: form.showDatePicker, testID: 'ios-edit-date-row' },
                    )}

                    {form.showDatePicker ? (
                        <View style={styles.datePickerRow}>
                            <DateTimePicker
                                display="inline"
                                mode="date"
                                onValueChange={(_, selectedDate) => form.setNextPaymentDate(selectedDate)}
                                onDismiss={() => form.setShowDatePicker(false)}
                                style={styles.datePicker}
                                themeVariant={isDark ? 'dark' : 'light'}
                                value={form.nextPaymentDate}
                            />
                            <Separator color={colors.separator} />
                        </View>
                    ) : null}

                    {renderNavRow(
                        t('subscription_form.billing_cycle_label'),
                        form.billingCycleLabel,
                        () => router.push('/settings/billing-cycle'),
                        { testID: 'ios-edit-billing-cycle-row' },
                    )}
                    {renderNavRow(
                        t('subscription_form.payment_method_label'),
                        form.paymentMethodLabel,
                        () => router.push('/settings/payment-method'),
                        { last: true, testID: 'ios-edit-payment-method-row' },
                    )}
                </View>

                {/* Memo */}
                <View style={[styles.card, { backgroundColor: colors.card }]} testID="ios-edit-memo-card">
                    <TextInput
                        keyboardAppearance={isDark ? 'dark' : 'light'}
                        multiline
                        onChangeText={form.setMemo}
                        placeholder={t('subscription_form.memo_placeholder')}
                        placeholderTextColor={colors.placeholder}
                        selectionColor={colors.accent}
                        style={[styles.memoInput, { color: colors.text }]}
                        textAlignVertical="top"
                        value={form.memo}
                    />
                </View>
            </ScrollView>

            <IconSourceSheet
                visible={form.showIconSourceSheet}
                isDark={isDark}
                onClose={() => form.setShowIconSourceSheet(false)}
                onSelect={form.handleSelectIconSource}
            />
            <SubscriptionIconPickerSheet
                visible={form.showIconPickerModal}
                isDark={isDark}
                title={t('billing.pick_icon_title')}
                cancelLabel={t('billing.cancel')}
                comingSoonMessage={t('billing.icon_customization_coming_soon')}
                onClose={() => form.setShowIconPickerModal(false)}
                onSelect={form.handleSelectPresetIcon}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        paddingBottom: 40,
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    hero: {
        alignItems: 'center',
        marginBottom: 24,
    },
    heroButton: {
        alignItems: 'center',
    },
    iconWell: {
        alignItems: 'center',
        borderRadius: 24,
        height: 80,
        justifyContent: 'center',
        marginBottom: 8,
        overflow: 'hidden',
        width: 80,
    },
    iconImage: {
        borderRadius: 24,
        height: 80,
        width: 80,
    },
    iconPlaceholder: {
        height: 32,
        width: 36,
    },
    heroLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    card: {
        borderRadius: 16,
        marginBottom: 32,
        overflow: 'hidden',
    },
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 50,
        paddingHorizontal: 16,
    },
    fieldLabel: {
        fontSize: 17,
        fontWeight: '500',
        width: 104,
    },
    input: {
        flex: 1,
        fontSize: 17,
        height: 50,
        paddingBottom: 0,
        paddingTop: 0,
    },
    rowLabel: {
        flexShrink: 0,
        fontSize: 17,
        fontWeight: '500',
    },
    rowTrailing: {
        alignItems: 'center',
        flexDirection: 'row',
        flexShrink: 1,
        marginLeft: 12,
    },
    rowValue: {
        flexShrink: 1,
        fontSize: 16,
        marginRight: 8,
    },
    chevron: {
        height: 18,
        width: 10,
    },
    datePickerRow: {
        paddingBottom: 8,
        paddingHorizontal: 16,
    },
    datePicker: {
        alignSelf: 'center',
    },
    memoInput: {
        fontSize: 17,
        minHeight: 120,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    separator: {
        bottom: 0,
        height: StyleSheet.hairlineWidth,
        left: 16,
        position: 'absolute',
        right: 16,
    },
});
