
# 👑 The Lazy Billionaire - Master Launch Guide

**Current Version:** 1.2.0 (Release Candidate)  
**Stack:** React + TypeScript + Vite + Tailwind + Capacitor + Firebase

Welcome, Developer. This is the complete manual to taking "The Lazy Billionaire" from source code to a live app on the Google Play Store.

---

## 🌟 App Features (Current State)

This isn't just a basic clicker. It is a full-featured simulation:

1.  **Idle Core:** 35+ Assets (Lemonade Stands to Reality Engines) with increasing costs and multipliers.
2.  **Stock Market:** Real-time simulated Crypto and Stock trading with candlestick charts.
3.  **Social Network:** Autonomous AI bots (like "Zenith") that chat, flex, and react to market news.
4.  **Hacking System:** Hire hackers to steal money from bots (risk vs reward).
5.  **Economy:** Global News events, Taxes, Market Crashes, and Inflation.
6.  **Monetization Hooks:**
    *   **Hype Protocol:** Watch Ads for x2 Income.
    *   **Money Bubble:** Random floating orbs for instant cash (Ad-based).
    *   **Diamond Shop:** IAP bundles (Simulated currently).
7.  **Anti-Addiction:** Mandatory cooldown after 6 hours of continuous play.
8.  **Backend:** Firebase Authentication (Google/Email) and Cloud Save Sync.

---

## 🛠️ PHASE 1: Local Environment Setup

Do this if you are setting up the project for the first time.

### 1. Prerequisites
*   **Node.js:** [Download v18+](https://nodejs.org/)
*   **Java JDK 17:** Required for Android builds.
*   **Android Studio:** [Download](https://developer.android.com/studio).
*   **VS Code:** Recommended editor.

### 2. Installation
Open the folder in VS Code and run:
```bash
npm install
```

### 3. Testing Web Version
```bash
npm run dev
```
Open `http://localhost:3000`. The app will run in **Simulation Mode** (mock backend) until Firebase is configured.

---

## 🔥 PHASE 2: Firebase Configuration (Crucial)

To enable Real Login and Cloud Saves, you must link your own Firebase project.

1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Create a project named `The Lazy Billionaire`.
3.  **Authentication:** Enable **Google** and **Email/Password** providers.
4.  **Firestore:** Create a database (Start in **Test Mode**, switch to Production before launch).
5.  **Project Settings:**
    *   Click the Gear icon -> Project Settings.
    *   Scroll down to "Your apps" -> Select `</>` (Web).
    *   Register the app.
    *   **Copy the `firebaseConfig` object.**
6.  **Update Code:**
    *   Open `services/firebaseService.ts`.
    *   Replace the `firebaseConfig` variable with your copied keys.

---

## 📱 PHASE 3: Android Build Setup

We use **Capacitor** to turn this web app into a native APK/AAB.

### 1. Build Web Assets
Compile the React code into static files:
```bash
npm run build
```

### 2. Initialize Android Platform
```bash
npm install @capacitor/android
npx cap add android
```

### 3. Sync Changes
Whenever you modify `App.tsx` or any code, run this sequence:
```bash
npm run build
npx cap sync
```

### 4. Custom App Icons
To replace the default Capacitor logo:
1.  Place your icon `icon.png` (1024x1024) and splash `splash.png` (2732x2732) in a folder named `resources/`.
2.  Run:
    ```bash
    npm install @capacitor/assets --save-dev
    npx capacitor-assets generate --android
    ```

---

## 🚀 PHASE 4: Launching to Play Store

This is the final stretch.

### 1. Open Android Studio
```bash
npx cap open android
```
Wait for Gradle to sync (this takes a while the first time).

### 2. Configure Package Name
*   In `android/app/build.gradle`, change `applicationId` to your unique ID (e.g., `com.yourname.lazybillionaire`).
*   In `capacitor.config.ts`, update `appId` to match.

### 3. Generate Signed Bundle (AAB)
Google Play requires an `.aab` file signed with a secure key.
1.  In Android Studio: **Build** menu -> **Generate Signed Bundle / APK**.
2.  Select **Android App Bundle**.
3.  **Key Store Path:** Click "Create new...".
    *   Save the `.jks` file somewhere safe (lose this, and you can never update the app again).
    *   Set passwords.
4.  Select **Release** build variant.
5.  Click **Finish**.
6.  Locate the `.aab` file in `android/app/release/`.

### 4. Google Play Console
1.  Create an account ($25 one-time fee).
2.  **Create App:** Name it "The Lazy Billionaire".
3.  **Main Store Listing:** Upload screenshots, description, and your Icon.
4.  **Data Safety:** Since we use Firebase, declare that you collect "App Activity" and "Account Info" for functionality.
5.  **Release:**
    *   Go to **Testing** -> **Internal Testing** (for yourself) or **Production** (for the world).
    *   Create New Release.
    *   Upload the `.aab` file.
    *   Save and roll out.

---

## � PHASE 5: Real Payments (In-App Purchases)

The app is pre-wired for Google Play Billing. You just need to create the products in the Console.

### 1. Google Play Console Configuration
1.  Go to your App dashboard -> **Monetize** -> **Products** -> **In-app products**.
2.  Create the following products (IDs must match exactly):

| Product ID | Name | Price (Suggested) |
| :--- | :--- | :--- |
| `lb_diamonds_100` | Elite Starter | $1.99 |
| `lb_diamonds_600` | Mogul Stash | $9.99 |
| `lb_diamonds_1500` | Billionaire Vault | $19.99 |
| `lb_diamonds_5000` | The Treasury | $49.99 |

3.  **Activate** each product.

### 2. Testing Configuration
*   To test without spending real money, add your Gmail to **Setup** -> **License Testing** in the Play Console main menu.
*   **Important:** IAP only works on a **Signed APK/AAB** installed on a real device. It will usually fail in Emulators.

---

## �🐛 Troubleshooting Common Issues

**1. "White Screen" on Android**
*   Did you run `npm run build`? Capacitor loads the `dist` folder. If it's empty or old, the app breaks.
*   Check `capacitor.config.ts`. `webDir` should be `dist`.

**2. Google Login Fails on Phone**
*   You need to add your Android app's **SHA-1 Fingerprint** to Firebase.
*   In Android Studio -> Gradle (Right side pane) -> Tasks -> android -> signingReport.
*   Copy the `SHA1` code.
*   Paste it in Firebase Console -> Project Settings -> Add Fingerprint.

**3. "App not installed"**
*   You cannot install a signed Release APK over a Debug APK. Uninstall the debug version from your phone first.

---

**Empire Status: READY.**  
*Proceed to global domination.*
