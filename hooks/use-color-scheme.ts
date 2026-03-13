import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useColorScheme() {
    const systemColorScheme = useRNColorScheme();
    const { theme } = useSettingsStore();

    if (theme === 'system') return systemColorScheme;
    return theme;
}
