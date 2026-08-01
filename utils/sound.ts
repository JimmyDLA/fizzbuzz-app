import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

// Configure global audio mode safely
try {
  if (typeof setAudioModeAsync === "function") {
    setAudioModeAsync({
      playsInSilentMode: true,
    }).catch(() => {});
  }
} catch (e) {
  console.warn("[sound] ExpoAudio native module not found in dev build:", e);
}

// Persistent global AudioPlayer singletons for sound effects
let clickPlayer: any = null;
let coinPlayer: any = null;
let beerPlayer: any = null;
let countDownPlayer: any = null;
let whooshPlayer: any = null;

function getClickPlayer() {
  if (!clickPlayer) {
    try {
      clickPlayer = createAudioPlayer(
        require("../assets/sounds/mouse_click.mp3"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize click player:", e);
    }
  }
  return clickPlayer;
}

function getCoinPlayer() {
  if (!coinPlayer) {
    try {
      coinPlayer = createAudioPlayer(require("../assets/sounds/coin_drop.m4a"));
    } catch (e) {
      console.log("[sound] Failed to initialize coin player:", e);
    }
  }
  return coinPlayer;
}

function getBeerPlayer() {
  if (!beerPlayer) {
    try {
      beerPlayer = createAudioPlayer(
        require("../assets/sounds/beer_opening.mp3"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize beer player:", e);
    }
  }
  return beerPlayer;
}

function getCountDownPlayer() {
  if (!countDownPlayer) {
    try {
      countDownPlayer = createAudioPlayer(
        require("../assets/sounds/count_down.mp3"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize countdown player:", e);
    }
  }
  return countDownPlayer;
}

export function playButtonClickSound() {
  try {
    const p = getClickPlayer();
    if (p) {
      p.seekTo(0).finally(() => {
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Click sound error:", e);
  }
}

export function playCoinDropSound() {
  try {
    const p = getCoinPlayer();
    if (p) {
      p.seekTo(0).finally(() => {
        p.setPlaybackRate(2); // Set playback rate to 2x
        p.shouldCorrectPitch = true;
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Coin sound error:", e);
  }
}

export function playBeerOpeningSound() {
  try {
    const p = getBeerPlayer();
    if (p) {
      p.seekTo(0).finally(() => {
        p.setPlaybackRate(2); // Set playback rate to 2x
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Beer sound error:", e);
  }
}

export function playCountDownSound() {
  try {
    const p = getCountDownPlayer();
    if (p) {
      p.seekTo(0).finally(() => {
        p.loop = false;
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Count down sound error:", e);
  }
}

export function playWhooshSound() {
  try {
    if (!whooshPlayer) {
      whooshPlayer = createAudioPlayer(require("../assets/sounds/whoosh.m4a"));
    }
    if (whooshPlayer) {
      whooshPlayer.loop = true; // Set looping to true for active spin
      whooshPlayer.seekTo(0).finally(() => {
        whooshPlayer.play();
      });
    }
  } catch (e) {
    console.log("[sound] Whoosh sound error:", e);
  }
}

export function stopWhooshSound() {
  try {
    if (whooshPlayer) {
      whooshPlayer.pause();
      whooshPlayer.seekTo(0);
      whooshPlayer.remove();
      whooshPlayer = null;
    }
  } catch (e) {
    console.log("[sound] Stop whoosh sound error:", e);
    whooshPlayer = null;
  }
}

let balloonPopPlayer: any = null;

function getBalloonPopPlayer() {
  if (!balloonPopPlayer) {
    try {
      balloonPopPlayer = createAudioPlayer(
        require("../assets/sounds/balloon_pop.mp3"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize balloon pop player:", e);
    }
  }
  return balloonPopPlayer;
}

export function playBalloonPopSound() {
  try {
    const p = getBalloonPopPlayer();
    if (p) {
      p.seekTo(0).finally(() => {
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Balloon pop sound error:", e);
  }
}

let whistlePlayer: any = null;

function getWhistlePlayer() {
  if (!whistlePlayer) {
    try {
      whistlePlayer = createAudioPlayer(
        require("../assets/sounds/whistle.m4a"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize whistle player:", e);
    }
  }
  return whistlePlayer;
}

export function playWhistleSound() {
  try {
    const p = getWhistlePlayer();
    if (p) {
      p.seekTo(0).finally(() => {
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Whistle sound error:", e);
  }
}

let balloonInflatePlayer: any = null;

function getBalloonInflatePlayer() {
  if (!balloonInflatePlayer) {
    try {
      balloonInflatePlayer = createAudioPlayer(
        require("../assets/sounds/balloon_inflate.m4a"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize balloon inflate player:", e);
    }
  }
  return balloonInflatePlayer;
}

export function playBalloonInflateSound() {
  try {
    const p = getBalloonInflatePlayer();
    if (p) {
      p.seekTo(0).finally(() => {
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Balloon inflate sound error:", e);
  }
}

let bgMusicPlayer: any = null;

function getBgMusicPlayer() {
  if (!bgMusicPlayer) {
    try {
      bgMusicPlayer = createAudioPlayer(
        require("../assets/sounds/80s_theme_song.mp3"),
      );
      if (bgMusicPlayer) {
        bgMusicPlayer.loop = true;
        bgMusicPlayer.volume = 0.1;
      }
    } catch (e) {
      console.log("[sound] Failed to initialize bg music player:", e);
    }
  }
  return bgMusicPlayer;
}

export function startBackgroundMusic() {
  try {
    const p = getBgMusicPlayer();
    if (p) {
      p.loop = true;
      p.volume = 0.1;
      p.play();
    }
  } catch (e) {
    console.log("[sound] Background music start error:", e);
  }
}

export function stopBackgroundMusic() {
  try {
    if (bgMusicPlayer) {
      bgMusicPlayer.pause();
      bgMusicPlayer.seekTo(0);
    }
  } catch (e) {
    console.log("[sound] Background music stop error:", e);
  }
}

let spinPlayer: any = null;

function getSpinPlayer() {
  if (!spinPlayer) {
    try {
      spinPlayer = createAudioPlayer(
        require("../assets/sounds/spin.m4a"),
      );
      if (spinPlayer) {
        spinPlayer.loop = true;
        spinPlayer.setPlaybackRate(1.5);
        spinPlayer.shouldCorrectPitch = true;
      }
    } catch (e) {
      console.log("[sound] Failed to initialize spin player:", e);
    }
  }
  return spinPlayer;
}

export function playSpinSound() {
  try {
    const p = getSpinPlayer();
    if (p) {
      p.loop = true;
      p.setPlaybackRate(1.5);
      p.shouldCorrectPitch = true;
      p.seekTo(0).finally(() => {
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Spin sound error:", e);
  }
}

export function stopSpinSound() {
  try {
    if (spinPlayer) {
      spinPlayer.pause();
      spinPlayer.seekTo(0);
    }
  } catch (e) {
    console.log("[sound] Stop spin sound error:", e);
  }
}

let simonGreenPlayer: any = null;
let simonRedPlayer: any = null;
let simonYellowPlayer: any = null;
let simonBluePlayer: any = null;

export function playSimonSound(colorIndex: number) {
  try {
    let player: any = null;
    if (colorIndex === 0) {
      if (!simonGreenPlayer) {
        simonGreenPlayer = createAudioPlayer(
          require("../assets/sounds/simon_green.wav"),
        );
      }
      player = simonGreenPlayer;
    } else if (colorIndex === 1) {
      if (!simonRedPlayer) {
        simonRedPlayer = createAudioPlayer(
          require("../assets/sounds/simon_red.wav"),
        );
      }
      player = simonRedPlayer;
    } else if (colorIndex === 2) {
      if (!simonYellowPlayer) {
        simonYellowPlayer = createAudioPlayer(
          require("../assets/sounds/simon_yellow.wav"),
        );
      }
      player = simonYellowPlayer;
    } else if (colorIndex === 3) {
      if (!simonBluePlayer) {
        simonBluePlayer = createAudioPlayer(
          require("../assets/sounds/simon_blue.wav"),
        );
      }
      player = simonBluePlayer;
    }

    if (player) {
      player.seekTo(0).finally(() => {
        player.play();
      });
    }
  } catch (e) {
    console.log("[sound] Simon sound error:", e);
  }
}

let positivePlayer: any = null;

function getPositivePlayer() {
  if (!positivePlayer) {
    try {
      positivePlayer = createAudioPlayer(
        require("../assets/sounds/positive.mp3"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize positive player:", e);
    }
  }
  return positivePlayer;
}

export function playPositiveSound() {
  try {
    const p = getPositivePlayer();
    if (p) {
      p.seekTo(0).finally(() => {
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Positive sound error:", e);
  }
}

let negativePlayer: any = null;

function getNegativePlayer() {
  if (!negativePlayer) {
    try {
      negativePlayer = createAudioPlayer(
        require("../assets/sounds/negative.mp3"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize negative player:", e);
    }
  }
  return negativePlayer;
}

export function playNegativeSound() {
  try {
    const p = getNegativePlayer();
    if (p) {
      p.seekTo(0).finally(() => {
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Negative sound error:", e);
  }
}

let papPlayer: any = null;

function getPapPlayer() {
  if (!papPlayer) {
    try {
      papPlayer = createAudioPlayer(
        require("../assets/sounds/pap.m4a"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize pap player:", e);
    }
  }
  return papPlayer;
}

export function playPapSound() {
  try {
    const p = getPapPlayer();
    if (p) {
      p.seekTo(0).finally(() => {
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Pap sound error:", e);
  }
}

let paintSplat1Player: any = null;

function getPaintSplat1Player() {
  if (!paintSplat1Player) {
    try {
      paintSplat1Player = createAudioPlayer(
        require("../assets/sounds/paint_splat.m4a"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize paint splat 1 player:", e);
    }
  }
  return paintSplat1Player;
}

export function playPaintSplat1Sound() {
  try {
    const p = getPaintSplat1Player();
    if (p) {
      p.seekTo(0).finally(() => {
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Paint splat 1 sound error:", e);
  }
}

let paintSplat2Player: any = null;

function getPaintSplat2Player() {
  if (!paintSplat2Player) {
    try {
      paintSplat2Player = createAudioPlayer(
        require("../assets/sounds/paint_splat2.m4a"),
      );
    } catch (e) {
      console.log("[sound] Failed to initialize paint splat 2 player:", e);
    }
  }
  return paintSplat2Player;
}

export function playPaintSplat2Sound() {
  try {
    const p = getPaintSplat2Player();
    if (p) {
      p.seekTo(0).finally(() => {
        p.play();
      });
    }
  } catch (e) {
    console.log("[sound] Paint splat 2 sound error:", e);
  }
}
