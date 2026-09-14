import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { THIRD_PARTY_LICENSES, THIRD_PARTY_LICENSES_URL } from '@/constants/licenses';
import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LibraryRowProps {
  chevronColor: string;
  isLast?: boolean;
  license: string;
  name: string;
  repository: string | null;
  separatorColor: string;
  separatorTestID?: string;
  version: string;
}

function LibraryRow({
  chevronColor,
  isLast = false,
  license,
  name,
  repository,
  separatorColor,
  separatorTestID,
  version,
}: LibraryRowProps) {
  return (
    <Pressable
      className="flex-row items-center justify-between px-4"
      disabled={!repository}
      onPress={() => repository && Linking.openURL(repository)}
      style={styles.row}
    >
      <View className="flex-1 mr-3">
        <Text
          className="font-medium text-neutral-900 dark:text-white"
          numberOfLines={1}
          style={styles.rowLabel}
        >
          {name}
        </Text>
        <Text
          className="text-neutral-500 dark:text-neutral-400"
          style={styles.rowDetail}
        >
          {`v${version} · ${license}`}
        </Text>
      </View>
      {repository ? (
        <SymbolView
          name="arrow.up.right"
          resizeMode="scaleAspectFit"
          style={styles.trailingIcon}
          tintColor={chevronColor}
          weight="semibold"
        />
      ) : null}
      {!isLast ? (
        <View
          pointerEvents="none"
          style={[styles.separator, { backgroundColor: separatorColor }]}
          testID={separatorTestID}
        />
      ) : null}
    </Pressable>
  );
}

export default function AcknowledgementsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const textPrimary = isDark ? '#FFFFFF' : '#000000';
  const backgroundColor = isDark ? SETTINGS_DARK_BACKGROUND : '#FAFAFA';
  const separatorColor = isDark
    ? 'rgba(84, 84, 88, 0.65)'
    : 'rgba(60, 60, 67, 0.29)';
  const chevronColor = isDark
    ? 'rgba(235, 235, 245, 0.30)'
    : 'rgba(60, 60, 67, 0.30)';

  return (
    <>
      <Stack.Screen
        options={{
          title: t('acknowledgements.title'),
          headerBackTitle: ' ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: textPrimary,
        }}
      />
      <View className="flex-1" style={{ backgroundColor }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            className="rounded-2xl bg-white dark:bg-[#1C1C1E]"
            style={styles.introCard}
            testID="ios-acknowledgements-intro-card"
          >
            <Text className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {t('acknowledgements.intro_body')}
            </Text>
          </View>

          <Text
            className="text-neutral-500 dark:text-neutral-400"
            style={styles.sectionHeader}
          >
            {t('acknowledgements.section_libraries').toUpperCase()}
          </Text>
          <View
            className="rounded-2xl overflow-hidden bg-white dark:bg-[#1C1C1E]"
            testID="ios-acknowledgements-libraries-card"
          >
            {THIRD_PARTY_LICENSES.map((lib, index) => (
              <LibraryRow
                chevronColor={chevronColor}
                isLast={index === THIRD_PARTY_LICENSES.length - 1}
                key={`${lib.name}@${lib.version}`}
                license={lib.license}
                name={lib.name}
                repository={lib.repository}
                separatorColor={separatorColor}
                separatorTestID={index === 0 ? 'ios-acknowledgements-separator-first' : undefined}
                version={lib.version}
              />
            ))}
          </View>
          <Text
            className="text-neutral-500 dark:text-neutral-400"
            style={styles.footnote}
          >
            {t('acknowledgements.libraries_note')}
          </Text>

          <View
            className="rounded-2xl overflow-hidden bg-white dark:bg-[#1C1C1E]"
            style={styles.group}
            testID="ios-acknowledgements-licenses-card"
          >
            <Pressable
              className="flex-row items-center justify-between px-4"
              onPress={() => Linking.openURL(THIRD_PARTY_LICENSES_URL)}
              style={styles.row}
            >
              <Text
                className="font-medium text-neutral-900 dark:text-white"
                style={styles.rowLabel}
              >
                {t('acknowledgements.full_licenses')}
              </Text>
              <SymbolView
                name="arrow.up.right"
                resizeMode="scaleAspectFit"
                style={styles.trailingIcon}
                tintColor={chevronColor}
                weight="semibold"
              />
            </Pressable>
          </View>
          <Text
            className="text-neutral-500 dark:text-neutral-400"
            style={styles.footnote}
          >
            {t('acknowledgements.full_licenses_note')}
          </Text>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  group: {
    marginTop: 32,
  },
  introCard: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  row: {
    minHeight: 50,
    paddingVertical: 10,
  },
  rowDetail: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  rowLabel: {
    fontSize: 17,
    lineHeight: 22,
  },
  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  sectionHeader: {
    fontSize: 13,
    letterSpacing: 0.2,
    marginBottom: 8,
    marginTop: 32,
    paddingHorizontal: 16,
  },
  separator: {
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    left: 16,
    position: 'absolute',
    right: 16,
  },
  trailingIcon: {
    height: 14,
    width: 14,
  },
});
