// ============================================================
// THENIJOBS — Login Screen
// ============================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/core/utils/validators.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/shared/widgets/glass_container.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // State management
  String _mode = 'email'; // 'email' or 'phone'
  String _step = 'input'; // 'input' or 'otp'
  bool _showPassword = false;
  
  // Controllers
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  
  // OTP input variables
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());
  
  String _verificationId = '';

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    for (var controller in _otpControllers) {
      controller.dispose();
    }
    for (var node in _otpFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  // Clear errors when toggling modes
  void _switchMode(String newMode) {
    ref.read(authNotifierProvider.notifier).clearError();
    setState(() {
      _mode = newMode;
      _step = 'input';
    });
  }

  // Handle email login
  Future<void> _handleEmailLogin() async {
    if (!_formKey.currentState!.validate()) return;
    
    try {
      await ref.read(authNotifierProvider.notifier).signIn(
        _emailController.text.trim(),
        _passwordController.text,
      );
    } catch (_) {
      // Error is updated in ref, notifier handles presentation
    }
  }

  // Handle sending OTP
  Future<void> _handlePhoneSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    
    try {
      final formattedPhone = '+91${_phoneController.text.trim()}';
      final verificationId = await ref.read(authNotifierProvider.notifier).sendOtp(formattedPhone);
      setState(() {
        _verificationId = verificationId;
        _step = 'otp';
      });
    } catch (_) {
      // Error is handled by provider
    }
  }

  // Handle verifying OTP
  Future<void> _handleVerifyOtp() async {
    final otp = _otpControllers.map((c) => c.text).join();
    if (otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit OTP')),
      );
      return;
    }
    
    try {
      await ref.read(authNotifierProvider.notifier).verifyOtp(_verificationId, otp);
    } catch (_) {
      // Error is handled by provider
    }
  }

  // Handle resending OTP
  Future<void> _handleResendOtp() async {
    for (var controller in _otpControllers) {
      controller.clear();
    }
    _otpFocusNodes[0].requestFocus();
    await _handlePhoneSubmit();
  }

  // Handle Google OAuth
  Future<void> _handleGoogleLogin() async {
    try {
      await ref.read(authNotifierProvider.notifier).signInWithGoogle();
    } catch (_) {
      // Error is handled by provider
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      body: Stack(
        children: [
          // Background subtle gradients & patterns
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                image: DecorationImage(
                  image: AssetImage('assets/images/grid_pattern.png'), // placeholder/fallback
                  repeat: ImageRepeat.repeat,
                  opacity: 0.03,
                ),
              ),
            ),
          ),
          // Radial glow decoration
          Positioned(
            top: -200,
            left: -100,
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryPurple.withOpacity(0.12),
              ),
            ),
          ),
          Positioned(
            bottom: -200,
            right: -100,
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.brandCyan.withOpacity(0.08),
              ),
            ),
          ),
          
          // Foreground Content
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo Placeholder
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.work, size: 28, color: AppTheme.primaryPurple),
                      const SizedBox(width: 8),
                      Text(
                        'THE',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Colors.white.withOpacity(0.7),
                        ),
                      ),
                      const Text(
                        'NIJOBS',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.brandCyan,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Glassmorphic Login Card
                  GlassContainer(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Welcome back',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Sign in to your account',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: AppTheme.darkTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Display auth error if active
                          if (authState.errorMessage != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: AppTheme.brandRose.withOpacity(0.1),
                                border: Border.all(color: AppTheme.brandRose.withOpacity(0.2)),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline, size: 16, color: AppTheme.brandRose),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      authState.errorMessage!,
                                      style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                          ],

                          if (_step == 'input') ...[
                            // Mode Toggle
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: InkWell(
                                      onTap: () => _switchMode('email'),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 10),
                                        decoration: BoxDecoration(
                                          color: _mode == 'email' ? AppTheme.primaryPurple : Colors.transparent,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          '📧 Email',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: _mode == 'email' ? Colors.white : AppTheme.darkTextSecondary,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: InkWell(
                                      onTap: () => _switchMode('phone'),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 10),
                                        decoration: BoxDecoration(
                                          color: _mode == 'phone' ? AppTheme.primaryPurple : Colors.transparent,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          '📱 Mobile OTP',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: _mode == 'phone' ? Colors.white : AppTheme.darkTextSecondary,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            if (_mode == 'email') ...[
                              // Email Field
                              const Text('Email Address', style: TextStyle(fontSize: 11, color: AppTheme.darkTextSecondary)),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                validator: Validators.validateEmail,
                                style: const TextStyle(color: Colors.white, fontSize: 14),
                                decoration: _inputDecoration(
                                  hint: 'your@email.com',
                                  prefixIcon: Icons.mail_outline,
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Password Field
                              const Text('Password', style: TextStyle(fontSize: 11, color: AppTheme.darkTextSecondary)),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _passwordController,
                                obscureText: !_showPassword,
                                validator: Validators.validatePassword,
                                style: const TextStyle(color: Colors.white, fontSize: 14),
                                decoration: _inputDecoration(
                                  hint: '••••••••',
                                  prefixIcon: Icons.lock_outline,
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                      size: 16,
                                      color: Colors.grey,
                                    ),
                                    onPressed: () => setState(() => _showPassword = !_showPassword),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),

                              // Forgot Password Link
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () => context.push('/forgot-password'),
                                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: Size.zero),
                                  child: const Text(
                                    'Forgot password?',
                                    style: TextStyle(color: AppTheme.brandCyan, fontSize: 11),
                                  ),
                                ),
                              ),
                            ] else ...[
                              // Mobile Number Field
                              const Text('Mobile Number', style: TextStyle(fontSize: 11, color: AppTheme.darkTextSecondary)),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Container(
                                    width: 64,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.04),
                                      border: Border.all(color: Colors.white.withOpacity(0.1)),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Text(
                                      '+91',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 14, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextFormField(
                                      controller: _phoneController,
                                      keyboardType: TextInputType.phone,
                                      maxLength: 10,
                                      validator: Validators.validatePhone,
                                      style: const TextStyle(color: Colors.white, fontSize: 14),
                                      decoration: _inputDecoration(
                                        hint: '98765 43210',
                                        prefixIcon: Icons.phone_android_outlined,
                                      ).copyWith(counterText: ''),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            const SizedBox(height: 16),

                            // Submit Button
                            Container(
                              height: 48,
                              decoration: BoxDecoration(
                                gradient: AppTheme.brandGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: ElevatedButton(
                                onPressed: authState.isLoading
                                    ? null
                                    : (_mode == 'email' ? _handleEmailLogin : _handlePhoneSubmit),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: authState.isLoading
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      )
                                    : Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            _mode == 'phone' ? 'Send OTP' : 'Sign In',
                                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                          ),
                                          const SizedBox(width: 8),
                                          const Icon(Icons.arrow_forward_rounded, size: 16, color: Colors.white),
                                        ],
                                      ),
                              ),
                            ),

                            // Divider
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 16.0),
                              child: Row(
                                children: [
                                  Expanded(child: Divider(color: Colors.white10)),
                                  Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 12.0),
                                    child: Text('or', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                  ),
                                  Expanded(child: Divider(color: Colors.white10)),
                                ],
                              ),
                            ),

                            // Google Login Button
                            OutlinedButton(
                              onPressed: authState.isLoading ? null : _handleGoogleLogin,
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: Colors.white.withOpacity(0.12)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.g_mobiledata_rounded, size: 24, color: Colors.white), // stub icon
                                  const SizedBox(width: 8),
                                  Text(
                                    'Continue with Google',
                                    style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                            ),
                          ] else ...[
                            // OTP Screen
                            Column(
                              children: [
                                const Text(
                                  '📱',
                                  style: TextStyle(fontSize: 32),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'OTP sent to your mobile',
                                  style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Enter the 6-digit code below',
                                  style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 11),
                                ),
                                const SizedBox(height: 24),
                                
                                // Digit Inputs
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  children: List.generate(6, (index) {
                                    return SizedBox(
                                      width: 40,
                                      height: 48,
                                      child: TextField(
                                        controller: _otpControllers[index],
                                        focusNode: _otpFocusNodes[index],
                                        keyboardType: TextInputType.number,
                                        maxLength: 1,
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                        decoration: InputDecoration(
                                          counterText: '',
                                          contentPadding: EdgeInsets.zero,
                                          filled: true,
                                          fillColor: Colors.white.withOpacity(0.04),
                                          enabledBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(10),
                                            borderSide: BorderSide(color: Colors.white.withOpacity(0.12)),
                                          ),
                                          focusedBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(10),
                                            borderSide: const BorderSide(color: AppTheme.primaryPurple),
                                          ),
                                        ),
                                        onChanged: (value) {
                                          if (value.isNotEmpty) {
                                            if (index < 5) {
                                              _otpFocusNodes[index + 1].requestFocus();
                                            } else {
                                              _otpFocusNodes[index].unfocus();
                                            }
                                          } else if (index > 0) {
                                            _otpFocusNodes[index - 1].requestFocus();
                                          }
                                        },
                                      ),
                                    );
                                  }),
                                ),
                                const SizedBox(height: 24),

                                // Verify Button
                                SizedBox(
                                  width: double.infinity,
                                  height: 48,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      gradient: AppTheme.brandGradient,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: ElevatedButton(
                                      onPressed: authState.isLoading ? null : _handleVerifyOtp,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.transparent,
                                        shadowColor: Colors.transparent,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      child: authState.isLoading
                                          ? const SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                            )
                                          : const Text(
                                              'Verify OTP',
                                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                            ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Resend OTP
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Text('Didn\'t receive? ', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                    GestureDetector(
                                      onTap: authState.isLoading ? null : _handleResendOtp,
                                      child: const Text(
                                        'Resend OTP',
                                        style: TextStyle(color: AppTheme.brandCyan, fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Footer Join Link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Don\'t have an account? ',
                        style: TextStyle(color: AppTheme.darkTextSecondary, fontSize: 13),
                      ),
                      GestureDetector(
                        onTap: () => context.push('/register'),
                        child: const Text(
                          'Join Free',
                          style: TextStyle(color: AppTheme.brandCyan, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration({required String hint, required IconData prefixIcon, Widget? suffixIcon}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 13),
      prefixIcon: Icon(prefixIcon, size: 16, color: Colors.grey),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: Colors.white.withOpacity(0.04),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.primaryPurple, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppTheme.brandRose.withOpacity(0.5)),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.brandRose, width: 1.5),
      ),
      errorStyle: const TextStyle(fontSize: 10, color: AppTheme.brandRose),
    );
  }
}
