import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SETTINGS_DARK_BACKGROUND } from '@/constants/settings-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { resolveIconUrl } from '@/lib/api';
import { getIoniconsName } from '@/lib/iconName';
import { usePaymentMethodStore } from '@/store/usePaymentMethodStore';

export default function BillingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();
  const { methods } = usePaymentMethodStore();
  const router = useRouter();

  const backgroundColor = isDark ? SETTINGS_DARK_BACKGROUND : '#F2F2F7';
  const cardColor = isDark ? '#1C1C1E' : '#FFFFFF';

  return (
    <>
      <Stack.Screen
        options={{
          title: t('billing.title'),
          headerBackTitle: ' ',
          headerShadowVisible: false,
          headerStyle: { backgroundColor },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
          headerRight: () => (
            <Pressable
              accessibilityLabel={t('billing.add_method_title')}
              accessibilityRole="button"
              onPress={() => router.push('/add-payment-method')}
              style={styles.addButton}
            >
              <Ionicons name="add" size={26} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
          ),
        }}
      />

      <View style={[styles.screen, { backgroundColor }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {methods.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="card-outline"
                size={52}
                color={isDark ? '#3F3F46' : '#D4D4D8'}
              />
              <Text style={[styles.emptyText, { color: isDark ? '#52525B' : '#A1A1AA' }]}>
                {t('billing.empty')}
              </Text>
            </View>
          ) : (
            <View
              style={[styles.list, { backgroundColor: cardColor }]}
              testID="ios-billing-list"
            >
              {methods.map((method, index) => {
                const isLast = index === methods.length - 1;
                return (
                  <Pressable
                    accessibilityLabel={method.label}
                    accessibilityRole="button"
                    key={method.id}
                    onPress={() => router.push({
                      pathname: '/settings/payment-method-detail',
                      params: { id: method.id },
                    })}
                    style={styles.row}
                  >
                    <View style={styles.rowLeading}>
                      <View
                        style={[styles.iconContainer, { backgroundColor: `${method.color}20` }]}
                      >
                        {method.iconUri ? (
                          <Image
                            source={{ uri: resolveIconUrl(method.iconUri) }}
                            style={styles.iconImage}
                          />
                        ) : (
                          <Ionicons
                            name={getIoniconsName(method.iconName)}
                            size={20}
                            color={method.color}
                          />
                        )}
                      </View>
                      <View style={styles.labels}>
                        <Text
                          numberOfLines={1}
                          style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}
                        >
                          {method.label}
                        </Text>
                        {method.memo ? (
                          <Text
                            numberOfLines={1}
                            style={[styles.memo, { color: isDark ? '#8E8E93' : '#6B7280' }]}
                          >
                            {method.memo}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />

                    {!isLast ? (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.separator,
                          {
                            backgroundColor: isDark
                              ? 'rgba(84, 84, 88, 0.65)'
                              : 'rgba(60, 60, 67, 0.29)',
                          },
                        ]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  addButton: {
    marginRight: 4,
    padding: 4,
  },
  list: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: 16,
  },
  rowLeading: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: 12,
    minWidth: 0,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  iconImage: {
    borderRadius: 8,
    height: 32,
    width: 32,
  },
  labels: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 21,
  },
  memo: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  separator: {
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    left: 16,
    position: 'absolute',
    right: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
