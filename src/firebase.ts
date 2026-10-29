import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const env = import.meta.env;

/** Local rehearsal mode: talk to `npm run emulators` instead of the real project. */
export const useEmulators = env.VITE_USE_EMULATORS === 'true';

const DEMO_PROJECT = 'demo-costume-contest';

const firebaseConfig = useEmulators
  ? {
      apiKey: 'demo-key',
      authDomain: `${DEMO_PROJECT}.firebaseapp.com`,
      projectId: DEMO_PROJECT,
      storageBucket: `${DEMO_PROJECT}.appspot.com`,
    }
  : {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    };

/** False until the .env.local values are filled in; the app shows a setup screen instead of crashing. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.storageBucket,
);

// A placeholder project id keeps SDK initialization from throwing before setup is done.
export const app = initializeApp(
  isFirebaseConfigured ? firebaseConfig : { ...firebaseConfig, projectId: 'demo-unconfigured' },
);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Use the page's own hostname so phones on the same Wi-Fi reach the emulators on this machine.
export const emulatorHost = window.location.hostname;
if (useEmulators) {
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectStorageEmulator(storage, emulatorHost, 9199);
}
