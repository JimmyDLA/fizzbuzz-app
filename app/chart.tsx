import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { PracticeModal } from "../components/PracticeModal";
import { RetroButton } from "../components/RetroButton";
import { RetroPlayerCard } from "../components/RetroPlayerCard";
import { colyseusService } from "../store/colyseusService";
import { RootState } from "../store/store";

const TYPES = ["1v1", "2v2", "BR"];
const CATS = [
  "Tapping Race",
  "Math Problem",
  "Hot Potato",
  "Lumber Cut",
  "Trivia",
  "Rock Paper Scissors",
  "Cyclone",
  "Balloon Inflate",
  "Simon Says",
  "Scrabble",
  "Screen Painting",
  "Perfection",
];

export default function ChartScreen() {
  const {
    roomId,
    playerName,
    players: reduxPlayers,
    gamePhase,
    timer,
    currentGameType,
    currentCategory,
    selectedPlayers,
  } = useSelector((state: RootState) => state.lobby);

  const players: any[] = reduxPlayers.length > 0 ? reduxPlayers : [];
  const selectedPlayersList: any[] = selectedPlayers || [];

  const myPlayer = players.find((p: any) => p.name === playerName);
  const isReady = myPlayer?.isReady || false;
  const amISelected = selectedPlayersList.includes(myPlayer?.id) || false;

  const [displayedType, setDisplayedType] = useState("?");
  const [displayedCategory, setDisplayedCategory] = useState("?");
  const [displayedPlayers, setDisplayedPlayers] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const hasSpunRef = useRef(false);
  const isLeavingRef = useRef(false);

  // Dev Modal State
  const [showDevModal, setShowDevModal] = useState(false);
  const [devType, setDevType] = useState(TYPES[0]);
  const [devCategory, setDevCategory] = useState(CATS[0]);
  const [devPlayers, setDevPlayers] = useState<string[]>([]);

  useEffect(() => {
    let interval: any;
    let timeout: any;
    let autoDismiss: any;

    if (gamePhase === "wheel" && !hasSpunRef.current) {
      hasSpunRef.current = true;
      setIsSpinning(true);
      setShowWheelModal(true);

      let requiredCount = 2;
      if (currentGameType === "1v1") requiredCount = 2;
      if (currentGameType === "2v2") requiredCount = 4;
      if (currentGameType === "BR") requiredCount = players.length;

      interval = setInterval(() => {
        setDisplayedType(TYPES[Math.floor(Math.random() * TYPES.length)]);
        setDisplayedCategory(CATS[Math.floor(Math.random() * CATS.length)]);

        const randomP = [...players]
          .sort(() => 0.5 - Math.random())
          .slice(0, requiredCount)
          .map((p) => p.id);
        setDisplayedPlayers(randomP);
      }, 100);

      timeout = setTimeout(() => {
        clearInterval(interval);
        setDisplayedType(currentGameType || "?");
        setDisplayedCategory(currentCategory || "?");
        setDisplayedPlayers(selectedPlayersList);
        setIsSpinning(false);
      }, 2000);
    } else if (gamePhase !== "wheel") {
      setShowWheelModal(false);
      hasSpunRef.current = false;
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(autoDismiss);
    };
  }, [
    gamePhase,
    currentGameType,
    currentCategory,
    selectedPlayers,
    players.length,
  ]);

  useEffect(() => {
    if (isLeavingRef.current) return;
    if (gamePhase === "lobby") {
      router.replace("/lobby");
    } else if (
      amISelected &&
      !isReady &&
      (gamePhase === "countdown" ||
        gamePhase === "playing" ||
        gamePhase === "resolution")
    ) {
      router.replace("/game");
    }
  }, [gamePhase, isReady, amISelected]);

  const handleReadyToggle = () => {
    colyseusService.sendReady(!isReady);
  };

  const handleLeaveGame = () => {
    Alert.alert(
      "Leave Game",
      "Are you sure you want to end the session? You will return to the home screen.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => {
            isLeavingRef.current = true;
            colyseusService.disconnect();
            router.replace("/" as any);
          },
        },
      ],
    );
  };

  const openDevModal = () => {
    setDevType(TYPES[0]);
    setDevCategory(CATS[0]);
    setDevPlayers([]);
    setShowDevModal(true);
  };

  const toggleDevPlayer = (id: string) => {
    if (devPlayers.includes(id)) {
      setDevPlayers(devPlayers.filter((p) => p !== id));
    } else {
      setDevPlayers([...devPlayers, id]);
    }
  };

  const handleDevCategoryChange = (c: string) => {
    setDevCategory(c);
    // Enforce 1v1 for RPS
    if (c === "Rock Paper Scissors") {
      setDevType("1v1");
    }
    // Enforce no 2v2 for Hot Potato
    if (c === "Hot Potato" && devType === "2v2") {
      setDevType("1v1");
    }
    if (c === "Screen Painting" && devType === "2v2") {
      setDevType("BR");
    }
  };

  const handleDevTypeChange = (t: string) => {
    if (devCategory === "Rock Paper Scissors" && t !== "1v1") {
      return; // RPS is strictly 1v1
    }
    if (devCategory === "Screen Painting" && t === "2v2") {
      return; // Screen Painting is 1v1 or BR
    }
    if (devCategory === "Hot Potato" && t === "2v2") {
      return; // Hot Potato doesn't do 2v2
    }
    setDevType(t);
  };

  const handleDevStart = () => {
    const isValid =
      devType === "1v1"
        ? devPlayers.length === 2
        : devType === "2v2"
          ? devPlayers.length === 4
          : devPlayers.length >= 2;

    if (!isValid)
      return alert(
        `Expected ${devType === "1v1" ? 2 : devType === "2v2" ? 4 : "2+"} players for this mode!`,
      );
    colyseusService.sendDevStart(devType, devCategory, devPlayers);
    setShowDevModal(false);
  };

  const memphisShapes = [
    {
      type: "circle",
      color: "bg-yellow-400",
      size: 24,
      top: "8%",
      left: "10%",
    },
    { type: "circle", color: "bg-pink-400", size: 16, top: "75%", left: "80%" },
    {
      type: "square",
      color: "bg-cyan-400",
      size: 20,
      top: "25%",
      left: "85%",
      rotate: "45deg",
    },
    {
      type: "square",
      color: "bg-yellow-400",
      size: 18,
      top: "82%",
      left: "15%",
      rotate: "15deg",
    },
    {
      type: "triangle",
      color: "bg-pink-500",
      size: 24,
      top: "48%",
      left: "8%",
    },
    { type: "dots", color: "text-black", top: "15%", left: "65%" },
    { type: "dots", color: "text-black", top: "65%", left: "12%" },
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
    <View
      style={StyleSheet.absoluteFillObject}
      className="bg-amber-50 justify-center pt-16"
    >
      {renderBackgroundDebris()}

      <View className="flex-row items-center justify-between mb-8 w-full px-6">
        <TouchableOpacity
          onPress={handleLeaveGame}
          style={{ width: 48, height: 48, position: "relative" }}
        >
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: 12, top: 3, left: 3 },
            ]}
            className="bg-black"
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: 12,
                borderWidth: 3,
                borderColor: "#000000",
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
            className="bg-pink-400"
          >
            <Text className="text-black font-black text-xl">X</Text>
          </View>
        </TouchableOpacity>

        <View className="flex-1 items-center mr-12">
          <Text
            className="text-black text-4xl font-black tracking-widest uppercase"
            style={{
              textShadowColor: "#facc15",
              textShadowOffset: { width: 3, height: 3 },
              textShadowRadius: 0,
            }}
          >
            Game Chart
          </Text>
          <View className="bg-black px-3 py-0.5 rounded-lg border-2 border-black mt-1">
            <Text className="text-yellow-400 font-black text-xs tracking-widest">
              ROOM: {roomId}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 mb-6 px-6"
        showsVerticalScrollIndicator={false}
      >
        {(() => {
          const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
          let currentRank = 1;

          return sortedPlayers.map((p: any, index: number) => {
            if (index > 0 && p.score < sortedPlayers[index - 1].score) {
              currentRank++;
            }
            return (
              <RetroPlayerCard
                key={p.id}
                name={p.name}
                isMe={p.id === myPlayer?.id}
                isHost={p.isHost}
                rank={currentRank}
                score={p.score}
              />
            );
          });
        })()}
      </ScrollView>

      {gamePhase === "chart" && (
        <View className="pb-10 pt-4 w-full px-6">
          {myPlayer?.isHost ? (
            <View>
              <RetroButton
                title="SPIN WHEEL!"
                variant="secondary"
                onPress={() => colyseusService.startWheel()}
              />
              <TouchableOpacity
                onPress={openDevModal}
                style={{
                  height: 48,
                  position: "relative",
                  width: "50%",
                  alignSelf: "center",
                  marginTop: 8,
                }}
              >
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { borderRadius: 16, top: 3, left: 3 },
                  ]}
                  className="bg-black"
                />
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      borderRadius: 16,
                      borderWidth: 3,
                      borderColor: "#000000",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                  className="bg-white"
                >
                  <Text className="text-black font-black text-sm tracking-wider">
                    DEV MODE
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="relative w-full mb-4">
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: 24, top: 4, left: 4 },
                ]}
                className="bg-black"
              />
              <View
                style={{
                  borderRadius: 24,
                  borderWidth: 4,
                  borderColor: "#000000",
                  padding: 20,
                  alignItems: "center",
                }}
                className="bg-pink-300"
              >
                <Text className="text-black text-2xl font-black uppercase text-center tracking-wider">
                  Waiting for host...
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {showWheelModal && (
        <View
          style={StyleSheet.absoluteFillObject}
          className="bg-amber-50/95 justify-center items-center px-6 z-[9999] pt-12"
        >
          <View className="w-full max-w-sm relative">
            {/* Card Shadow */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { borderRadius: 28, top: 8, left: 8 },
              ]}
              className="bg-black"
            />

            {/* Card Body */}
            <View
              style={{
                borderRadius: 28,
                borderWidth: 5,
                borderColor: "#000000",
                padding: 24,
                alignItems: "center",
                backgroundColor: "#fee2e2",
              }}
              className="bg-pink-400"
            >
              <View className="bg-yellow-400 border-4 border-black py-2 px-6 rounded-2xl shadow-[4px_4px_0px_0px_#000] rotate-[-2deg] mb-6">
                <Text className="text-black text-4xl font-black uppercase text-center tracking-wider">
                  {displayedType}
                </Text>
              </View>

              <View className="flex-row flex-wrap justify-center items-center mb-6 gap-3 min-h-[110px]">
                {(() => {
                  const selectedPs = players.filter((p: any) =>
                    displayedPlayers.includes(p.id),
                  );

                  if (displayedType === "2v2" && selectedPs.length === 4) {
                    return (
                      <View className="items-center justify-center">
                        <View className="bg-cyan-300 px-5 py-2.5 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_#000]">
                          <Text className="text-black font-black text-lg">
                            {selectedPs[0].name} & {selectedPs[1].name}
                          </Text>
                        </View>
                        <Text
                          className="text-black font-black text-2xl my-2 italic"
                          style={{
                            textShadowColor: "#facc15",
                            textShadowOffset: { width: 2, height: 2 },
                            textShadowRadius: 0,
                          }}
                        >
                          VS
                        </Text>
                        <View className="bg-yellow-300 px-5 py-2.5 rounded-xl border-3 border-black shadow-[3px_3px_0px_0px_#000]">
                          <Text className="text-black font-black text-lg">
                            {selectedPs[2].name} & {selectedPs[3].name}
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  return selectedPs.map((p: any) => (
                    <View
                      key={p.id}
                      className="bg-white px-4 py-2 rounded-xl border-3 border-black shadow-[2px_2px_0px_0px_#000]"
                    >
                      <Text className="text-black font-black text-lg">
                        {p.name}
                      </Text>
                    </View>
                  ));
                })()}
              </View>

              <View className="bg-indigo-400 p-5 rounded-2xl border-4 border-black w-full items-center justify-center mb-8 min-h-[120px]">
                <Text className="text-black/60 text-xs font-black uppercase tracking-widest mb-1">
                  CATEGORY
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.4}
                  className="text-white font-black uppercase text-center w-full text-3xl"
                  style={{
                    textShadowColor: "#000000",
                    textShadowOffset: { width: 2, height: 2 },
                    textShadowRadius: 0,
                  }}
                >
                  {displayedCategory}
                </Text>
              </View>

              <View className="h-28 justify-center items-center w-full">
                {isSpinning ? (
                  <View className="w-full bg-white border-3 border-black py-3 rounded-2xl shadow-[3px_3px_0px_0px_#000] items-center justify-center">
                    <Text className="text-black font-black text-center text-lg uppercase tracking-wider">
                      Spinning Wheel...
                    </Text>
                  </View>
                ) : amISelected ? (
                  <View className="flex-row gap-4 items-center justify-center w-full">
                    <RetroButton
                      title="Try It"
                      variant="success"
                      onPress={() => setShowPracticeModal(true)}
                      style={{ flex: 1 }}
                    />
                    <RetroButton
                      title={isReady ? "READY ✓" : "READY UP!"}
                      variant={isReady ? "primary" : "secondary"}
                      onPress={handleReadyToggle}
                      style={{ flex: 2 }}
                    />
                  </View>
                ) : (
                  <RetroButton
                    title="DISMISS"
                    variant="danger"
                    onPress={() => setShowWheelModal(false)}
                    style={{ width: "100%" }}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {showDevModal && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: "rgba(0,0,0,0.95)",
              zIndex: 99999,
              paddingTop: 50,
              paddingHorizontal: 24,
              height: "120%",
              paddingBottom: 50,
            },
          ]}
        >
          <View className="flex-1 w-full max-w-sm mx-auto">
            <Text
              className="text-yellow-400 text-3xl font-black mb-6 text-center uppercase tracking-widest"
              style={{
                textShadowColor: "#000",
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 0,
              }}
            >
              DEV OVERRIDE
            </Text>
            <ScrollView
              className="w-full flex-1 mb-24"
              // showsVerticalScrollIndicator={true}
            >
              <Text className="text-white font-black opacity-80 text-xl tracking-widest mb-3 ml-2">
                GAME TYPE
              </Text>
              <View className="flex-row gap-2 mb-6">
                {TYPES.map((t) => {
                  const isBlocked =
                    (devCategory === "Rock Paper Scissors" && t !== "1v1") ||
                    (devCategory === "Hot Potato" && t === "2v2");
                  return (
                    <Pressable
                      key={t}
                      onPress={() => handleDevTypeChange(t)}
                      style={{
                        borderWidth: 3,
                        borderColor: "#000000",
                        height: 48,
                        borderRadius: 14,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      className={`flex-1 ${devType === t ? "bg-cyan-300" : "bg-white"} ${isBlocked ? "opacity-35" : ""}`}
                    >
                      <Text className="font-black text-black text-lg">{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="text-white font-black opacity-80 text-xl tracking-widest mb-3 ml-2">
                CATEGORY
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6 border-b-2 border-white/10 pb-6">
                {CATS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => handleDevCategoryChange(c)}
                    style={{
                      borderWidth: 3,
                      borderColor: "#000000",
                      height: 48,
                      borderRadius: 14,
                      justifyContent: "center",
                      alignItems: "center",
                      width: "48%",
                      marginBottom: 8,
                    }}
                    className={devCategory === c ? "bg-pink-300" : "bg-white"}
                  >
                    <Text className="font-black text-black text-xs text-center uppercase">
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-white font-black opacity-80 text-xl tracking-widest mb-3 ml-2">
                PLAYERS ({devPlayers.length} SELECTED)
              </Text>
              <View className="flex-row flex-wrap gap-3 mb-8">
                {players.map((p: any) => {
                  const isSelected = devPlayers.includes(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => toggleDevPlayer(p.id)}
                      style={{
                        borderWidth: 3,
                        borderColor: "#000000",
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                      }}
                      className={isSelected ? "bg-emerald-400" : "bg-white"}
                    >
                      <Text className="font-black text-black text-sm">
                        {p.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className="pt-4 gap-4 pb-12">
                <RetroButton
                  title="FORCE START"
                  variant="success"
                  onPress={handleDevStart}
                />
                <RetroButton
                  title="CANCEL"
                  variant="danger"
                  onPress={() => setShowDevModal(false)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {showPracticeModal && (
        <PracticeModal
          category={displayedCategory}
          onClose={() => setShowPracticeModal(false)}
        />
      )}
    </View>
  );
}
