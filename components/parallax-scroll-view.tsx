import { StyleSheet } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';



export default function ParallaxScrollView(props: any) {
  const backgroundColor = useThemeColor({}, 'background');
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor, flex: 1 }}
      scrollEventThrottle={16}>
      <ThemedView style={props.style != null ? props.style :  styles.content}>
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
