import { createContext, useContext } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

type TabBarVisibilityContextValue = {
	isHidden: SharedValue<number>; // 0 = visible, 1 = hidden
};

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | null>(null);

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
	const isHidden = useSharedValue(0);
	return (
		<TabBarVisibilityContext.Provider value={{ isHidden }}>
			{children}
		</TabBarVisibilityContext.Provider>
	);
}

// Returns null if called outside the provider (safe for use in ParallaxScrollView
// which can be rendered outside the tab layout, e.g. in nested stacks).
export function useTabBarVisibility(): TabBarVisibilityContextValue | null {
	return useContext(TabBarVisibilityContext);
}
