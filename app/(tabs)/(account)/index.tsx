import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LinkButton } from '@/components/ui/linkButton';
import { Colors, Fonts } from '@/constants/theme';

export default function AccountIndex() {
	// set 'dark' as default theme for now
	// const colorScheme = useColorScheme();
	const colorScheme = 'dark';

	return (
		<ParallaxScrollView>
			<ThemedView style={styles.titleContainer}>
				<View style={styles.sellerImageContainer}>
					<Image
						source={require('@/assets/images/SnapSellr_icon.png')}
						style={styles.sellerImage}
					/>
					<ThemedText style={styles.sellerImageEdit}>
						Edit
					</ThemedText>
				</View>

				<View>
					<ThemedText style={styles.sellerName}>
						Username / name
					</ThemedText>
					<ThemedText style={styles.connectedPlatforms}>
						Connected platforms:
					</ThemedText>
				</View>
			</ThemedView>

			<LinkButton title="List settings" type="list.bullet" route="/listSettings"/>

			<LinkButton title="Points and subscription" type="creditcard" route="/pointsSubscriptions"/>

			<LinkButton title="Account settings" type="person" route="/accountSettings"/>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
  titleContainer: {
	flexDirection: 'row',
	alignItems: 'center',
	gap: 8,
	marginBottom: 24,
	paddingTop: 16,
  },
  sellerImageContainer: {
	marginRight: 12,
  },
  sellerImage: {
	borderRadius: 100,
	borderWidth: 2,
	borderColor: Colors.dark.logoColor,
	width: 75,
	height: 75,
	alignSelf: 'center',
  },
  sellerImageEdit: {
	fontSize: 10,
	fontWeight: 'bold',
	margin: "auto"
  },
  sellerName: {
	fontSize: 20,
	fontWeight: 'bold',
	fontFamily: Fonts.rounded,
	marginBottom: 4,
	marginTop: -20,
  },
  connectedPlatforms: {
	fontSize: 16,
  },
  listSettingsInfo: {
	fontSize: 12,
	marginBottom: 16,
  },
  listSettingsText: {
	fontSize: 14,
	fontWeight: 'bold',
  }
});
