import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { store } from '@/redux/store';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // set 'dark' as default theme for now
  // const colorScheme = useColorScheme();
  const colorScheme = 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false
              , animation: "slide_from_left"
            }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal'
              , animation: "slide_from_left"
            }} />
          </Stack>

          <StatusBar style="auto" />
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
