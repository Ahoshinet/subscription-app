import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';

export default function PasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const backgroundColor = isDark ? SETTINGS_DARK_BACKGROUND : '#FAFAFA';

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('password.mismatch'));
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('password.too_short'));
      return;
    }

    setIsSaving(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      Alert.alert(t('password.success_title'), t('password.success_message'));
      router.back();
    } catch (error: unknown) {
      Alert.alert(
        t('common.error'),
        getErrorMessage(error, t('password.update_failed')),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Stack.Screen
        options={{
          title: t('password.title'),
          headerBackTitle: ' ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
        }}
      />

      <ScrollView
        className="flex-1 pt-6"
        style={{ backgroundColor }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4">
          <View
            className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-6"
            testID="ios-password-fields"
          >
            <View className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex-row items-center">
              <TextInput
                className="flex-1 text-base text-neutral-900 dark:text-white"
                style={singleLineTextInputStyle}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder={t('password.current')}
                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
              />
            </View>
            <View className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex-row items-center">
              <TextInput
                className="flex-1 text-base text-neutral-900 dark:text-white"
                style={singleLineTextInputStyle}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder={t('password.new')}
                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
              />
            </View>
            <View className="p-4 flex-row items-center">
              <TextInput
                className="flex-1 text-base text-neutral-900 dark:text-white"
                style={singleLineTextInputStyle}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder={t('password.confirm')}
                placeholderTextColor={isDark ? '#52525B' : '#A1A1AA'}
              />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            className="items-center py-4 rounded-xl bg-white dark:bg-[#1C1C1E]"
            disabled={isSaving}
            onPress={() => void updatePassword()}
            style={{ opacity: isSaving ? 0.6 : 1 }}
            testID="ios-password-update"
          >
            {isSaving ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <Text className="text-blue-500 font-bold text-base">
                {t('password.update')}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
