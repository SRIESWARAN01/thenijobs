// ============================================================
// THENIJOBS — App Entry Point
// ============================================================

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:thenijobs/core/config/firebase_config.dart';
import 'package:thenijobs/core/routes/app_router.dart';
import 'package:thenijobs/core/theme/app_theme.dart';

void main() async {
  // Ensure Flutter engine bindings are fully initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase using custom options configuration
  await Firebase.initializeApp(
    options: FirebaseConfig.currentPlatform,
  );

  // Initialize Hive for local persistent caching/settings
  await Hive.initFlutter();
  await Hive.openBox('settings');

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    // Watch theme settings if stored locally in Hive
    final settingsBox = Hive.box('settings');
    final isDarkMode = settingsBox.get('darkMode', defaultValue: false) as bool;

    return MaterialApp.router(
      title: 'TheNiJobs',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: isDarkMode ? ThemeMode.dark : ThemeMode.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
