import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function MessagesScreen() {
	return (
		<ParallaxScrollView>
			<ThemedView>
				<ThemedText type="title">Messages</ThemedText>
			</ThemedView>
		</ParallaxScrollView>
	);
}
