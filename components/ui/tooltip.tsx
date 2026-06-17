import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import React, { PropsWithChildren, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps extends PropsWithChildren {
  /**
   * The content to display inside the tooltip
   */
  content: string | React.ReactNode;
  /**
   * Position of the tooltip relative to the trigger element
   * @default 'top'
   */
  position?: TooltipPosition;
  /**
   * Delay in milliseconds before showing the tooltip
   * @default 0
   */
  delay?: number;
  /**
   * Whether the tooltip is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Custom style for the tooltip container
   */
  tooltipStyle?: ViewStyle;
  /**
   * Custom style for the tooltip content wrapper
   */
  contentStyle?: ViewStyle;
  /**
   * Maximum width of the tooltip
   * @default 200
   */
  maxWidth?: number;
  /**
   * Offset distance from the trigger element
   * @default 8
   */
  offset?: number;
}

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 0,
  disabled = false,
  tooltipStyle,
  contentStyle,
  maxWidth = 200,
  offset = 8,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipLayout, setTooltipLayout] = useState({ width: 0, height: 0 });
  const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<View>(null);

  const scale = useSharedValue(0.8);

  // set 'dark' as default theme for now
	// const colorScheme = useColorScheme();
	const colorScheme = 'dark';

  const handleTriggerLayout = (event: LayoutChangeEvent) => {
    triggerRef.current?.measure((fx, fy, fwidth, fheight, px, py) => {
      setTriggerLayout({ x: px, y: py, width: fwidth, height: fheight });
    });
  };

  const handleTooltipLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setTooltipLayout({ width, height });
  };

  const toggleTooltip = () => {
    if (disabled) return;
    
    // Measure trigger position before showing
    if (!isVisible) {
      triggerRef.current?.measure((fx, fy, fwidth, fheight, px, py) => {
        setTriggerLayout({ x: px, y: py, width: fwidth, height: fheight });
        setTimeout(() => {
          setIsVisible(true);
          scale.value = withSpring(1, { damping: 110, stiffness: 230 });
        }, delay);
      });
    } else {
      hideTooltip();
    }
  };

  const hideTooltip = () => {
    if (!isVisible) return;
    scale.value = withTiming(0.8, { duration: 150 });
    setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getTooltipPosition = (): ViewStyle => {
    const { x, y, width: triggerWidth, height: triggerHeight } = triggerLayout;
    const { width: tooltipWidth } = tooltipLayout;

    // Calculate horizontal centering
    const estimatedWidth = tooltipWidth || maxWidth;
    const leftOffset = triggerWidth > 0 
      ? x + (triggerWidth - estimatedWidth) / 2
      : x;

    switch (position) {
      case 'top':
        return {
          position: 'absolute',
          top: y - (tooltipLayout.height || 50) - offset,
          left: leftOffset,
        };
      case 'bottom':
        return {
          position: 'absolute',
          top: y + triggerHeight + offset,
          left: leftOffset,
        };
      case 'left':
        return {
          position: 'absolute',
          top: y + (triggerHeight - (tooltipLayout.height || 50)) / 2,
          left: x - estimatedWidth - offset,
        };
      case 'right':
        return {
          position: 'absolute',
          top: y + (triggerHeight - (tooltipLayout.height || 50)) / 2,
          left: x + triggerWidth + offset,
        };
      default:
        return {
          position: 'absolute',
          top: y - (tooltipLayout.height || 50) - offset,
          left: leftOffset,
        };
    }
  };

  const getArrowPosition = (): ViewStyle => {
    const arrowSize = 6;
    const baseStyle: ViewStyle = {
      position: 'absolute',
      width: 0,
      height: 0,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          bottom: -arrowSize,
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: Colors[colorScheme].tooltip.border,
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: -arrowSize,
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: Colors[colorScheme].tooltip.border,
        };
      case 'left':
        return {
          ...baseStyle,
          right: -arrowSize,
          top: '50%',
          marginTop: -arrowSize,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: Colors[colorScheme].tooltip.border,
        };
      case 'right':
        return {
          ...baseStyle,
          left: -arrowSize,
          top: '50%',
          marginTop: -arrowSize,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: Colors[colorScheme].tooltip.border,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <>
      <View style={styles.container} collapsable={false}>
        <Pressable
          onPress={toggleTooltip}
          disabled={disabled}
          hitSlop={8}
          style={styles.trigger}>
          <View
            ref={triggerRef}
            onLayout={handleTriggerLayout}
            collapsable={false}
            style={styles.triggerWrapper}>
            {children}
          </View>
        </Pressable>
      </View>

      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={hideTooltip}
        statusBarTranslucent>
        <Pressable style={styles.modalContainer} onPress={hideTooltip}>
          <Animated.View
            style={[
              styles.tooltip,
              getTooltipPosition(),
              animatedStyle,
              { maxWidth },
              tooltipStyle,
            ]}
            onLayout={handleTooltipLayout}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}>
            <ThemedView style={[styles.tooltipContent, contentStyle]}>
              {typeof content === 'string' ? (
                <ThemedText style={styles.tooltipText}>{content}</ThemedText>
              ) : (
                content
              )}
            </ThemedView>
            <View style={[styles.arrow, getArrowPosition()]} />
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  triggerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trigger: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tooltip: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark.tooltip.background,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  tooltipContent: {
    backgroundColor: Colors.dark.tooltip.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.dark.tooltip.border,
  },
  tooltipText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.dark.tooltip.text,
    textAlign: 'center',
  },
  arrow: {
    position: 'absolute',
  },
});
