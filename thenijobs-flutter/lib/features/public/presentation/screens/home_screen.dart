// ============================================================
// THENIJOBS — HomeScreen (Main Portal Landing Page)
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/shared/data/models/user_model.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/features/public/presentation/widgets/hero_section.dart';
import 'package:thenijobs/features/public/presentation/widgets/search_hub.dart';
import 'package:thenijobs/features/public/presentation/widgets/stats_section.dart';
import 'package:thenijobs/features/public/presentation/widgets/own_creation_features.dart';
import 'package:thenijobs/features/public/presentation/widgets/categories_section.dart';
import 'package:thenijobs/features/public/presentation/widgets/trending_jobs.dart';
import 'package:thenijobs/features/public/presentation/widgets/featured_businesses.dart';
import 'package:thenijobs/features/public/presentation/widgets/business_updates.dart';
import 'package:thenijobs/features/public/presentation/widgets/testimonials_section.dart';
import 'package:thenijobs/features/public/presentation/widgets/home_footer.dart';
import 'package:thenijobs/shared/widgets/floating_whatsapp.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  String _getPortalPathForRole(UserRole role) {
    switch (role) {
      case UserRole.admin:
      case UserRole.superAdmin:
        return '/admin/dashboard';
      case UserRole.employer:
      case UserRole.businessOwner:
        return '/employer/dashboard';
      case UserRole.jobSeeker:
      default:
        return '/seeker/dashboard';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateStreamProvider);
    final user = authState.value;

    final logoWidget = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.work, size: 22, color: AppTheme.primaryPurple),
        const SizedBox(width: 8),
        Text(
          'THE',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF0F172A).withOpacity(0.7),
          ),
        ),
        const Text(
          'NIJOBS',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: AppTheme.brandCyan,
          ),
        ),
      ],
    );

    return Scaffold(
      backgroundColor: AppTheme.lightBg,
      appBar: AppBar(
        title: logoWidget,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 1,
        shadowColor: Colors.black.withOpacity(0.1),
        actions: [
          if (user != null) ...[
            TextButton.icon(
              onPressed: () => context.push(_getPortalPathForRole(user.role)),
              icon: const Icon(Icons.dashboard_customize_outlined, size: 16),
              label: const Text('Portal', style: TextStyle(fontWeight: FontWeight.bold)),
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.primaryPurple,
              ),
            ),
          ] else ...[
            TextButton.icon(
              onPressed: () => context.push('/login'),
              icon: const Icon(Icons.login_outlined, size: 16),
              label: const Text('Login', style: TextStyle(fontWeight: FontWeight.bold)),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF0F172A),
              ),
            ),
          ],
          const SizedBox(width: 8),
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primaryPurple, AppTheme.brandIndigo],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.work, size: 24, color: Colors.white),
                    const SizedBox(width: 8),
                    Text(
                      'THE',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Colors.white.withOpacity(0.75),
                      ),
                    ),
                    const Text(
                      'NIJOBS',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.brandCyan,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.home_outlined),
              title: const Text('Home', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.of(context).pop();
              },
            ),
            ListTile(
              leading: const Icon(Icons.work_outline),
              title: const Text('Jobs', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.of(context).pop();
                context.push('/jobs');
              },
            ),
            ListTile(
              leading: const Icon(Icons.business_outlined),
              title: const Text('Businesses', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.of(context).pop();
                context.push('/businesses');
              },
            ),
            ListTile(
              leading: const Icon(Icons.construction_outlined),
              title: const Text('Services', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.of(context).pop();
                context.push('/services');
              },
            ),
            ListTile(
              leading: const Icon(Icons.payments_outlined),
              title: const Text('Pricing', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.of(context).pop();
                context.push('/pricing');
              },
            ),
            const Divider(),
            if (user != null) ...[
              ListTile(
                leading: const Icon(Icons.account_circle_outlined),
                title: Text('Portal: ${user.displayName}', style: const TextStyle(fontWeight: FontWeight.bold)),
                onTap: () {
                  Navigator.of(context).pop();
                  context.push(_getPortalPathForRole(user.role));
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout_outlined, color: Colors.red),
                title: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                onTap: () async {
                  Navigator.of(context).pop();
                  await ref.read(authNotifierProvider.notifier).logout();
                },
              ),
            ] else ...[
              ListTile(
                leading: const Icon(Icons.login_outlined),
                title: const Text('Login / Register', style: TextStyle(fontWeight: FontWeight.bold)),
                onTap: () {
                  Navigator.of(context).pop();
                  context.push('/login');
                },
              ),
            ],
          ],
        ),
      ),
      body: const SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              HeroSection(),
              SearchHub(),
              StatsSection(),
              OwnCreationFeatures(),
              CategoriesSection(),
              TrendingJobs(),
              FeaturedBusinesses(),
              BusinessUpdates(),
              TestimonialsSection(),
              HomeFooter(),
            ],
          ),
        ),
      ),
      floatingActionButton: const FloatingWhatsApp(),
    );
  }
}
