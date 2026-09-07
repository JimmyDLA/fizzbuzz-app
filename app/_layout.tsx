import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Provider } from "react-redux";
import "../global.css";
import { store } from "../store/store";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            gestureEnabled: false,
          }}
        >
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
