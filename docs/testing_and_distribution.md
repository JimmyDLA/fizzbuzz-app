# Testing and Distribution Setup Guide

This guide details the procedures for testing the **FizzBuzz Mini Drinking Games** app locally and distributing beta builds to testers: **TestFlight** for iOS and **Firebase App Distribution** for Android.

---

## 1. Local Testing & Verification

Before distributing builds to testers, ensure the app compiles cleanly and works locally.

### 1.1 Static Type Checking
Always run TypeScript validation on both the app and server to catch bugs:
```bash
# In fizzbuzz (App)
npx tsc --noEmit

# In fizzbuzz-server (Server)
npx tsc --noEmit
```

### 1.2 Running the App in Development Mode
Since the app uses custom native config plugins (e.g. `plugins/withDeferGestures.js`) and react-native-gesture-handler, **Expo Go cannot be used**. You must use a **Development Build**:
```bash
# Start iOS Simulator build
npx expo run:ios

# Start Android Emulator build
npx expo run:android
```

---

## 2. EAS Build Configuration

Expo Application Services (EAS) is used to compile native binaries in the cloud. Create an `eas.json` file in the root of the `fizzbuzz` directory to define your build profiles:

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 3. iOS Beta Distribution via TestFlight

Apple TestFlight is the standard environment for distributing iOS builds. 

### 3.1 Prerequisites
1. An active **Apple Developer Program Account** ($99/year).
2. Owner or App Manager access to App Store Connect.

### 3.2 Step-by-Step Setup
1. **Initialize EAS Credentials**:
   Run the following command to link your local project to Expo and Apple:
   ```bash
   eas credentials
   ```
   Select `iOS`, log in to your Apple Developer Account, and let EAS automatically generate the App ID, Distribution Certificate, and Provisioning Profile.

2. **Trigger the Production Build**:
   Build the app for store distribution (TestFlight):
   ```bash
   eas build --platform ios --profile production
   ```
   *Note: EAS will output an `.ipa` file upon completion.*

3. **Submit the Build to App Store Connect**:
   Submit the completed build to Apple:
   ```bash
   eas submit --platform ios
   ```
   *(Alternatively, run `eas build --platform ios --profile production --auto-submit` to build and upload in a single command).*

4. **Configure TestFlight in App Store Connect**:
   * Log in to [App Store Connect](https://appstoreconnect.apple.com/).
   * Select your App (create a new one if not already created, matching your Bundle Identifier `com.yourname.fizzbuzz`).
   * Navigate to the **TestFlight** tab.
   * **Internal Testing**: Add team members (App Store Connect users) to the *Developer* group. They will receive TestFlight invitations immediately when the build processes.
   * **External Testing**: Create an external group, add tester emails, and submit the build for Beta App Review. Once approved by Apple, external testers will receive invites.

---

## 4. Android Beta Distribution via Firebase App Distribution

Firebase App Distribution is an excellent, free alternative to Google Play Internal Sharing, allowing you to distribute APKs to Android testers instantly.

### 4.1 Prerequisites
1. A [Firebase Console](https://console.firebase.google.com/) account.
2. A Firebase project created for your app.

### 4.2 Step-by-Step Setup
1. **Add Android App to Firebase Project**:
   * In the Firebase Console, click **Add App** and select **Android**.
   * Enter your Android package name (from `app.json`, e.g., `com.yourname.fizzbuzz`).
   * Register the app and download the `google-services.json` file. Place it in the root of your `fizzbuzz` app directory.
   * Update your `app.json` to include the path:
     ```json
     "android": {
       "googleServicesFile": "./google-services.json"
     }
     ```

2. **Trigger the Preview Build**:
   Generate an `.apk` file (the standalone Android installer) using the `preview` profile:
   ```bash
   eas build --platform android --profile preview
   ```
   *Note: Unlike App Bundles (.aab) required by Google Play, Firebase App Distribution works directly with installable APKs (.apk).*

3. **Distribute via Firebase Console (Manual)**:
   * Once the EAS build completes, download the `.apk` file from the Expo dashboard.
   * In the Firebase Console, navigate to **Release & Monitor** $\rightarrow$ **App Distribution**.
   * Drag and drop the `.apk` file into the console.
   * Add a list of tester email addresses, write release notes, and click **Distribute**. Testers will receive an email invitation to install the App Tester application and run your build.

4. **Distribute via Firebase CLI (Automated)**:
   To automate distribution directly from your local terminal or CI/CD pipelines without downloading/uploading manually:
   * Install the Firebase CLI:
     ```bash
     npm install -g firebase-tools
     ```
   * Log in to Firebase:
     ```bash
     firebase login
     ```
   * Distribute the downloaded APK using the command:
     ```bash
     firebase appdistribution:distribute path/to/build.apk \
       --app <YOUR_FIREBASE_APP_ID> \
       --groups "qa-testers" \
       --release-notes "New Perfection mini-game updates"
     ```

---

## 5. Automated CI/CD Setup (GitHub Actions)

You can automate this flow by setting up a GitHub Actions workflow inside `.github/workflows/preview.yml`:

```yaml
name: Build & Distribute Beta
on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install Dependencies
        run: |
          cd fizzbuzz
          npm ci

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      # Build iOS and auto-submit to TestFlight
      - name: Build & Submit iOS
        run: |
          cd fizzbuzz
          eas build --platform ios --profile production --auto-submit --non-interactive

      # Build Android APK and upload to Firebase App Distribution
      - name: Build Android
        run: |
          cd fizzbuzz
          eas build --platform android --profile preview --non-interactive

      - name: Upload Android to Firebase App Distribution
        uses: wotomas/firebase-app-distribution-action@v2
        with:
          appId: ${{ secrets.FIREBASE_ANDROID_APP_ID }}
          serviceCredentialsFileContent: ${{ secrets.FIREBASE_CREDENTIALS_JSON }}
          groups: qa-testers
          file: fizzbuzz/build.apk
```
