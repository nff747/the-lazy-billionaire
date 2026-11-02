# Google Play Console: App Content Questionnaire Guide

**Project:** The Lazy Billionaire  
**Company:** Frozen Flame  
**Version:** 1.0.0

Use this cheat sheet to accurately answer the "App Content" section in the Google Play Console. These answers are based on your current React/Firebase/Capacitor stack.

---

## 1. 🔒 Privacy Policy

Google requires a valid URL.
*   **Action:** If you don't have a website, use a free generator like "TermsFeed" or host a simple HTML page on GitHub Pages.
*   **Content:** Must state you use **Firebase** (Google) for data storage and authentication.

---

## 2. 🔑 App Access

**Question:** Does your app have parts that are restricted based on login, memberships, location, or other forms of authentication?

**Your Answer:** **"All or some functionality is restricted."**

**Reasoning:**
*   Your app has a **Guest Mode** (full gameplay) but also **Cloud Save** (Requires Google/Email login).
*   Google Play requires you to provide test credentials for them to verify the login flow.

**Instructions for Console:**
1.  Select **"All or some functionality is restricted"**.
2.  Click **"Add new instruction"**.
3.  **Name:** `Test Account`
4.  **Username/Email:** `test_lazy_billionaire@gmail.com` (Create a real dummy account for this).
5.  **Password:** `TestPass123!`
6.  **Instruction:** "Click 'Sign In' on the start screen to access Cloud Save features. Alternatively, 'Play as Guest' allows full gameplay access."

---

## 3. 📢 Ads

**Question:** Does your app contain ads?

**Your Answer:** **"Yes, my app contains ads."**

**Reasoning:**
*   You have **Hype Protocol** (Rewarded Ads) and **Money Bubbles**.

---

## 4. ⭐ Content Rating (IARC)

These questions determine your PEGI/ESRB rating.

*   **Category:** Select **Game**.
*   **Violence:** **No**. (Hacking is abstract UI, not visual violence).
*   **Fear:** **No**.
*   **Sexuality/Profanity:** **No**. (Note: Ensure your Bot/Zenith chats are clean. If they use slang like "damn", it might be "Mild Language", but usually "No" is safe for mild flexing).
*   **Controlled Substances:** **No**.
*   **Gambling:** **No**. (You have "Stock Market" and "Gacha/Red Packets", but this is **Simulated Gambling** if real money CANNOT be cashed out).
    *   *Question:* "Can users cash out real money?" -> **NO**.
    *   *Question:* "Does the game simulate gambling?" -> **Yes**. (Because of the Stock Charts/Gacha boxes).
*   **Online Interactions:** **Yes**.
    *   *Question:* "Can users interact or exchange content?" -> **Yes** (Leaderboards, Chat, Red Packets).
    *   *Question:* "Does the app share the user's current physical location?" -> **No**.
    *   *Question:* "Does the app allow users to purchase digital goods?" -> **Yes**.

**Expected Rating:** PEGI 3 or PEGI 7 (Generic Simulation).

---

## 5. 🎯 Target Audience

**Selection:** **13-15** and **16-17** and **18+**.

**Instructions:**
*   **Do NOT** select "5-year-olds" or younger, or you are subject to strict "Family Policy" (NO tracking, strict ad laws).
*   **Appeal to Children:** Google will ask: *"Could your store listing appeal to children?"*
    *   **Answer:** **Yes** (Interactive style, cartoons).
    *   *Warning:* If you say Yes, Google reviews you manually to ensure ads are safe. If you say **No**, ensure your Icon isn't too "cute". Given it's a "Billionaire" stock game, saying **No** (Not primarily designed for children) is safer and usually accurate for simulation/strategy games.

---

## 6. 🛡️ Data Safety (Crucial)

This generates the "Data Safety" label on the store.

**1. Data Collection & Security**
*   **Does your app collect or share any user data:** **Yes**.
*   **Is all traffic encrypted:** **Yes** (HTTPS via Firebase).
*   **Can users request deletion:** **Yes** (Firebase requirement).

**2. Data Types**
*   **Personal Info:**
    *   **Email Address:** Select **Collected**. (For Cloud Save).
        *   *Purpose:* App Functionality, Account Management.
    *   **User IDs:** Select **Collected**. (Firebase UID).
*   **Financial Info:**
    *   **Purchase History:** Select **Collected**. (Google Play Billing).
*   **App Activity:**
    *   **Gameplay Content:** Select **Collected**. (Saves, Assets, Money).
*   **Device or other IDs:**
    *   **Device IP/ID:** Select **Collected**. (Firebase Analytics/Auth).

---

## 7. 🏛️ Government Apps

**Question:** Is this app developed by or on behalf of a government entity?
**Answer:** **No**.

---

## 8. 💸 Financial Features

**New Policy (2024).** Since you have a "Stock Market".

**Question:** Does your app provide financial features?
**Answer:** **No, this is a game/simulation.**

*   *Note:* Even though you have "Stocks" and "Crypto", you do **not** offer real-world banking, loans, or crypto wallets.
*   **Crucial:** Ensure your "Short Description" or "About" says: *"A stock market **simulation** game"* to avoid being flagged as a fake trading app.

---

## 9. 🏥 Health Apps

**Question:** Is your app a health app?
**Answer:** **No**.

---

## 📝 Extra Details (For Store Listing)

**About Functionality:**
When filling out the **Store Listing**, you can emphasize the educational & safety aspects:

*   **Anti-Addiction System:** "Includes a 'Digital Wellbeing' system that pauses gameplay after 6 hours to encourage breaks."
*   **Educational:** "Learn market volatility, asset management, and trading basics in a risk-free simulation."
