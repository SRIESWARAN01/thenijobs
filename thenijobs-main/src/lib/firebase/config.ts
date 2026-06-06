import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Firebase web configuration.
 * NEXT_PUBLIC_* values are intentionally public, but they must be explicit so
 * production builds cannot silently deploy against the wrong Firebase project.
 */
const requiredEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missingEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (char) => `_${char}`).toUpperCase()}`);

if (missingEnv.length > 0) {
  throw new Error(`Missing Firebase environment variables: ${missingEnv.join(', ')}`);
}

const firebaseConfig = {
  apiKey: requiredEnv.apiKey!,
  authDomain: requiredEnv.authDomain!,
  projectId: requiredEnv.projectId!,
  storageBucket: requiredEnv.storageBucket!,
  messagingSenderId: requiredEnv.messagingSenderId!,
  appId: requiredEnv.appId!,
  measurementId: requiredEnv.measurementId!,
};

/** Firebase app instance (singleton) */
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/** Firebase Authentication */
export const auth = getAuth(app);

/** Cloud Firestore */
export const db = getFirestore(app);

/** Cloud Storage */
export const storage = getStorage(app);

/** Cloud Functions */
export const functions = getFunctions(app, 'asia-south1');

/**
 * Firebase Analytics (lazy, client-only).
 * Returns null on the server or if analytics is unsupported.
 */
export const analytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
