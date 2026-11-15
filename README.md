# FizzBuzz Mobile Client

A real-time multiplayer party game that everyone can join from their smartphone to compete in random mini-game drinking games. Inspired by a mix of Mario Party's mini-games and classic house party drinking games.

For full gameplay rules, game modes, and mini-game guides, see [HOW_TO_PLAY.md](file:///Users/jimmydla/Code/fizzbuzz/HOW_TO_PLAY.md).
For architecture, dependencies, and framework specifications, see [TECH_STACK.md](file:///Users/jimmydla/Code/fizzbuzz/TECH_STACK.md).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a development build. Because the app uses custom native config plugins (e.g. `plugins/withDeferGestures.js`) and react-native-gesture-handler, **Expo Go cannot be used**. You must use a **Development Build**:

   ```bash
   # Start iOS Simulator build
   npx expo run:ios

   # Start Android Emulator build
   npx expo run:android
   ```

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
