import { Tabs } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Text } from 'react-native';

/**
 * Custom Floating Bottom Tab Bar (V1: Expo BlurView)
 * Future expansion (V2): Platform.select allowing iOS Liquid Glass or OS-native equivalents
 */
function CustomTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.tabBarContainer} className="px-6 pb-6">
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.tabBar,
          { backgroundColor: isDark ? 'rgba(30, 30, 32, 0.65)' : 'rgba(255, 255, 255, 0.75)' }
        ]}
        className="rounded-full flex-row justify-around items-center border border-neutral-200/50 dark:border-white/10 shadow-lg"
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          let iconName: keyof typeof Ionicons.glyphMap = 'help';
          if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
          // The 'add' route is technically a dummy route just to trigger the bottom sheet
          if (route.name === 'add') iconName = 'add-circle';
          if (route.name === 'settings') iconName = isFocused ? 'settings' : 'settings-outline';

          const color = isFocused
            ? (isDark ? '#FFFFFF' : '#000000')
            : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)');

          // Highlight the 'Add' button specially
          const isAddBtn = route.name === 'add';
          const iconSize = isAddBtn ? 42 : 28;
          const finalColor = isAddBtn ? '#3B82F6' : color; // Blue accent for Add

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
              className={isAddBtn ? '-mt-6' : ''} // Make the add button float slightly higher
            >
              <Ionicons name={iconName} size={iconSize} color={finalColor} />
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Handle snapping BottomSheet
  const handleOpenSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />

        {/* Dummy Add Route - intercepts tabPress to open modal instead of navigating */}
        <Tabs.Screen
          name="add"
          listeners={{
            tabPress: (e) => {
              // Prevent default navigation
              e.preventDefault();
              // Open Bottom Sheet
              handleOpenSheet();
            },
          }}
        />

        <Tabs.Screen name="settings" />
      </Tabs>

      {/* Global Add Item Bottom Sheet Placeholder */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // Closed by default
        snapPoints={['50%', '90%']}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#ffffff50' : '#00000050',
        }}
      >
        <BottomSheetView style={styles.sheetContainer} className="p-6">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Add Subscription
          </Text>
          <Text className="text-neutral-500 dark:text-neutral-400">
            This is a placeholder for the future subscription creation form.
          </Text>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 100, // Ensure it floats above content
  },
  tabBar: {
    height: 70,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContainer: {
    flex: 1,
  },
});
