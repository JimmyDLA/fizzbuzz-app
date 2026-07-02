import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AgeGateModal } from "../components/AgeGateModal";
import { RetroButton } from "../components/RetroButton";
import { colyseusService } from "../store/colyseusService";
import {
  setAgeVerified,
  setGameMode,
  setPlayerName,
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
    dispatch(setPlayerName(name));
    try {
      console.log("Hosting game...", name);

      const id = await colyseusService.connectAsHost(name);
      router.push({ pathname: "/lobby", params: { action: "host", code: id } });
    } catch (e: any) {
      alert(e.message || "Failed to create room.");
      console.log(e);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return alert("Please enter your name!");
    if (!roomCode.trim()) return alert("Please enter a room code!");
    dispatch(setPlayerName(name));
    try {
      const id = await colyseusService.connectAsJoin(roomCode, name);
      router.push({ pathname: "/lobby", params: { action: "join", code: id } });
    } catch (e: any) {
      alert(e.message || "Failed to join room.");
      console.log(e);
    }
  };

  const memphisShapes = [
    {
      type: "circle",
      color: "bg-yellow-400",
      size: 24,
      top: "10%",
      left: "8%",
    },
    { type: "circle", color: "bg-pink-400", size: 16, top: "75%", left: "82%" },
    {
      type: "square",
      color: "bg-cyan-400",
      size: 20,
      top: "22%",
      left: "84%",
      rotate: "45deg",
    },
    {
      type: "square",
      color: "bg-yellow-400",
      size: 18,
      top: "85%",
      left: "12%",
      rotate: "15deg",
    },
    {
      type: "triangle",
      color: "bg-pink-500",
      size: 24,
      top: "45%",
      left: "10%",
    },
    { type: "dots", color: "text-black", top: "12%", left: "68%" },
    { type: "dots", color: "text-black", top: "68%", left: "8%" },
  ];

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
            <Text className="font-black tracking-widest text-lg">
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
            borderColor: "#000000",
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
          className="bg-amber-50 justify-center px-6"
        >
          {renderBackgroundDebris()}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-center w-full max-w-sm mx-auto"
          >
            {gameMode && (
              <TouchableOpacity
                onPress={() => {
                  dispatch(setGameMode(null));
                  dispatch(setAgeVerified(false));
                }}
                style={{ position: "absolute", top: 50, right: 0, zIndex: 10 }}
              >
                <View className="bg-white border-3 border-black rounded-2xl px-3 py-1.5 flex-row items-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Text className="text-black font-black text-xs uppercase">
                    ⚙️ {gameMode === "drinking" ? "🍻 Drinking" : "🎉 Party"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <View className="items-center mb-10 mt-12">
              <View className="w-36 h-36 bg-yellow-400 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-2xl rotate-[-4deg] items-center justify-center mb-6">
                <Text className="text-6xl font-black text-black">FB</Text>
              </View>
              <Text
                className="text-6xl font-black text-black text-center mb-2 uppercase"
                style={{
                  textShadowColor: "#facc15",
                  textShadowOffset: { width: 4, height: 4 },
                  textShadowRadius: 0,
                }}
              >
                FizzBuzz
              </Text>
              <View className="bg-black py-1 px-4 rounded-xl border-2 border-black mt-1">
                <Text className="text-yellow-400 font-black tracking-widest text-xs uppercase text-center">
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
                className="bg-black"
              />

              {/* Card Body */}
              <View
                style={{
                  borderRadius: 24,
                  borderWidth: 4,
                  borderColor: "#000000",
                  padding: 20,
                }}
                className="bg-cyan-300"
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
                    <TextInput
                      style={{ borderWidth: 3, borderColor: "#000000" }}
                      className="bg-white rounded-2xl px-4 py-3 text-3xl font-black text-center text-black mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      placeholder="YOUR NAME"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      value={name}
                      onChangeText={setName}
                      maxLength={12}
                    />
                    {mode === "join" && (
                      <TextInput
                        style={{ borderWidth: 3, borderColor: "#000000" }}
                        className="bg-white rounded-2xl px-4 py-3 text-3xl font-black text-center text-black mb-6 tracking-[0.2em] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        placeholder="ROOM CODE"
                        placeholderTextColor="rgba(0,0,0,0.3)"
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
