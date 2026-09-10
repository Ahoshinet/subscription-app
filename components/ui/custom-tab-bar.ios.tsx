import { Button, GlassEffectContainer, HStack, Host, Image } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonStyle,
  frame,
  glassEffect,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CustomTabBarProps } from '@/components/ui/tab-bar-types';

const TAB_ICONS = {
  index: { active: 'house.fill', inactive: 'house', label: 'Home' },
  calendar: { active: 'calendar', inactive: 'calendar', label: 'Calendar' },
  settings: { active: 'gearshape.fill', inactive: 'gearshape', label: 'Settings' },
} as const;

export default function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const nativeColorScheme = colorScheme === 'dark' || colorScheme === 'light' ? colorScheme : undefined;

  return (
    <View style={styles.shadowContainer}>
      <View style={styles.innerContainer}>
        <BlurView intensity={55} tint={nativeColorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <Host colorScheme={nativeColorScheme} style={styles.host}>
          <GlassEffectContainer spacing={8}>
            <HStack
              spacing={0}
              modifiers={[
                frame({ maxWidth: 1000, height: 60 }),
                padding({ horizontal: 6 }),
                glassEffect({
                  glass: { variant: 'regular', interactive: true },
                  shape: 'capsule',
                }),
              ]}
            >
              {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const tab = TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? TAB_ICONS.index;

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
                  <Button
                    key={route.key}
                    onPress={onPress}
                    modifiers={[
                      buttonStyle('plain'),
                      frame({ width: 72, height: 48 }),
                      accessibilityLabel(tab.label),
                    ]}
                  >
                    <Image
                      systemName={isFocused ? tab.active : tab.inactive}
                      size={23}
                      color={isFocused ? '#007AFF' : '#8E8E93'}
                    />
                  </Button>
                );
              })}
            </HStack>
          </GlassEffectContainer>
        </Host>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 60,
    marginHorizontal: 20,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  innerContainer: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.25)',
  },
  host: {
    flex: 1,
  },
});
