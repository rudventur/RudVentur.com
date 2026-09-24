/* PopCOIN settings.

   Shared accounts switch on when POPCOIN_FIREBASE holds your PopCOIN Firebase
   project's web config (Firebase console → Project settings → Your apps → Web
   app → SDK setup and configuration → "Config"). These values are public by
   design; the database rules (popcoin/database.rules.json) are what protect the
   balances. See popcoin/README.md for the 5-minute setup.

   If it's null, every wallet lives on its own device. */
window.POPCOIN_FIREBASE = {
  apiKey: "AIzaSyAAwUo2UUVqrjMfyDkyBTA8riU9otvMTH0",
  authDomain: "popcoin-c039a.firebaseapp.com",
  databaseURL: "https://popcoin-c039a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "popcoin-c039a",
  storageBucket: "popcoin-c039a.firebasestorage.app",
  messagingSenderId: "973107499596",
  appId: "1:973107499596:web:7df495d23ce0349e02dae9"
};

/* Indicative value of 1 PopCOIN in GBP, shown in the wallet. PopCOIN is a site
   credit and is not redeemable for money yet. */
window.POPCOIN_REF_GBP = 0.01;
