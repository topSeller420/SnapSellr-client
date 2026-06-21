import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function AccountSettingsLayout() {
	const colorScheme = 'dark';
	const router = useRouter();

	return (
		<Stack
			screenOptions={{
				animation: 'slide_from_right',
				headerStyle: { backgroundColor: Colors[colorScheme].background },
				headerTintColor: Colors[colorScheme].text,
			}}
		>
			{/*
			 * The index screen is the root of this nested Stack, so React Navigation
			 * never auto-generates a back button for it. On iOS that means no header
			 * back arrow and no swipe-back gesture — both work on Android via the
			 * hardware back button, but iOS needs an explicit headerLeft.
			 */}
			<Stack.Screen
				name="index"
				options={{
					title: 'Account Settings',
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => router.back()}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<IconSymbol
								name="chevron.left"
								size={20}
								weight="medium"
								color={Colors[colorScheme].text}
							/>
						</TouchableOpacity>
					),
				}}
			/>
			<Stack.Screen name="termsNCondition" options={{ title: 'Terms and Conditions' }} />
			<Stack.Screen name="privacyPolicy" options={{ title: 'Privacy Policy' }} />
		</Stack>
	);
}
