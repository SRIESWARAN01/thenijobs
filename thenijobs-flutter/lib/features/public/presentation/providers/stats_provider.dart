// ============================================================
// THENIJOBS — Real-time Stats & Home Page Providers
// ============================================================

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/shared/data/models/activity_log_model.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';
import 'package:thenijobs/shared/data/models/company_model.dart';
import 'package:thenijobs/shared/data/models/service_model.dart';
import 'package:thenijobs/shared/data/models/review_model.dart';
import 'package:thenijobs/shared/data/models/seeker_profile_model.dart';

final activeJobsCountProvider = StreamProvider<int>((ref) {
  return FirebaseFirestore.instance
      .collection('jobs')
      .where('isActive', isEqualTo: true)
      .snapshots()
      .map((snap) => snap.docs.length);
});

final totalCompaniesCountProvider = StreamProvider<int>((ref) {
  return FirebaseFirestore.instance
      .collection('companies')
      .snapshots()
      .map((snap) => snap.docs.length);
});

final totalUsersCountProvider = StreamProvider<int>((ref) {
  return FirebaseFirestore.instance
      .collection('users')
      .snapshots()
      .map((snap) => snap.docs.length);
});

final totalSeekersCountProvider = StreamProvider<int>((ref) {
  return FirebaseFirestore.instance
      .collection('users')
      .where('role', isEqualTo: 'job_seeker')
      .snapshots()
      .map((snap) => snap.docs.length);
});

final verifiedCompaniesCountProvider = StreamProvider<int>((ref) {
  return FirebaseFirestore.instance
      .collection('companies')
      .where('verificationStatus', isEqualTo: 'verified')
      .snapshots()
      .map((snap) => snap.docs.length);
});

final liveUpdatesProvider = StreamProvider<List<ActivityLog>>((ref) {
  return FirebaseFirestore.instance
      .collection('activityLogs')
      .orderBy('timestamp', descending: true)
      .limit(3)
      .snapshots()
      .map((snap) => snap.docs
          .map((doc) => ActivityLog.fromFirestore(doc.data(), doc.id))
          .toList());
});

// Stream of trending (approved & active) jobs
final trendingJobsProvider = StreamProvider<List<Job>>((ref) {
  return FirebaseFirestore.instance
      .collection('jobs')
      .where('isActive', isEqualTo: true)
      .limit(6)
      .snapshots()
      .map((snap) => snap.docs
          .map((doc) => Job.fromFirestore(doc.data(), doc.id))
          .toList());
});

// Stream of featured & verified companies
final featuredBusinessesProvider = StreamProvider<List<Company>>((ref) {
  return FirebaseFirestore.instance
      .collection('companies')
      .where('verificationStatus', isEqualTo: 'verified')
      .where('isFeatured', isEqualTo: true)
      .limit(4)
      .snapshots()
      .map((snap) => snap.docs
          .map((doc) => Company.fromFirestore(doc.data(), doc.id))
          .toList());
});

// Stream of latest active services
final latestServicesProvider = StreamProvider<List<Service>>((ref) {
  return FirebaseFirestore.instance
      .collection('services')
      .where('status', isEqualTo: 'active')
      .limit(3)
      .snapshots()
      .map((snap) => snap.docs
          .map((doc) => Service.fromFirestore(doc.data(), doc.id))
          .toList());
});

// Stream of approved community reviews
final testimonialsReviewsProvider = StreamProvider<List<Review>>((ref) {
  return FirebaseFirestore.instance
      .collection('reviews')
      .where('isVerified', isEqualTo: true)
      .limit(6)
      .snapshots()
      .map((snap) => snap.docs
          .map((doc) => Review.fromFirestore(doc.data(), doc.id))
          .toList());
});

// Stream of all active/approved jobs
final allJobsProvider = StreamProvider<List<Job>>((ref) {
  return FirebaseFirestore.instance
      .collection('jobs')
      .where('isActive', isEqualTo: true)
      .snapshots()
      .map((snap) => snap.docs
          .map((doc) => Job.fromFirestore(doc.data(), doc.id))
          .toList());
});

// Stream of all verified companies
final allCompaniesProvider = StreamProvider<List<Company>>((ref) {
  return FirebaseFirestore.instance
      .collection('companies')
      .where('verificationStatus', isEqualTo: 'verified')
      .snapshots()
      .map((snap) => snap.docs
          .map((doc) => Company.fromFirestore(doc.data(), doc.id))
          .toList());
});

// Stream of all active services
final allServicesProvider = StreamProvider<List<Service>>((ref) {
  return FirebaseFirestore.instance
      .collection('services')
      .where('status', isEqualTo: 'active')
      .snapshots()
      .map((snap) => snap.docs
          .map((doc) => Service.fromFirestore(doc.data(), doc.id))
          .toList());
});

// Stream of saved job IDs for the current user
final savedJobsStreamProvider = StreamProvider<List<String>>((ref) {
  final authState = ref.watch(authStateStreamProvider);
  final user = authState.value;
  if (user == null) return Stream.value([]);
  return FirebaseFirestore.instance
      .collection('savedJobs')
      .where('userId', isEqualTo: user.uid)
      .snapshots()
      .map((snap) => snap.docs.map((doc) => doc.data()['jobId'] as String).toList());
});

// Stream of seeker profile for the logged in user
final seekerProfileProvider = StreamProvider<JobSeekerProfile?>((ref) {
  final authState = ref.watch(authStateStreamProvider);
  final user = authState.value;
  if (user == null) return Stream.value(null);
  return FirebaseFirestore.instance
      .collection('seekerProfiles')
      .doc(user.uid)
      .snapshots()
      .map((snap) => snap.exists ? JobSeekerProfile.fromFirestore(snap.data()!, snap.id) : null);
});

// Stream of a single job detail by ID
final jobDetailProvider = StreamProvider.family<Job?, String>((ref, jobId) {
  return FirebaseFirestore.instance
      .collection('jobs')
      .doc(jobId)
      .snapshots()
      .map((snap) => snap.exists ? Job.fromFirestore(snap.data()!, snap.id) : null);
});

// Stream of a single company by ID or Slug
final companyDetailProvider = StreamProvider.family<Company?, String>((ref, identifier) {
  final firestore = FirebaseFirestore.instance;
  return firestore
      .collection('companies')
      .doc(identifier)
      .snapshots()
      .asyncMap((snap) async {
        if (snap.exists) {
          return Company.fromFirestore(snap.data()!, snap.id);
        }
        final slugSnap = await firestore
            .collection('companies')
            .where('slug', isEqualTo: identifier)
            .limit(1)
            .get();
        if (slugSnap.docs.isNotEmpty) {
          return Company.fromFirestore(slugSnap.docs.first.data(), slugSnap.docs.first.id);
        }
        return null;
      });
});

// Stream of jobs for a company
final companyJobsProvider = StreamProvider.family<List<Job>, String>((ref, companyId) {
  return FirebaseFirestore.instance
      .collection('jobs')
      .where('companyId', isEqualTo: companyId)
      .where('isActive', isEqualTo: true)
      .snapshots()
      .map((snap) => snap.docs.map((doc) => Job.fromFirestore(doc.data(), doc.id)).toList());
});

// Stream of reviews for a company
final companyReviewsProvider = StreamProvider.family<List<Review>, String>((ref, companyId) {
  return FirebaseFirestore.instance
      .collection('reviews')
      .where('targetId', isEqualTo: companyId)
      .snapshots()
      .map((snap) => snap.docs.map((doc) => Review.fromFirestore(doc.data(), doc.id)).toList());
});
