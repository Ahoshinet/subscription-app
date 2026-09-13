import { Tabs } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomTabBar from '@/components/ui/custom-tab-bar';

export default function TabLayout() {
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
        <Tabs.Screen name="search" options={{ href: null }} />
      </Tabs>
    </GestureHandlerRootView>
  );
}
