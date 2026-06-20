import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function AccountSettingsLayout() {
	const colorScheme = 'dark';

	return (
		<Stack
			screenOptions={{
				animation: 'slide_from_right',
				headerStyle: { backgroundColor: Colors[colorScheme].background },
				headerTintColor: Colors[colorScheme].text,
			}}
		>
			<Stack.Screen name="index" options={{ 
				headerShown: false, title: 'Account Settings' 
			}} />
			<Stack.Screen name="termsNCondition" options={{ title: 'Terms and Conditions' }} />
			<Stack.Screen name="privacyPolicy" options={{ title: 'Privacy Policy' }} />
		</Stack>
	);
}
