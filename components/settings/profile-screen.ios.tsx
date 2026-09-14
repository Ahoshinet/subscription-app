import { Stack, useNavigation } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { singleLineTextInputStyle } from '@/lib/textInputStyles';
import { useAuthStore } from '@/store/useAuthStore';

type SaveResult = { ok: true } | { ok: false; message: string };

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const initialName = user?.username ?? '';
  const inputRef = useRef<TextInput>(null);

  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef(initialName);
  const savedNameRef = useRef(initialName.trim());
  const saveInFlightRef = useRef<Promise<SaveResult> | null>(null);
  const removalPendingRef = useRef(false);
  const allowRemovalRef = useRef(false);

  const updateName = (value: string) => {
    nameRef.current = value;
    setName(value);
  };

  // Resolves to a message instead of alerting so the caller decides how to
  // recover: the back-navigation guard below needs to offer a discard route.
  const saveName = useCallback((): Promise<SaveResult> => {
    const trimmedName = nameRef.current.trim();
    if (trimmedName === savedNameRef.current) return Promise.resolve({ ok: true });

    if (!trimmedName) {
      return Promise.resolve({ ok: false, message: t('profile.name_required') });
    }

    if (saveInFlightRef.current) return saveInFlightRef.current;

    const request = (async (): Promise<SaveResult> => {
      setIsSaving(true);
      try {
        const updated = await authApi.updateProfile({ username: trimmedName });
        useAuthStore.setState({ user: updated });
        savedNameRef.current = updated.username;
        nameRef.current = updated.username;
        return { ok: true };
      } catch (error: unknown) {
        return { ok: false, message: getErrorMessage(error, t('profile.save_failed')) };
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

      const leave = () => {
        allowRemovalRef.current = true;
        navigation.dispatch(event.data.action);
      };

      void saveName().then(result => {
        if (result.ok) {
          removalPendingRef.current = false;
          leave();
          return;
        }
        // Never trap the user: when saving is impossible (offline, empty
        // name), let them either keep editing or drop the change and leave.
        Alert.alert(t('common.error'), result.message, [
          {
            text: t('profile.discard_keep'),
            style: 'cancel',
            onPress: () => { removalPendingRef.current = false; },
          },
          {
            text: t('profile.discard_confirm'),
            style: 'destructive',
            onPress: leave,
          },
        ]);
      });
    });
  }, [navigation, saveName, t]);

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
        <View style={[styles.inputContainer, { backgroundColor: inputBackgroundColor }]}>
          <TextInput
            ref={inputRef}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            editable={!isSaving}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            maxLength={32}
            onChangeText={updateName}
            placeholder={t('profile.name')}
            placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
            returnKeyType="done"
            selectionColor={isDark ? '#0A84FF' : '#007AFF'}
            style={[singleLineTextInputStyle, styles.input, { color: textColor }]}
            value={name}
          />
          {name ? (
            <Pressable
              accessibilityLabel={t('profile.clear_name')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                updateName('');
                inputRef.current?.focus();
              }}
              style={styles.clearButton}
            >
              <SymbolView
                name="xmark.circle.fill"
                resizeMode="scaleAspectFit"
                style={styles.clearIcon}
                tintColor={isDark ? '#636366' : '#AEAEB2'}
              />
            </Pressable>
          ) : null}
        </View>
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
  inputContainer: {
    alignItems: 'center',
    borderRadius: 26,
    flexDirection: 'row',
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 17,
    height: 52,
    lineHeight: 22,
    paddingLeft: 20,
    paddingRight: 56,
  },
  clearButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    width: 36,
  },
  clearIcon: {
    height: 18,
    width: 18,
  },
});
