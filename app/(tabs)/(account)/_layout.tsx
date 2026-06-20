import { Stack } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/theme';


export default function AccountLayout() {
	// set 'dark' as default theme for now
	// const colorScheme = useColorScheme();
	const colorScheme = 'dark';

	return (
		<Stack screenOptions={{
			headerShown: false,
			animation: "slide_from_right"}}>

			<Stack.Screen name="index" options={{
				headerShown: false, title: "Account", headerStyle: {backgroundColor: Colors[colorScheme].background} 
			}} />

			<Stack.Screen name="listSettings" options={{ 
				headerShown: true, title: "List Settings", headerStyle: {backgroundColor: Colors[colorScheme].background}  
			}} />

			<Stack.Screen name="pointsSubscriptions" options={{ 
				headerShown: true, title: "Points and Subscriptions", headerStyle: {backgroundColor: Colors[colorScheme].background}  
			}} />

			<Stack.Screen name="accountSettings" options={{
				headerShown: true, title: "Account Settings", headerStyle: {backgroundColor: Colors[colorScheme].background}
			}} />

		</Stack>
	);
}