import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export function adminAuth() {
  return getAuth(initAdminApp());
}

export function adminDb() {
  return getFirestore(initAdminApp());
}
