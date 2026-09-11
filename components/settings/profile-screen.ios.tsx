import { Stack, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const initialName = user?.username ?? '';

  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef(initialName);
  const savedNameRef = useRef(initialName.trim());
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
  const removalPendingRef = useRef(false);
  const allowRemovalRef = useRef(false);

  const updateName = (value: string) => {
    nameRef.current = value;
    setName(value);
  };

  const saveName = useCallback((): Promise<boolean> => {
    const trimmedName = nameRef.current.trim();
    if (trimmedName === savedNameRef.current) return Promise.resolve(true);

    if (!trimmedName) {
      Alert.alert(t('common.error'), t('profile.name_required'));
      return Promise.resolve(false);
    }

    if (saveInFlightRef.current) return saveInFlightRef.current;

    const request = (async () => {
      setIsSaving(true);
      try {
        const updated = await authApi.updateProfile({ username: trimmedName });
        useAuthStore.setState({ user: updated });
        savedNameRef.current = updated.username;
        nameRef.current = updated.username;
        return true;
      } catch (error: unknown) {
        Alert.alert(
          t('common.error'),
          getErrorMessage(error, t('profile.save_failed')),
        );
        return false;
      } finally {
        saveInFlightRef.current = null;
        setIsSaving(false);
      }
    })();

    saveInFlightRef.current = request;
    return request;
  }, [t]);

  useEffect(() => {
    return navigation.addListener('beforeRemove', event => {
      if (allowRemovalRef.current) return;
      if (nameRef.current.trim() === savedNameRef.current) return;

      event.preventDefault();
      if (removalPendingRef.current) return;
      removalPendingRef.current = true;

      void saveName().then(saved => {
        removalPendingRef.current = false;
        if (!saved) return;
        allowRemovalRef.current = true;
        navigation.dispatch(event.data.action);
      });
    });
  }, [navigation, saveName]);

  const backgroundColor = isDark ? SETTINGS_DARK_BACKGROUND : '#F2F2F7';
  const inputBackgroundColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: t('profile.name_title'),
          headerBackTitle: ' ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: textColor,
        }}
      />

      <View style={styles.content}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          clearButtonMode="while-editing"
          editable={!isSaving}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          maxLength={32}
          onChangeText={updateName}
          placeholder={t('profile.name')}
          placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
          returnKeyType="done"
          selectionColor={isDark ? '#0A84FF' : '#007AFF'}
          style={[
            singleLineTextInputStyle,
            styles.input,
            { backgroundColor: inputBackgroundColor, color: textColor },
          ]}
          value={name}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  input: {
    borderRadius: 26,
    fontSize: 17,
    height: 52,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
