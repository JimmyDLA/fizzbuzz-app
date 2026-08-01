import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Returns true if the app is currently running inside the Expo Go app client.
 * Returns false if running inside a custom Expo Development Build or Standalone app.
 */
export const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
