/* PopCOIN settings.

   Shared accounts switch on when POPCOIN_FIREBASE holds your PopCOIN Firebase
   project's web config (Firebase console → Project settings → Your apps → Web
   app → SDK setup and configuration → "Config"). These values are public by
   design; the database rules (popcoin/database.rules.json) are what protect the
   balances. See popcoin/README.md for the 5-minute setup.

   While it's null, every wallet lives on its own device. */
window.POPCOIN_FIREBASE = null;
/* e.g.
window.POPCOIN_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "popcoin-rudventur.firebaseapp.com",
  databaseURL: "https://popcoin-rudventur-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "popcoin-rudventur",
  appId: "1:...:web:..."
};
*/

/* Indicative value of 1 PopCOIN in GBP, shown in the wallet. PopCOIN is a site
   credit and is not redeemable for money yet. */
window.POPCOIN_REF_GBP = 0.01;
