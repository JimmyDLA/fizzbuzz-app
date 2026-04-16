import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <Stack screenOptions={{ headerShown: false, animation: 'fade', gestureEnabled: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="lobby" />
          <Stack.Screen name="chart" />
          <Stack.Screen name="game" />
        </Stack>
        <StatusBar style="auto" />
      </Provider>
    </GestureHandlerRootView>
  );
}
