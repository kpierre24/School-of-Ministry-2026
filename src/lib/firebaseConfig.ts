export function getFirebaseConfig() {
  const env = import.meta.env;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = env.VITE_FIREBASE_API_KEY;
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN;
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET;
  const firestoreDatabaseId = env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = env.VITE_FIREBASE_APP_ID;
  const measurementId = env.VITE_FIREBASE_MEASUREMENT_ID;
  const oAuthClientId = env.VITE_FIREBASE_OAUTH_CLIENT_ID;
  const recaptchaSiteKey = env.VITE_FIREBASE_RECAPTCHA_SITE_KEY;

  if (!projectId || !apiKey) {
    throw new Error("Missing required Firebase env vars: VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY");
  }

  return {
    projectId,
    apiKey,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    storageBucket: storageBucket || `${projectId}.firebasestorage.app`,
    firestoreDatabaseId: firestoreDatabaseId || "",
    messagingSenderId: messagingSenderId || "",
    appId: appId || "",
    measurementId: measurementId || "",
    oAuthClientId: oAuthClientId || "",
    recaptchaSiteKey: recaptchaSiteKey || "",
  };
}
