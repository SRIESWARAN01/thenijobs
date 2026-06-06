'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  signOut,
  GoogleAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  linkWithCredential,
  updatePhoneNumber,
  updateProfile,
  type User as FirebaseUser,
  type ConfirmationResult,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { syncMobileVerification } from '@/lib/firebase/platformActions';
import type { User, UserRole } from '@/lib/types';

// ───────────────────────────── Types ─────────────────────────────

export interface AuthState {
  /** Firebase auth user object */
  firebaseUser: FirebaseUser | null;
  /** THENIJOBS user profile from Firestore */
  user: User | null;
  /** True while initial auth check or Firestore fetch is in progress */
  loading: boolean;
  /** Latest auth-related error message */
  error: string | null;
}

export interface AuthActions {
  /** Email + password sign-in */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Google OAuth sign-in (popup) */
  signInWithGoogle: (defaultRole?: UserRole) => Promise<void>;
  /** Send OTP to phone number – returns ConfirmationResult for verification */
  sendPhoneOTP: (
    phoneNumber: string,
    recaptchaContainerId: string,
  ) => Promise<ConfirmationResult>;
  /** Verify phone OTP and complete sign-in */
  verifyPhoneOTP: (
    confirmationResult: ConfirmationResult,
    otp: string,
  ) => Promise<void>;
  /** Send OTP for linking/verifying the logged-in user's mobile number */
  sendMobileVerificationOTP: (
    phoneNumber: string,
    recaptchaContainerId: string,
  ) => Promise<string>;
  /** Verify OTP, link/update Firebase Auth phone, and sync verified status */
  verifyMobileVerificationOTP: (
    verificationId: string,
    otp: string,
  ) => Promise<void>;
  /** Create a new account (email + password) and seed Firestore user doc */
  createAccount: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    phone?: string,
  ) => Promise<void>;
  /** Sign out of Firebase */
  logout: () => Promise<void>;
  /** Clear the current error */
  clearError: () => void;
}

export interface AuthHelpers {
  /** True if the current user has an admin or super_admin role */
  isAdmin: boolean;
  /** True if the current user has employer or business_owner role */
  isEmployer: boolean;
  /** True if the current user is a job_seeker */
  isSeeker: boolean;
}

export type AuthContextValue = AuthState & AuthActions & AuthHelpers;

// ───────────────────────────── Context ─────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ───────────────────────────── Provider ─────────────────────────────

const googleProvider = new GoogleAuthProvider();

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Wraps the application and provides authentication state + helpers
 * via React context. Place this at the root layout level.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch Firestore user profile ──────────────────────────────
  const fetchUserProfile = useCallback(async (uid: string): Promise<User | null> => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return { uid, ...snap.data() } as User;
      }
      return null;
    } catch (err) {
      console.error('[AuthContext] Failed to fetch user profile:', err);
      return null;
    }
  }, []);

  // ── Auth state listener ───────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        let profile = await fetchUserProfile(fbUser.uid);
        if (
          profile &&
          fbUser.phoneNumber &&
          !profile.mobileVerified &&
          !profile.phoneVerified
        ) {
          try {
            await syncMobileVerification();
            profile = await fetchUserProfile(fbUser.uid);
          } catch (err) {
            console.error('[AuthContext] Failed to sync mobile verification:', err);
          }
        }
        setUser(profile);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  // ── Helpers ───────────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback((err: unknown, fallback: string) => {
    const message =
      err instanceof Error ? err.message : fallback;
    setError(message);
    throw err;
  }, []);

  // ── Sign in with email + password ─────────────────────────────
  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setLoading(false);
        handleError(err, 'Failed to sign in with email and password.');
      }
    },
    [handleError],
  );

  // ── Sign in with Google ───────────────────────────────────────
  const signInWithGoogle = useCallback(async (defaultRole: UserRole = 'job_seeker') => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // Seed Firestore doc if first-time Google sign-in
      const existing = await getDoc(doc(db, 'users', fbUser.uid));
      if (!existing.exists()) {
        const newUser: Omit<User, 'uid'> = {
          email: fbUser.email ?? '',
          displayName: fbUser.displayName ?? '',
          role: defaultRole,
          isVerified: fbUser.emailVerified,
          mobileVerified: Boolean(fbUser.phoneNumber),
          phoneVerified: Boolean(fbUser.phoneNumber),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        if (fbUser.photoURL) newUser.photoURL = fbUser.photoURL;
        if (fbUser.phoneNumber) newUser.phone = fbUser.phoneNumber;
        await setDoc(doc(db, 'users', fbUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setLoading(false);
      handleError(err, 'Failed to sign in with Google.');
    }
  }, [handleError]);

  // ── Phone auth – send OTP ────────────────────────────────────
  const sendPhoneOTP = useCallback(
    async (phoneNumber: string, recaptchaContainerId: string) => {
      setError(null);
      try {
        const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
          size: 'invisible',
        });
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        return confirmation;
      } catch (err) {
        handleError(err, 'Failed to send OTP. Please try again.');
        // handleError always throws so TS knows this is unreachable,
        // but we add a throw for type narrowing safety.
        throw err;
      }
    },
    [handleError],
  );

  // ── Phone auth – verify OTP ──────────────────────────────────
  const verifyPhoneOTP = useCallback(
    async (confirmationResult: ConfirmationResult, otp: string) => {
      setError(null);
      setLoading(true);
      try {
        const result = await confirmationResult.confirm(otp);
        const fbUser = result.user;

        // Seed Firestore doc if first-time phone sign-in
        const existing = await getDoc(doc(db, 'users', fbUser.uid));
        if (!existing.exists()) {
          const newUser: Omit<User, 'uid'> = {
            email: '',
          displayName: fbUser.phoneNumber ?? '',
          role: 'job_seeker',
          isVerified: true,
          mobileVerified: Boolean(fbUser.phoneNumber),
          phoneVerified: Boolean(fbUser.phoneNumber),
          mobileVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
          if (fbUser.phoneNumber) newUser.phone = fbUser.phoneNumber;
          await setDoc(doc(db, 'users', fbUser.uid), {
            ...newUser,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        setLoading(false);
        handleError(err, 'Invalid OTP. Please try again.');
      }
    },
    [handleError],
  );

  const sendMobileVerificationOTP = useCallback(
    async (phoneNumber: string, recaptchaContainerId: string): Promise<string> => {
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        const msg = 'Please sign in before verifying your mobile number.';
        setError(msg);
        throw new Error(msg);
      }

      try {
        const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
          size: 'invisible',
        });
        const provider = new PhoneAuthProvider(auth);
        return await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
      } catch (err) {
        handleError(err, 'Failed to send mobile verification OTP.');
        throw err;
      }
    },
    [handleError],
  );

  const verifyMobileVerificationOTP = useCallback(
    async (verificationId: string, otp: string): Promise<void> => {
      setError(null);
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('Please sign in before verifying your mobile number.');
        }

        const credential = PhoneAuthProvider.credential(verificationId, otp);
        if (currentUser.phoneNumber) {
          await updatePhoneNumber(currentUser, credential);
        } else {
          await linkWithCredential(currentUser, credential);
        }

        const result = await syncMobileVerification();
        setUser((prev) => prev
          ? {
              ...prev,
              phone: result.phone,
              mobileVerified: true,
              phoneVerified: true,
              updatedAt: new Date(),
            }
          : prev);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        handleError(err, 'Invalid OTP. Please try again.');
      }
    },
    [handleError],
  );

  // ── Create account (email + password) ─────────────────────────
  const createAccount = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: UserRole,
      phone?: string,
    ) => {
      setError(null);
      setLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = cred.user;

        // Update Firebase Auth display name
        await updateProfile(fbUser, { displayName });

        // Create Firestore user doc
        const newUser: Omit<User, 'uid'> = {
          email,
          displayName,
          role,
          isVerified: false,
          mobileVerified: false,
          phoneVerified: false,
          ...(phone ? { phone } : {}),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await setDoc(doc(db, 'users', fbUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        setLoading(false);
        handleError(err, 'Failed to create account. Please try again.');
      }
    },
    [handleError],
  );

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      handleError(err, 'Failed to sign out.');
    }
  }, [handleError]);

  // ── Role helpers ──────────────────────────────────────────────
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isEmployer = user?.role === 'employer' || user?.role === 'business_owner';
  const isSeeker = user?.role === 'job_seeker';

  // ── Memoised context value ────────────────────────────────────
  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      loading,
      error,
      signInWithEmail,
      signInWithGoogle,
      sendPhoneOTP,
      verifyPhoneOTP,
      sendMobileVerificationOTP,
      verifyMobileVerificationOTP,
      createAccount,
      logout,
      clearError,
      isAdmin,
      isEmployer,
      isSeeker,
    }),
    [
      firebaseUser,
      user,
      loading,
      error,
      signInWithEmail,
      signInWithGoogle,
      sendPhoneOTP,
      verifyPhoneOTP,
      sendMobileVerificationOTP,
      verifyMobileVerificationOTP,
      createAccount,
      logout,
      clearError,
      isAdmin,
      isEmployer,
      isSeeker,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ───────────────────────────── Hook ─────────────────────────────

/**
 * Access the current authentication state, actions, and role helpers.
 * Must be used inside `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
