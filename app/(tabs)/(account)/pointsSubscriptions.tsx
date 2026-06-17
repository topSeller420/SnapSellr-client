import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function PointsSubscriptions() {
	return (
		<ParallaxScrollView>
			<ThemedView>
				<ThemedText>
					Current points: 0 'Include add icon here'
				</ThemedText>
				<ThemedText>
					Subscription: 'Inactive/Active'
				</ThemedText>
				<ThemedText>
					Subscription renewal date: 'Date'
				</ThemedText>
			</ThemedView>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
  listSettingsInfo: {
	fontSize: 12,
	marginBottom: 16,
  },
  listSettingsText: {
	fontSize: 14,
	fontWeight: 'bold',
  }
});