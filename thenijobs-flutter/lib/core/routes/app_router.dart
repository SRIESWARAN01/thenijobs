// ============================================================
// THENIJOBS — Navigation & Routing (GoRouter + Riverpod)
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/routes/route_screens.dart';
import 'package:thenijobs/shared/data/models/user_model.dart';
import 'package:thenijobs/features/public/presentation/screens/home_screen.dart';
import 'package:thenijobs/features/public/presentation/screens/jobs_screen.dart';
import 'package:thenijobs/features/public/presentation/screens/job_detail_screen.dart';
import 'package:thenijobs/features/public/presentation/screens/businesses_screen.dart';
import 'package:thenijobs/features/public/presentation/screens/company_detail_screen.dart';
import 'package:thenijobs/features/public/presentation/screens/services_screen.dart';
import 'package:thenijobs/features/public/presentation/screens/pricing_screen.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/features/auth/presentation/screens/login_screen.dart';
import 'package:thenijobs/features/auth/presentation/screens/register_screen.dart';
import 'package:thenijobs/features/auth/presentation/screens/forgot_password_screen.dart';

// ===== ROUTER REFRESH LISTENABLE =====
class RouterRefreshListenable extends ChangeNotifier {
  RouterRefreshListenable(Ref ref) {
    ref.listen(authStateStreamProvider, (previous, next) {
      notifyListeners();
    });
  }
}

final routerRefreshListenableProvider = Provider<RouterRefreshListenable>((ref) {
  return RouterRefreshListenable(ref);
});

// ===== HELPER: ROLE TO PORTAL REDIRECT =====
String _getDashboardForRole(UserRole role) {
  switch (role) {
    case UserRole.admin:
    case UserRole.superAdmin:
      return '/admin/dashboard';
    case UserRole.employer:
    case UserRole.businessOwner:
      return '/employer/dashboard';
    case UserRole.jobSeeker:
    case UserRole.supplier:
    case UserRole.serviceProvider:
    default:
      return '/seeker/dashboard';
  }
}

// ===== APP ROUTER PROVIDER =====
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateStreamProvider);
  final refreshListenable = ref.watch(routerRefreshListenableProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refreshListenable,
    redirect: (context, state) {
      final user = authState.value;
      final loading = authState.isLoading;

      // Do not redirect while loading the initial auth state
      if (loading) return null;

      final matchedPath = state.matchedLocation;
      final loggingIn = matchedPath == '/login' ||
          matchedPath == '/register' ||
          matchedPath == '/forgot-password' ||
          matchedPath == '/admin/login';

      // If user is NOT logged in:
      if (user == null) {
        // Guard protected portal routes
        if (matchedPath.startsWith('/seeker') ||
            matchedPath.startsWith('/employer') ||
            (matchedPath.startsWith('/admin') && matchedPath != '/admin/login')) {
          return '/login';
        }
        return null;
      }

      // If user IS logged in:
      if (loggingIn) {
        // Prevent logged-in users from seeing login screens, route to their portal
        return _getDashboardForRole(user.role);
      }

      // Role authorization guards:
      if (matchedPath.startsWith('/seeker') && user.role != UserRole.jobSeeker) {
        return _getDashboardForRole(user.role);
      }
      
      if (matchedPath.startsWith('/employer') &&
          user.role != UserRole.employer &&
          user.role != UserRole.businessOwner) {
        return _getDashboardForRole(user.role);
      }
      
      if (matchedPath.startsWith('/admin') &&
          user.role != UserRole.admin &&
          user.role != UserRole.superAdmin) {
        return _getDashboardForRole(user.role);
      }

      return null;
    },
    routes: [
      // ===== PUBLIC ROUTES =====
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/jobs',
        builder: (context, state) => JobsScreen(
          initialSearch: state.uri.queryParameters['search'],
          initialLocation: state.uri.queryParameters['location'] ?? state.uri.queryParameters['area'],
          initialCategory: state.uri.queryParameters['category'],
        ),
      ),
      GoRoute(
        path: '/jobs/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return JobDetailScreen(jobId: id);
        },
      ),
      GoRoute(
        path: '/businesses',
        builder: (context, state) => BusinessesScreen(
          initialSearch: state.uri.queryParameters['search'],
          initialCategory: state.uri.queryParameters['category'],
          initialDistrict: state.uri.queryParameters['area'] ?? state.uri.queryParameters['district'],
        ),
      ),
      GoRoute(
        path: '/businesses/:category',
        builder: (context, state) => BusinessesScreen(
          initialCategory: state.pathParameters['category'],
          initialSearch: state.uri.queryParameters['search'],
          initialDistrict: state.uri.queryParameters['area'] ?? state.uri.queryParameters['district'],
        ),
      ),
      GoRoute(
        path: '/company/register',
        builder: (context, state) => const CompanyRegisterScreen(),
      ),
      GoRoute(
        path: '/company/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return CompanyDetailScreen(companyId: id);
        },
      ),
      GoRoute(
        path: '/pricing',
        builder: (context, state) => const PricingScreen(),
      ),
      GoRoute(
        path: '/services',
        builder: (context, state) => ServicesScreen(
          initialSearch: state.uri.queryParameters['search'],
          initialCategory: state.uri.queryParameters['category'],
          initialDistrict: state.uri.queryParameters['area'] ?? state.uri.queryParameters['district'],
        ),
      ),
      GoRoute(
        path: '/id/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return PublicThenijobsIdScreen(identifier: id);
        },
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const PublicProfileScreen(),
      ),
      GoRoute(
        path: '/profile/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return PublicProfileScreen(identifier: id);
        },
      ),

      // ===== SEEKER PORTAL ROUTES =====
      GoRoute(
        path: '/seeker/dashboard',
        builder: (context, state) => const SeekerDashboardScreen(),
      ),
      GoRoute(
        path: '/seeker/profile',
        builder: (context, state) => const SeekerProfileScreen(),
      ),
      GoRoute(
        path: '/seeker/resume',
        builder: (context, state) => const SeekerResumeScreen(),
      ),
      GoRoute(
        path: '/seeker/resume/builder',
        builder: (context, state) => const SeekerResumeScreen(),
      ),
      GoRoute(
        path: '/seeker/applications',
        builder: (context, state) => const SeekerApplicationsScreen(),
      ),
      GoRoute(
        path: '/seeker/saved-jobs',
        builder: (context, state) => const SeekerSavedJobsScreen(),
      ),
      GoRoute(
        path: '/seeker/job-alerts',
        builder: (context, state) => const SeekerJobAlertsScreen(),
      ),
      GoRoute(
        path: '/seeker/interviews',
        builder: (context, state) => const SeekerInterviewsScreen(),
      ),
      GoRoute(
        path: '/seeker/messages',
        builder: (context, state) => const SeekerMessagesScreen(),
      ),
      GoRoute(
        path: '/seeker/notifications',
        builder: (context, state) => const SeekerNotificationsScreen(),
      ),
      GoRoute(
        path: '/seeker/rewards',
        builder: (context, state) => const SeekerRewardsScreen(),
      ),
      GoRoute(
        path: '/seeker/ai-coach',
        builder: (context, state) => const SeekerAICoachScreen(),
      ),
      GoRoute(
        path: '/seeker/skills',
        builder: (context, state) => const SeekerSkillsScreen(),
      ),
      GoRoute(
        path: '/seeker/subscription',
        builder: (context, state) => const SeekerSubscriptionScreen(),
      ),
      GoRoute(
        path: '/seeker/settings',
        builder: (context, state) => const SeekerSettingsScreen(),
      ),

      // ===== EMPLOYER PORTAL ROUTES =====
      GoRoute(
        path: '/employer/dashboard',
        builder: (context, state) => const EmployerDashboardScreen(),
      ),
      GoRoute(
        path: '/employer/company-profile',
        builder: (context, state) => const EmployerCompanyProfileScreen(),
      ),
      GoRoute(
        path: '/employer/post-job',
        builder: (context, state) => const EmployerPostJobScreen(),
      ),
      GoRoute(
        path: '/employer/jobs',
        builder: (context, state) => const EmployerJobsScreen(),
      ),
      GoRoute(
        path: '/employer/candidates',
        builder: (context, state) => const EmployerCandidatesScreen(),
      ),
      GoRoute(
        path: '/employer/talent-search',
        builder: (context, state) => const EmployerTalentSearchScreen(),
      ),
      GoRoute(
        path: '/employer/interviews',
        builder: (context, state) => const EmployerInterviewsScreen(),
      ),
      GoRoute(
        path: '/employer/leads',
        builder: (context, state) => const EmployerLeadsScreen(),
      ),
      GoRoute(
        path: '/employer/reviews',
        builder: (context, state) => const EmployerReviewsScreen(),
      ),
      GoRoute(
        path: '/employer/messages',
        builder: (context, state) => const EmployerMessagesScreen(),
      ),
      GoRoute(
        path: '/employer/billing',
        builder: (context, state) => const EmployerBillingScreen(),
      ),
      GoRoute(
        path: '/employer/subscription',
        builder: (context, state) => const EmployerSubscriptionScreen(),
      ),
      GoRoute(
        path: '/employer/reports',
        builder: (context, state) => const EmployerReportsScreen(),
      ),
      GoRoute(
        path: '/employer/settings',
        builder: (context, state) => const EmployerSettingsScreen(),
      ),

      // ===== ADMIN PORTAL ROUTES =====
      GoRoute(
        path: '/admin/login',
        builder: (context, state) => const AdminLoginScreen(),
      ),
      GoRoute(
        path: '/admin/dashboard',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/admin/businesses',
        builder: (context, state) => const AdminBusinessesScreen(),
      ),
      GoRoute(
        path: '/admin/jobs',
        builder: (context, state) => const AdminJobsScreen(),
      ),
      GoRoute(
        path: '/admin/users',
        builder: (context, state) => const AdminUsersScreen(),
      ),
      GoRoute(
        path: '/admin/leads',
        builder: (context, state) => const AdminLeadsScreen(),
      ),
      GoRoute(
        path: '/admin/services',
        builder: (context, state) => const AdminServicesScreen(),
      ),
      GoRoute(
        path: '/admin/subscriptions',
        builder: (context, state) => const AdminSubscriptionsScreen(),
      ),
      GoRoute(
        path: '/admin/ads',
        builder: (context, state) => const AdminAdsScreen(),
      ),
      GoRoute(
        path: '/admin/reviews',
        builder: (context, state) => const AdminReviewsScreen(),
      ),
      GoRoute(
        path: '/admin/notifications',
        builder: (context, state) => const AdminNotificationsScreen(),
      ),
      GoRoute(
        path: '/admin/reports',
        builder: (context, state) => const AdminReportsScreen(),
      ),
      GoRoute(
        path: '/admin/security',
        builder: (context, state) => const AdminSecurityScreen(),
      ),
      GoRoute(
        path: '/admin/settings',
        builder: (context, state) => const AdminSettingsScreen(),
      ),
    ],
  );
});
