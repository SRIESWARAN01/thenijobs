// ============================================================
// THENIJOBS — Theme & Design Tokens (Dart Port)
// ============================================================

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
export 'tailwind_colors.dart';

class AppTheme {
  // ===== BRAND COLORS =====
  static const Color primaryPurple = Color(0xFF7C3AED);
  static const Color brandViolet = Color(0xFF6D28D9);
  static const Color brandIndigo = Color(0xFF4F46E5);
  static const Color brandCyan = Color(0xFF06B6D4);
  static const Color brandEmerald = Color(0xFF10B981);
  static const Color brandAmber = Color(0xFFF59E0B);
  static const Color brandRose = Color(0xFFF43F5E);

  // ===== LIGHT THEME COLORS (Public Screens) =====
  static const Color lightBg = Color(0xFFF6F8FB);
  static const Color lightCardBg = Colors.white;
  static const Color lightTextPrimary = Color(0xFF0F172A); // slate-900
  static const Color lightTextSecondary = Color(0xFF475569); // slate-600
  static const Color lightBorder = Color(0xFFE2E8F0); // slate-200

  // ===== DARK THEME COLORS (Portal Screens) =====
  static const Color darkBg = Color(0xFF0A0A1A);
  static const Color darkCardBg = Color(0xFF13132B);
  static const Color darkTextPrimary = Color(0xFFF8FAFC); // slate-50
  static const Color darkTextSecondary = Color(0xFF94A3B8); // slate-400
  static const Color darkBorder = Color(0x1AFFFFFF);

  // ===== GRADIENTS =====
  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryPurple, brandIndigo, brandCyan],
  );

  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0F0F23), Color(0xFF1A0A3E), Color(0xFF0F1A3E)],
  );

  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x1A7C3AED), Color(0x0D4F46E5)],
  );

  static const LinearGradient glowGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x337C3AED), Color(0x334F46E5)],
  );

  static const LinearGradient purpleCyanGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryPurple, brandCyan],
  );

  static const LinearGradient emeraldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brandEmerald, brandCyan],
  );

  static const LinearGradient amberGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brandAmber, brandRose],
  );

  // ===== GLASSMORPHISM DECORATIONS =====
  static BoxDecoration glassCard({
    double borderRadius = 16,
    Color? borderColor,
  }) {
    return BoxDecoration(
      color: const Color(0x0AFFFFFF),
      border: Border.all(
        color: borderColor ?? const Color(0x14FFFFFF),
        width: 1,
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: const [
        BoxShadow(
          color: Color(0x66000000),
          blurRadius: 32,
          offset: Offset(0, 8),
        ),
      ],
    );
  }

  static BoxDecoration premiumCard({double borderRadius = 16}) {
    return BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color(0x0AFFFFFF),
          Color(0x03FFFFFF),
        ],
      ),
      border: Border.all(
        color: const Color(0x14FFFFFF),
        width: 1,
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: const [
        BoxShadow(
          color: Color(0x4D000000),
          blurRadius: 32,
          offset: Offset(0, 8),
        ),
      ],
    );
  }

  static BoxDecoration statCard({double borderRadius = 16}) {
    return BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color(0x147C3AED),
          Color(0x0A4F46E5),
        ],
      ),
      border: Border.all(
        color: const Color(0x267C3AED),
        width: 1,
      ),
      borderRadius: BorderRadius.circular(borderRadius),
    );
  }

  // ===== LIGHT THEME CONFIG =====
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: primaryPurple,
      scaffoldBackgroundColor: lightBg,
      cardColor: lightCardBg,
      dividerColor: lightBorder,
      colorScheme: const ColorScheme.light(
        primary: primaryPurple,
        secondary: brandCyan,
        background: lightBg,
        surface: lightCardBg,
        error: brandRose,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.light().textTheme,
      ).copyWith(
        displayLarge: GoogleFonts.outfit(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: lightTextPrimary,
        ),
        displayMedium: GoogleFonts.outfit(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: lightTextPrimary,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: lightTextPrimary,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          color: lightTextPrimary,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          color: lightTextSecondary,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: lightCardBg,
        elevation: 0,
        iconTheme: const IconThemeData(color: lightTextPrimary),
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: lightTextPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: lightCardBg,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: lightBorder),
        ),
      ),
    );
  }

  // ===== DARK THEME CONFIG =====
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryPurple,
      scaffoldBackgroundColor: darkBg,
      cardColor: darkCardBg,
      dividerColor: darkBorder,
      colorScheme: const ColorScheme.dark(
        primary: primaryPurple,
        secondary: brandCyan,
        background: darkBg,
        surface: darkCardBg,
        error: brandRose,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.dark().textTheme,
      ).copyWith(
        displayLarge: GoogleFonts.outfit(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: darkTextPrimary,
        ),
        displayMedium: GoogleFonts.outfit(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: darkTextPrimary,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: darkTextPrimary,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          color: darkTextPrimary,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          color: darkTextSecondary,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: darkBg,
        elevation: 0,
        iconTheme: const IconThemeData(color: darkTextPrimary),
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: darkTextPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: darkCardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: darkBorder),
        ),
      ),
    );
  }
}
