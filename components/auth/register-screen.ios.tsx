import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useTranslation } from 'react-i18next';

import { AUTH_DARK_BACKGROUND } from '@/constants/auth-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/lib/errors';
import { getDeviceTimeZone } from '@/lib/timeZone';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';

// iOS registration screen: native back control and header (no custom
// transparent overlay button), a single borderless grouped card for the
// fields, and the native iOS accent color for the primary action.
export default function RegisterScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { t } = useTranslation();
    // The centered content sits in the space below the native header, so it
    // reads lower than Login's full-screen centering. Pull it back up by half
    // the header height to match.
    const headerHeight = useHeaderHeight();

    const backgroundColor = isDark ? AUTH_DARK_BACKGROUND : '#F2F2F7';
    const accent = isDark ? '#0A84FF' : '#007AFF';
    const secondaryText = isDark ? '#8E8E93' : '#6D6D72';
    const placeholderColor = isDark ? '#636366' : '#AEAEB2';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register, isLoading, clearError } = useAuthStore();

    const handleRegister = async () => {
        const trimmedUsername = username.trim();
        if (!trimmedUsername || !password) {
            Alert.alert(t('common.input_error'), t('register.error_required'));
            return;
        }

        // Mirror the server's username rules so the user gets immediate feedback
        if (!/^[a-zA-Z0-9._-]{3,32}$/.test(trimmedUsername)) {
            Alert.alert(t('common.input_error'), t('register.error_username_invalid'));
            return;
        }

        // Mirror the server's minimum so the user gets immediate feedback
        if (password.length < 8) {
            Alert.alert(t('common.input_error'), t('register.error_password_short'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t('common.input_error'), t('register.error_mismatch'));
            return;
        }

        clearError();
        try {
            await register({
                username: trimmedUsername,
                password,
                time_zone: getDeviceTimeZone(),
            });
            router.replace('/(tabs)');
        } catch (error: unknown) {
            Alert.alert(
                t('register.error_title'),
                getErrorMessage(error, t('register.error_failed')),
            );
            clearError();
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor }} behavior="padding">
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: '',
                    headerBackTitle: ' ',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor },
                    headerTintColor: isDark ? '#FFFFFF' : '#000000',
                }}
            />
            <ScrollView
                style={{ backgroundColor }}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, marginTop: -headerHeight / 2 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="mb-10 items-center">
                    <Text className="text-[34px] font-bold text-black dark:text-white mb-2 tracking-tight">
                        Create Account
                    </Text>
                    <Text style={{ color: secondaryText }} className="text-base text-center">
                        {t('register.subtitle')}
                    </Text>
                </View>

                <View
                    className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-6"
                    testID="ios-register-fields"
                >
                    <View className="px-4 h-14 justify-center border-b border-[rgba(60,60,67,0.29)] dark:border-[rgba(84,84,88,0.65)]">
                        <TextInput
                            placeholder={t('register.username_placeholder')}
                            placeholderTextColor={placeholderColor}
                            className="text-base text-black dark:text-white"
                            style={singleLineTextInputStyle}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            testID="ios-register-username"
                        />
                    </View>
                    <View className="px-4 h-14 justify-center border-b border-[rgba(60,60,67,0.29)] dark:border-[rgba(84,84,88,0.65)]">
                        <TextInput
                            placeholder={t('register.password_placeholder')}
                            placeholderTextColor={placeholderColor}
                            className="text-base text-black dark:text-white"
                            style={singleLineTextInputStyle}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            testID="ios-register-password"
                        />
                    </View>
                    <View className="px-4 h-14 justify-center">
                        <TextInput
                            placeholder={t('register.password_confirm_placeholder')}
                            placeholderTextColor={placeholderColor}
                            className="text-base text-black dark:text-white"
                            style={singleLineTextInputStyle}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            testID="ios-register-confirm-password"
                        />
                    </View>
                </View>

                <Pressable
                    onPress={() => void handleRegister()}
                    disabled={isLoading}
                    style={{ backgroundColor: accent }}
                    className="w-full rounded-2xl py-4 items-center mb-6 active:opacity-80"
                    testID="ios-register-submit"
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-semibold text-lg">{t('register.submit')}</Text>
                    )}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
