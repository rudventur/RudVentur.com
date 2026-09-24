# 🍿 PopCOIN Wallet

PopCOIN is RUDVENTUR's site credit (100 pips = 1 PopCOIN). The wallet lives at
`popcoin/` and inside the Popcorn Hub's 🍿 PopCOIN tab.

| Tab | What it does |
|---|---|
| 💰 Wallet | Balance, indicative £ value, send to `@name`, receive (link + QR), export wallet file, withdrawal slip, history |
| ⛏️ Fun Mining | Mines PopCOIN (about 1.2 a minute, up to 6 at a time, server-timed) + explanations of how each kind of mining works |
| 🔗 Real Mining | Links to real mining services (WhatToMine, NiceHash, unMineable, pools, …) with safety notes |
| 🔄 Swap & Buy | What your PopCOIN is worth in BTC/ETH/SOL/DOGE at live prices + real exchanges |
| 🏦 Banks | RUDVENTUR banks (Peoples Bank ledger, owe2owe) + UK and Polish banks |

Files:
- `embed/popcoin.js` is the engine (balance, mining, sending, receiving, export)
- `popcoin/config.js` holds the Firebase settings that switch on shared accounts
- `popcoin/database.rules.json` has the rules that protect every balance
- `embed/popcoin-reward.js` lets any page award PopCOIN (see Rewards)
- `popcoin/tests/rules.test.mjs` contains 47 tests that try to cheat the rules

## 🎮 Rewards

Pages earn PopCOIN with one script tag and one call:

```html
<script src="https://rudventur.github.io/RudVentur.com/embed/popcoin-reward.js" defer></script>
<script> PopCOINReward(42, 'type-game'); /* 100 pips = 1 PopCOIN */ </script>
```

It shows a "+0.42 PopCOIN 🍿" pop-up and queues the reward on the device. The
engine pays it out as fast as the rules allow: up to 3 PopCOIN per claim, 30
seconds apart, 50 a day. Only one open page pays out at a time. If the shared
account can't be reached, rewards stay queued.

| Where | Reward |
|---|---|
| ⌨️ type-game | 1 pip per word typed (5 characters) × accuracy × difficulty (Baby ×0.5, Easy ×0.75, Medium ×1, Hard ×1.5, Nightmare ×2) |
| 🌐 Translator | 0.10 + 1 pip per 4 languages for each new text (the same text again earns nothing), max 0.50 |

## Two modes

- **This device only** (now): `POPCOIN_FIREBASE` in `config.js` is `null`, so each
  wallet lives in its own browser and sending is switched off.
- **Shared accounts**: once `config.js` has your Firebase settings, every
  visitor gets an anonymous PopCOIN account, and sending between `@names` works.

## Switch on shared accounts (about 5 minutes, free)

1. Go to <https://console.firebase.google.com> → **Add project** → name it
   `popcoin-rudventur` (Analytics not needed). The free Spark plan is enough.
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable.**
   Then open **Settings → Authorized domains** and add `rudventur.github.io`.
3. **Build → Realtime Database → Create database** → location **Belgium
   (europe-west1)** → start in **locked mode**.
4. In the database's **Rules** tab, replace everything with the contents of
   `popcoin/database.rules.json` → **Publish**.
5. **Project settings (⚙️) → General → Your apps → Web (`</>`)** → register the
   app as "PopCOIN wallet" (no hosting). Copy the `firebaseConfig` values.
6. Paste them into `popcoin/config.js`:
   ```js
   window.POPCOIN_FIREBASE = {
     apiKey: "…", authDomain: "…", databaseURL: "https://…europe-west1.firebasedatabase.app",
     projectId: "…", appId: "…"
   };
   ```
   (These values are public by design. The rules are what protect balances.)
7. Commit. Wallets switch to 🌐 **shared account** on their next load.

**Whenever `database.rules.json` changes, publish it again** in the database's
Rules tab (for example, the rewards update added `rewardAt`, `rewardDay` and
`rewardToday`). Until you do, rewards stay queued and nothing is lost.

Balances already on a device (local mode) don't carry over into shared
accounts, because the rules only allow the 10 PopCOIN welcome bonus when an
account is created.

## What the rules guarantee

- Nobody can write their own balance. New accounts start with exactly 10 PopCOIN.
- Mining: at most 2 pips per second since your last claim (checked against the
  server clock), at most 6 PopCOIN per claim.
- Rewards: at most 3 PopCOIN per claim, 30 s apart (server clock), 50 a day;
  the daily counter can't be reset or faked.
- Sending: in one atomic write, the sender's balance drops by exactly the
  amount, and an outbox and inbox entry with that same amount are created. The
  receiver claims each payment once and can't inflate it.
- You can only read your own account, inbox and history. Names are public so
  people can send to them.

Before PopCOIN gets real value, add stronger identity than anonymous accounts
(for example Google sign-in, and later KYC through a licensed partner) and
server-side functions for rewards. Anyone can script the free mining, and an
anonymous account is lost if the browser's data is cleared.

## Testing the rules

```bash
cd popcoin
npm i --no-save firebase-tools @firebase/rules-unit-testing firebase
npx firebase emulators:exec --only database --project demo-popcoin "node tests/rules.test.mjs"
```
(needs Java 11+; `firebase deploy --only database` from this folder also publishes the rules)
