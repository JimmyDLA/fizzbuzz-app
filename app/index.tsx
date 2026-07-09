import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AgeGateModal } from "../components/AgeGateModal";
import { RetroButton } from "../components/RetroButton";
import { RetroInput } from "../components/RetroInput";
import { memphisShapes } from "../constants/theme";
import { colyseusService } from "../store/colyseusService";
import {
  setAgeVerified,
  setGameMode,
  setPlayerName,
  toggleTheme,
} from "../store/lobbySlice";
import { RootState } from "../store/store";

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState<"home" | "host" | "join">("home");

  const { gameMode, ageVerified } = useSelector(
    (state: RootState) => state.lobby,
  );
  const showAgeGate =
    gameMode === null || (gameMode === "drinking" && !ageVerified);

  const handleHost = async () => {
    if (!name.trim()) return alert("Please enter your name!");
    dispatch(setPlayerName(name.trim()));
    try {
      console.log("Hosting game...", name);

      const id = await colyseusService.connectAsHost(name.trim());
      router.push({ pathname: "/lobby", params: { action: "host", code: id } });
    } catch (e: any) {
      alert(e.message || "Failed to create room.");
      console.log(e);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return alert("Please enter your name!");
    if (!roomCode.trim()) return alert("Please enter a room code!");
    dispatch(setPlayerName(name.trim()));
    try {
      const id = await colyseusService.connectAsJoin(roomCode, name.trim());
      router.push({ pathname: "/lobby", params: { action: "join", code: id } });
    } catch (e: any) {
      alert(e.message || "Failed to join room.");
      console.log(e);
    }
  };

  const theme = useSelector((state: RootState) => state.lobby.theme) || "light";
  const isDark = theme === "dark";

  const renderBackgroundDebris = () => {
    return memphisShapes.map((shape, i) => {
      const transform = shape.rotate ? [{ rotate: shape.rotate }] : [];
      if (shape.type === "dots") {
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              top: shape.top as any,
              left: shape.left as any,
              opacity: 0.15,
            }}
          >
            <Text
              className={`font-black tracking-widest ${isDark ? "text-zinc-700" : "text-black"} text-lg`}
            >
              •••••{"\n"}•••••{"\n"}•••••
            </Text>
          </View>
        );
      }
      return (
        <View
          key={i}
          style={{
            position: "absolute",
            top: shape.top as any,
            left: shape.left as any,
            width: shape.size,
            height: shape.size,
            borderRadius: shape.type === "circle" ? 999 : 4,
            borderWidth: 2,
            borderColor: isDark ? "#ffffff" : "#000000",
            transform: transform as any,
            opacity: 0.4,
          }}
          className={shape.color}
        />
      );
    });
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={StyleSheet.absoluteFillObject}
          className={`${isDark ? "bg-zinc-950" : "bg-amber-50"} justify-center px-6`}
        >
          {renderBackgroundDebris()}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-center w-full max-w-sm mx-auto"
          >
            {/* Theme Toggle Button */}
            <TouchableOpacity
              onPress={() => dispatch(toggleTheme())}
              style={{ position: "absolute", top: 50, left: 0, zIndex: 10 }}
            >
              <View
                className={`${isDark ? "bg-zinc-800 border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]" : "bg-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"} border-3 rounded-2xl px-3 py-1.5 flex-row items-center`}
              >
                <Text
                  className={`${isDark ? "text-white" : "text-black"} font-black text-xs uppercase`}
                >
                  {isDark ? "🌙 DARK" : "☀️ LIGHT"}
                </Text>
              </View>
            </TouchableOpacity>

            {gameMode && (
              <TouchableOpacity
                onPress={() => {
                  dispatch(setGameMode(null));
                  dispatch(setAgeVerified(false));
                }}
                style={{ position: "absolute", top: 50, right: 0, zIndex: 10 }}
              >
                <View
                  className={`${isDark ? "bg-zinc-800 border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]" : "bg-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"} border-3 rounded-2xl px-3 py-1.5 flex-row items-center`}
                >
                  <Text
                    className={`${isDark ? "text-white" : "text-black"} font-black text-xs uppercase`}
                  >
                    ⚙️ {gameMode === "drinking" ? "Drinking" : "Party"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <View className="items-center mb-10 mt-16">
              <View
                className={`w-36 h-36 bg-yellow-400 border-4 ${isDark ? "border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]" : "border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"} rounded-2xl rotate-[-4deg] items-center justify-center mb-6`}
              >
                <Text className="text-6xl font-black text-black">FB</Text>
              </View>
              <Text
                className={`text-6xl font-black ${isDark ? "text-white" : "text-black"} text-center mb-2 uppercase`}
                style={{
                  textShadowColor: isDark ? "#ec4899" : "#facc15",
                  textShadowOffset: { width: 4, height: 4 },
                  textShadowRadius: 0,
                }}
              >
                FizzBuzz
              </Text>
              <View
                className={`py-1 px-4 rounded-xl border-2 ${isDark ? "border-white bg-zinc-800" : "border-black bg-black"} mt-1`}
              >
                <Text
                  className={`font-black tracking-widest text-xs uppercase text-center ${isDark ? "text-white" : "text-yellow-400"}`}
                >
                  {gameMode === "drinking"
                    ? "MINI DRINKING GAMES"
                    : "MINI PARTY GAMES"}
                </Text>
              </View>
            </View>

            <View className="w-full relative">
              {/* Card Shadow */}
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: 24, top: 8, left: 8 },
                ]}
                className={isDark ? "bg-white" : "bg-black"}
              />

              {/* Card Body */}
              <View
                style={{
                  borderRadius: 24,
                  borderWidth: 4,
                  borderColor: isDark ? "#ffffff" : "#000000",
                  padding: 20,
                }}
                className={
                  gameMode === "drinking" ? "bg-pink-300" : "bg-cyan-300"
                }
              >
                {mode === "home" ? (
                  <View>
                    <RetroButton
                      title="HOST GAME"
                      variant="primary"
                      onPress={() => setMode("host")}
                    />
                    <Text className="text-black text-center text-xl font-black mb-4 mt-2 opacity-70">
                      — OR —
                    </Text>
                    <RetroButton
                      title="JOIN GAME"
                      variant="secondary"
                      onPress={() => setMode("join")}
                    />
                  </View>
                ) : (
                  <View>
                    <RetroInput
                      placeholder="YOUR NAME"
                      value={name}
                      onChangeText={setName}
                      maxLength={12}
                    />
                    {mode === "join" && (
                      <RetroInput
                        className="tracking-[0.2em]"
                        placeholder="ROOM CODE"
                        value={roomCode}
                        onChangeText={(text) =>
                          setRoomCode(text.replace(/[^0-9]/g, ""))
                        }
                        maxLength={4}
                        keyboardType="number-pad"
                      />
                    )}
                    <RetroButton
                      title={mode === "host" ? "HOST" : "JOIN"}
                      variant="success"
                      onPress={mode === "host" ? handleHost : handleJoin}
                    />
                    <RetroButton
                      title="BACK"
                      variant="danger"
                      onPress={() => setMode("home")}
                    />
                  </View>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
      {showAgeGate && <AgeGateModal />}
    </>
  );
}
