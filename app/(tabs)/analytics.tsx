import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AnalyticsScreen() {
	return (
		<ParallaxScrollView>
			<ThemedView>
				<ThemedText type="title">Analytics</ThemedText>
			</ThemedView>
		</ParallaxScrollView>
	);
}
