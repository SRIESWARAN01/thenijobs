// ============================================================
// THENIJOBS — Auth Repository Implementation
// ============================================================

import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:thenijobs/features/auth/domain/repositories/auth_repository.dart';
import 'package:thenijobs/shared/data/models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final fb.FirebaseAuth _firebaseAuth;
  final FirebaseFirestore _firestore;
  final GoogleSignIn _googleSignIn;

  UserModel? _cachedUser;

  AuthRepositoryImpl({
    fb.FirebaseAuth? firebaseAuth,
    FirebaseFirestore? firestore,
    GoogleSignIn? googleSignIn,
  })  : _firebaseAuth = firebaseAuth ?? fb.FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn();

  @override
  Stream<UserModel?> get authStateChanges {
    return _firebaseAuth.authStateChanges().asyncMap((fbUser) async {
      if (fbUser == null) {
        _cachedUser = null;
        return null;
      }
      return await _fetchUserModel(fbUser.uid);
    });
  }

  @override
  UserModel? get currentUser => _cachedUser;

  Future<UserModel?> _fetchUserModel(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (doc.exists && doc.data() != null) {
        _cachedUser = UserModel.fromFirestore(doc.data()!, uid);
        return _cachedUser;
      }
      return null;
    } catch (e) {
      // Fallback or log error
      return null;
    }
  }

  @override
  Future<void> signInWithEmail(String email, String password) async {
    await _firebaseAuth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    // Trigger cache refresh
    final fbUser = _firebaseAuth.currentUser;
    if (fbUser != null) {
      await _fetchUserModel(fbUser.uid);
    }
  }

  @override
  Future<void> signInWithGoogle() async {
    final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
    if (googleUser == null) {
      throw fb.FirebaseAuthException(
        code: 'ERROR_ABORTED_BY_USER',
        message: 'Sign in aborted by user',
      );
    }

    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    final fb.AuthCredential credential = fb.GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final fb.UserCredential userCredential = await _firebaseAuth.signInWithCredential(credential);
    final fb.User? fbUser = userCredential.user;

    if (fbUser != null) {
      // Seed Firestore document if first time
      final doc = await _firestore.collection('users').doc(fbUser.uid).get();
      if (!doc.exists) {
        final newUser = UserModel(
          uid: fbUser.uid,
          email: fbUser.email ?? '',
          displayName: fbUser.displayName ?? '',
          photoURL: fbUser.photoURL,
          phone: fbUser.phoneNumber,
          role: UserRole.jobSeeker,
          isVerified: fbUser.emailVerified,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        await _firestore.collection('users').doc(fbUser.uid).set(newUser.toFirestore());
      }
      await _fetchUserModel(fbUser.uid);
    }
  }

  @override
  Future<void> sendPasswordResetEmail(String email) async {
    await _firebaseAuth.sendPasswordResetEmail(email: email);
  }

  @override
  Future<String> sendPhoneOTP(String phoneNumber) async {
    final completer = Completer<String>();

    await _firebaseAuth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (fb.PhoneAuthCredential credential) async {
        await _firebaseAuth.signInWithCredential(credential);
        final fbUser = _firebaseAuth.currentUser;
        if (fbUser != null) {
          if (!completer.isCompleted) {
            completer.complete('');
          }
        }
      },
      verificationFailed: (fb.FirebaseAuthException e) {
        if (!completer.isCompleted) {
          completer.completeError(e);
        }
      },
      codeSent: (String verificationId, int? resendToken) {
        if (!completer.isCompleted) {
          completer.complete(verificationId);
        }
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        // Handle timeout if needed
      },
    );

    return completer.future;
  }

  @override
  Future<void> verifyPhoneOTP(String verificationId, String smsCode) async {
    final fb.AuthCredential credential = fb.PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );

    final fb.UserCredential userCredential = await _firebaseAuth.signInWithCredential(credential);
    final fb.User? fbUser = userCredential.user;

    if (fbUser != null) {
      // Seed Firestore doc if first-time phone sign-in
      final docSnapshot = await _firestore.collection('users').doc(fbUser.uid).get();
      if (!docSnapshot.exists) {
        final newUser = UserModel(
          uid: fbUser.uid,
          email: '',
          displayName: fbUser.phoneNumber ?? 'User',
          phone: fbUser.phoneNumber,
          role: UserRole.jobSeeker,
          isVerified: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        await _firestore.collection('users').doc(fbUser.uid).set(newUser.toFirestore());
      }
      await _fetchUserModel(fbUser.uid);
    }
  }

  @override
  Future<void> createAccount({
    required String email,
    required String password,
    required String displayName,
    required String role,
    String? phone,
  }) async {
    final fb.UserCredential cred = await _firebaseAuth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    final fb.User? fbUser = cred.user;

    if (fbUser != null) {
      await fbUser.updateDisplayName(displayName);

      final newUser = UserModel(
        uid: fbUser.uid,
        email: email,
        displayName: displayName,
        phone: phone,
        role: UserRole.fromString(role),
        isVerified: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await _firestore.collection('users').doc(fbUser.uid).set(newUser.toFirestore());
      await _fetchUserModel(fbUser.uid);
    }
  }

  @override
  Future<void> logout() async {
    await _firebaseAuth.signOut();
    await _googleSignIn.signOut();
    _cachedUser = null;
  }
}
