# AGENTS.md

Expo / React Native / NativeWind client. Pull requests target `dev`, never `master`.

## Layout

- `app/` — Expo Router screens (`index`, `lobby`, `chart`, `game`, `podium`, `_layout`).
- `assets/` — Images, sounds, and Lottie JSON.
- `components/` — Shared UI and `components/games/` mini-game screens.
- `constants/` — Theme tokens and specialty-card metadata.
- `docs/` — Design and ops notes. Root guides: `HOW_TO_PLAY.md`, `TECH_STACK.md`, `README.md`, `task.md`.
- `hooks/` — Color-scheme and click-sound hooks.
- `plugins/` — Expo config plugin `withDeferGestures`.
- `scripts/` — Xcode postinstall patch, project reset, and the `*.test.ts` runner.
- `store/` — Redux store and the Colyseus client (`colyseusService.ts`).
- `utils/` — Pure helpers. Unit tests sit beside them as `*.test.ts`.
- `.github/` — CI on pull requests and pushes to `dev`.
- `.vscode/` — Editor settings and recommended extensions.
- `app.json` — Expo config, dev client, plugins, bundle ids.
- `babel.config.js` — `babel-preset-expo` and NativeWind. `metro.config.js` adds the Colyseus resolver override. `global.css` and `tailwind.config.js` are the NativeWind styles. `nativewind-env.d.ts` types `className`.
- `eas.json` — EAS build profiles. `eslint.config.js` is the Expo flat config. `tsconfig.json` is strict, with the `@/*` alias. `react-native-augmentations.d.ts` adds React Native types.
- `package.json` — Scripts and dependencies. `package-lock.json` pins `npm ci`.

## Commands

```bash
npm install
npx tsc --noEmit
npm run lint
npm test
```

`npm run lint` is `expo lint` (`eslint.config.js`). It exits 0; leftover warnings are unused vars and hook deps. Leave the disabled `react-hooks` compiler rules off. `npm test` runs every `*.test.ts` with `tsx` and stays quiet when they pass. One file: `npx tsx utils/displayedGameType.test.ts`. CI installs with `npm ci`. `expo-env.d.ts` is committed so `tsc` sees Expo's `*.css` types without starting the dev server (Expo CLI also lists that name in `.gitignore`). Development builds use `npx expo run:ios` or `npx expo run:android` (Expo Go is not supported).

## Local server

This client has no env var for the server URL. `store/colyseusService.ts` sets `ENDPOINT` to `ws://${host}:2567`. `host` is Expo `hostUri`, then `experienceUrl`, then `debuggerHost`, otherwise `localhost` (`10.0.2.2` on Android). Run `fizzbuzz-server` with `npm start` so `PORT` (default **2567**) matches that URL.

Server host tools (`dev_start_wheel`, `dev_award_card`) run only when `ALLOW_DEV_TOOLS=1` and `NODE_ENV` is `development` or `test`. A test server is `ALLOW_DEV_TOOLS=1 NODE_ENV=test` on a `PORT` other than 2567, so it does not take the app's port. This client still connects to 2567.

`__DEV__` shows the host-only DEV MODE control on the chart screen; it sends those two messages. `app.json` sets the Expo dev-client `toolsButton` to false.
