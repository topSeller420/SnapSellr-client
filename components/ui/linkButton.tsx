import { Href, useRouter } from 'expo-router';
import { PropsWithChildren } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export function LinkButton({ children, title, type, route }: PropsWithChildren & { title: string, type?: IconSymbolName, route: string }) {
	// set default color theme to dark for now
	// const theme = useColorScheme() ?? 'light';
	const theme = 'dark';
	const router = useRouter();


	return (
		<ThemedView>
			<TouchableOpacity
				style={styles.heading}
				onPress={() => {
					router.push(route as Href);
				}}
				activeOpacity={0.8}>

				{
				type != null ?
				(
					<View style={styles.collapsibleMenu}>
					<IconSymbol
						name={type}
						size={18}
						weight="medium"
						color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
						style={{ marginTop: 3.5 }}
					/>

					<ThemedText type="defaultSemiBold">{title}</ThemedText>
					</View>
				)
				: (
					<ThemedText type="defaultSemiBold">{title}</ThemedText>
				)
				}

				<IconSymbol
					name="chevron.right"
					size={18}
					weight="medium"
					color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
					style={{ marginTop: 3.5 }}
				/>
			</TouchableOpacity>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
  heading: {
	borderColor: Colors.dark.border,
	borderWidth: 1,
	borderRadius: 16,

	paddingVertical: 12,
	paddingHorizontal: 16,
	display: 'flex',
	justifyContent: 'space-between',
	flexDirection: 'row',
	gap: 6,
  },
  content: {
	marginTop: 6,
	marginLeft: 24,
  },
  collapsibleMenu: {
	display: 'flex',
	flexDirection: 'row',
	gap: 12
  }
});
