import React, { useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, useColorScheme, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Component for a section header
const SectionHeader = ({ title }: { title: string }) => (
  <Text className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ml-4 mb-2 mt-6">
    {title}
  </Text>
);

// Component for a single settings row
const SettingsRow = ({
  icon,
  title,
  value,
  type = 'link',
  isFirst = false,
  isLast = false,
  onPress,
  toggleValue = false,
  onToggle
}: any) => {
  return (
    <Pressable
      onPress={onPress}
      className={`
        bg-white dark:bg-[#1C1C1E] flex-row items-center justify-between p-4
        ${!isLast ? 'border-b border-neutral-100 dark:border-white/5' : ''}
        ${isFirst ? 'rounded-t-2xl' : ''}
        ${isLast ? 'rounded-b-2xl' : ''}
      `}
    >
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/10 items-center justify-center mr-3">
          <Ionicons name={icon} size={18} color="#808080" />
        </View>
        <Text className="text-base font-medium text-neutral-900 dark:text-white">
          {title}
        </Text>
      </View>

      <View className="flex-row items-center">
        {value && (
          <Text className="text-base text-neutral-500 dark:text-neutral-400 mr-2">
            {value}
          </Text>
        )}

        {type === 'link' && (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}

        {type === 'toggle' && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: '#3f3f46', true: '#3B82F6' }}
            thumbColor={'#ffffff'}
          />
        )}
      </View>
    </Pressable>
  );
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Language Picker State
  const [language, setLanguage] = useState('English');
  const [showLangModal, setShowLangModal] = useState(false);

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    setShowLangModal(false);
  };

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-black pt-16">
      {/* Header */}
      <View className="px-6 mb-4">
        <Text className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }} // padding for bottom tab bar
      >

        {/* Account Section */}
        <SectionHeader title="Account" />
        <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10">
          <SettingsRow
            isFirst
            icon="person-outline"
            title="Profile"
            value="user@example.com"
          />
          <SettingsRow
            icon="card-outline"
            title="Billing Methods"
          />
          <SettingsRow
            isLast
            icon="lock-closed-outline"
            title="Change Password"
          />
        </View>

        {/* Preferences Section */}
        <SectionHeader title="Preferences" />
        <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10">
          <SettingsRow
            isFirst
            type="toggle"
            icon="moon-outline"
            title="Dark Mode"
            toggleValue={isDark}
            onToggle={() => { }} // Hooked up to system theme usually or custom provider
          />
          <SettingsRow
            icon="language-outline"
            title="Language"
            value={language}
            onPress={() => setShowLangModal(true)}
          />
          <SettingsRow
            type="toggle"
            icon="notifications-outline"
            title="Push Notifications"
            toggleValue={true}
          />
          <SettingsRow
            isLast
            icon="cash-outline"
            title="Default Currency"
            value="JPY (¥)"
          />
        </View>

        {/* App Section */}
        <SectionHeader title="App Info" />
        <View className="rounded-2xl overflow-hidden shadow-sm shadow-neutral-200/50 dark:shadow-none border border-neutral-200/50 dark:border-white/10 mb-6">
          <SettingsRow
            isFirst
            icon="help-circle-outline"
            title="Help & Support"
          />
          <SettingsRow
            icon="document-text-outline"
            title="Terms of Service"
          />
          <SettingsRow
            isLast
            icon="information-circle-outline"
            title="Version"
            value="1.0.0"
            type="info"
          />
        </View>

        {/* Logout Button */}
        <Pressable className="mt-4 mb-8 items-center py-4 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50">
          <Text className="text-red-600 dark:text-red-400 font-bold text-base">
            Log Out
          </Text>
        </Pressable>

      </ScrollView>

      {/* Language Selection Modal (Action Sheet Style) */}
      <Modal
        visible={showLangModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setShowLangModal(false)}
        >
          <Pressable
            className="bg-white dark:bg-[#1C1C1E] m-4 rounded-2xl overflow-hidden shadow-lg border border-neutral-200 dark:border-white/10 pb-4"
            onPress={(e) => e.stopPropagation()} // Prevent tap-through closing
          >
            <View className="items-center py-4 border-b border-neutral-100 dark:border-white/5">
              <Text className="text-sm font-bold text-neutral-500 dark:text-neutral-400">
                Select Language
              </Text>
            </View>

            <Pressable
              className={`p-4 flex-row items-center justify-between border-b border-neutral-100 dark:border-white/5 ${language === 'English' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onPress={() => selectLanguage('English')}
            >
              <Text className={`text-lg ${language === 'English' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-neutral-900 dark:text-white font-medium'}`}>
                English
              </Text>
              {language === 'English' && <Ionicons name="checkmark" size={24} color="#3B82F6" />}
            </Pressable>

            <Pressable
              className={`p-4 flex-row items-center justify-between ${language === '日本語' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onPress={() => selectLanguage('日本語')}
            >
              <Text className={`text-lg ${language === '日本語' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-neutral-900 dark:text-white font-medium'}`}>
                日本語
              </Text>
              {language === '日本語' && <Ionicons name="checkmark" size={24} color="#3B82F6" />}
            </Pressable>
          </Pressable>

          <Pressable
            className="bg-white dark:bg-[#1C1C1E] rounded-2xl mx-4 mb-8 overflow-hidden items-center justify-center p-4 border border-neutral-200 dark:border-white/10 shadow-lg"
            onPress={() => setShowLangModal(false)}
          >
            <Text className="text-lg font-bold text-neutral-900 dark:text-white">
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}
