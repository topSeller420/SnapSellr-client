import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { TabBarVisibilityProvider, useTabBarVisibility } from '@/context/tab-bar-visibility';

import { getSellerProfileAPI } from '@/apis/sellerController';
import type { Seller } from '@/types/schemas/sellerSchema';

function AnimatedTabBar(props: BottomTabBarProps) {
	const tabBar = useTabBarVisibility();
	const tabBarHeight = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{
			translateY: tabBar ? tabBar.isHidden.value * tabBarHeight.value : 0,
		}],
	}));

	return (
		<Animated.View
			style={[styles.tabBarWrapper, animatedStyle]}
			onLayout={(e) => { tabBarHeight.value = e.nativeEvent.layout.height; }}
		>
			<BottomTabBar {...props} />
		</Animated.View>
	);
}

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
		<TabBarVisibilityProvider>
			<Tabs
				tabBar={(props) => <AnimatedTabBar {...props} />}
				screenOptions={{
					tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
					headerShown: false,
					tabBarButton: HapticTab,
					tabBarStyle: {
						borderTopWidth: 0,
						// Semi-transparent so content shows through the tab bar area
						// and through the Android system navigation bar beneath it.
						backgroundColor: 'rgba(21, 23, 24, 0.82)',
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
					name="analytics"
					options={{
						title: 'Analytics',
						tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar" color={color} />,
					}}
				/>
				{/* <Tabs.Screen
					name="messages"
					options={{
						title: 'Messages',
						tabBarIcon: ({ color }) => <IconSymbol size={28} name="message" color={color} />,
					}}
				/> */}
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
		</TabBarVisibilityProvider>
	);
}

const styles = StyleSheet.create({
	tabBarWrapper: {
		// Absolutely positioned so the tab bar floats over content rather than
		// pushing it up. When translateY slides it off-screen, the space it
		// occupied reveals the scroll content behind it instead of leaving a gap.
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
	},
});
