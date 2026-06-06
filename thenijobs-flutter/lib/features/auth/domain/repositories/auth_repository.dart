// ============================================================
// THENIJOBS — Auth Repository Interface
// ============================================================

import 'package:thenijobs/shared/data/models/user_model.dart';

abstract class AuthRepository {
  /// Stream of Auth State changes mapped to our Firestore User model
  Stream<UserModel?> get authStateChanges;

  /// Get the currently logged-in user profile
  UserModel? get currentUser;

  /// Sign in with Email and Password
  Future<void> signInWithEmail(String email, String password);

  /// Sign in with Google (OAuth)
  Future<void> signInWithGoogle();

  /// Send a Firebase password reset email
  Future<void> sendPasswordResetEmail(String email);

  /// Send Phone OTP – returns the verificationId
  Future<String> sendPhoneOTP(String phoneNumber);

  /// Verify Phone OTP and sign in
  Future<void> verifyPhoneOTP(String verificationId, String smsCode);

  /// Create a new account and seed the Firestore user document
  Future<void> createAccount({
    required String email,
    required String password,
    required String displayName,
    required String role,
    String? phone,
  });

  /// Log out of Firebase and clear local session
  Future<void> logout();
}
