import { Tabs } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text } from 'react-native';

/**
 * Custom Floating Bottom Tab Bar (V1: Expo BlurView)
 * Future expansion (V2): Platform.select allowing iOS Liquid Glass or OS-native equivalents
 */
function CustomTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.tabBarShadowContainer}>
      <View style={styles.tabBarInnerContainer} className="border border-neutral-200/50 dark:border-white/10">
        <BlurView
          intensity={isDark ? 50 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.tabBar,
            { backgroundColor: isDark ? 'rgba(30, 30, 32, 0.45)' : 'rgba(255, 255, 255, 0.65)' }
          ]}
        >
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            let iconName: keyof typeof Ionicons.glyphMap = 'help';
            if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
            if (route.name === 'calendar') iconName = isFocused ? 'calendar' : 'calendar-outline';
            if (route.name === 'settings') iconName = isFocused ? 'settings' : 'settings-outline';

            const color = isFocused
              ? (isDark ? '#FFFFFF' : '#000000')
              : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)');

            const iconSize = 28;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.tabItem}
              >
                <Ionicons name={iconName} size={iconSize} color={color} />
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="calendar" />
        <Tabs.Screen name="settings" />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // Outer container: Handles positioning and drop shadow (must NOT overflow: hidden)
  tabBarShadowContainer: {
    position: 'absolute',
    bottom: 20,
    marginHorizontal: 20,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 100,

    // Drop shadow (works because overflow is visible here)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  // Inner container: Enforces the border radius and strictly clips the BlurView
  tabBarInnerContainer: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
  },
  // The glassmorphism layer itself
  tabBar: {
    ...StyleSheet.absoluteFill,
    borderRadius: 30,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  addButtonWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContainer: {
    flex: 1,
  },
});
