import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  'use no memo';
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();
  const theme = useSettingsStore((state) => state.theme);

  if (hasHydrated) {
    return theme === 'system' ? colorScheme : theme;
  }

  return 'light';
}
