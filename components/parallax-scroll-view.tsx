import { StyleSheet } from 'react-native';
import Animated, {
	useAnimatedRef,
	useAnimatedScrollHandler,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { useTabBarVisibility } from '@/context/tab-bar-visibility';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ParallaxScrollView(props: any) {
	const backgroundColor = useThemeColor({}, 'background');
	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	const tabBar = useTabBarVisibility();
	const lastScrollY = useSharedValue(0);

	const scrollHandler = useAnimatedScrollHandler((event) => {
		const currentY = event.contentOffset.y;

		if (tabBar) {
			if (currentY <= 0) {
				// At the top — always show
				tabBar.isHidden.value = withTiming(0, { duration: 200 });
			} else if (currentY - lastScrollY.value > 8) {
				// Scrolling down — hide
				tabBar.isHidden.value = withTiming(1, { duration: 200 });
			} else if (lastScrollY.value - currentY > 8) {
				// Scrolling up — show
				tabBar.isHidden.value = withTiming(0, { duration: 200 });
			}
		}

		lastScrollY.value = currentY;
	});

	return (
		<Animated.ScrollView
			ref={scrollRef}
			style={{ backgroundColor, flex: 1 }}
			scrollEventThrottle={16}
			onScroll={scrollHandler}
		>
			<ThemedView style={props.style != null ? props.style : styles.content}>
				{props.children}
			</ThemedView>
		</Animated.ScrollView>
	);
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingTop: 64,
		paddingRight: 32,
		paddingBottom: 32,
		paddingLeft: 32,
		gap: 16,
		overflow: 'hidden',
	},
});
