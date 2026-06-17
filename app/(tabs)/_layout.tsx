import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

import { getSellerProfileAPI } from '@/apis/sellerController';
import type { Seller } from '@/types/schemas/sellerSchema';

export default function TabLayout() {
  // set 'dark' as default theme for now
  // const colorScheme = useColorScheme();
  const colorScheme = 'dark';

  useEffect(() => {
    // Get account information and store in filesystem storage
    syncAccountInfo();
  }, []);

  function syncAccountInfo() {
    // Sync account information with backend
    // 1.) First check if all important fields are present in local storage (email, username, profile picture, etc.)
    const pathVariables = {
      id: "6228640b-e52f-4e39-8edd-65adb1615c20"
    };
    getSellerProfileAPI(pathVariables, (resp: Seller) => {
      console.log("Seller profile response: ", resp);
    });

    // 2.) If any fields are missing, fetch account information from backend and update local storage
    // 3.) If all fields are present, do nothing
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: Colors[colorScheme].background,
          height: 60,
        },
      }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="archivebox" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(account)"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle" color={color} />,
        }}
      />
    </Tabs>
  );
}
