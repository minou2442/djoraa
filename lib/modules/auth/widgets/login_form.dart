import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/auth_provider.dart';
import '../../../core/localization/app_localization.dart';
import '../../../core/theme/color_scheme.dart';

class LoginForm extends ConsumerStatefulWidget {
  const LoginForm({Key? key}) : super(key: key);

  @override
  ConsumerState<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends ConsumerState<LoginForm>
    with SingleTickerProviderStateMixin {
  late TextEditingController _emailController;
  late TextEditingController _passwordController;
  late AnimationController _buttonAnimationController;
  bool _isPasswordVisible = false;
  bool _rememberMe = false;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _buttonAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _buttonAnimationController.dispose();
    super.dispose();
  }

  void _handleLogin() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)?.pleaseOk ?? 'Please fill all fields'),
          backgroundColor: AppColorScheme.lightColorScheme.error,
        ),
      );
      return;
    }

    ref.read(authStateProvider.notifier).login(
          email: email,
          password: password,
        );
  }

  @override
  Widget build(BuildContext context) {
    final locale = AppLocalizations.of(context);
    final authState = ref.watch(authStateProvider);

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Email Field
          TextField(
            controller: _emailController,
            enabled: !authState.isLoading,
            decoration: InputDecoration(
              hintText: locale?.email ?? 'Email',
              prefixIcon: const Icon(Icons.email_outlined),
              suffixIcon: _emailController.text.isNotEmpty
                  ? Icon(Icons.check_circle,
                      color: AppColorScheme.lightColorScheme.primary)
                  : null,
            ),
            keyboardType: TextInputType.emailAddress,
            onChanged: (value) => setState(() {}),
          ),
          const SizedBox(height: 16),

          // Password Field
          TextField(
            controller: _passwordController,
            enabled: !authState.isLoading,
            obscureText: !_isPasswordVisible,
            decoration: InputDecoration(
              hintText: locale?.password ?? 'Password',
              prefixIcon: const Icon(Icons.lock_outlined),
              suffixIcon: IconButton(
                icon: Icon(
                  _isPasswordVisible
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                ),
                onPressed: () {
                  setState(() => _isPasswordVisible = !_isPasswordVisible);
                },
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Remember Me & Forgot Password
          Row(
            children: [
              Checkbox(
                value: _rememberMe,
                onChanged: !authState.isLoading
                    ? (value) => setState(() => _rememberMe = value ?? false)
                    : null,
                activeColor: AppColorScheme.lightColorScheme.primary,
              ),
              Expanded(
                child: Text(
                  'Remember me',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
              TextButton(
                onPressed:
                    !authState.isLoading ? () {} : null,
                child: Text(locale?.forgotPassword ?? 'Forgot?'),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Error Message
          if (authState.error != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColorScheme.lightColorScheme.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.error_outline,
                    color: AppColorScheme.lightColorScheme.error,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      authState.error ?? '',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColorScheme.lightColorScheme.error,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          if (authState.error != null) const SizedBox(height: 16),

          // Login Button
          ElevatedButton(
            onPressed: !authState.isLoading ? _handleLogin : null,
            child: SizedBox(
              height: 48,
              child: Center(
                child: authState.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        locale?.login ?? 'Login',
                        style: Theme.of(context)
                            .textTheme
                            .labelLarge
                            ?.copyWith(color: Colors.white),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Social Login
          Row(
            children: [
              Expanded(child: Divider(color: AppColorScheme.lightColorScheme.outline)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  'Or continue with',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
              Expanded(child: Divider(color: AppColorScheme.lightColorScheme.outline)),
            ],
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: !authState.isLoading ? () {} : null,
                  icon: const Icon(Icons.g_mobiledata),
                  label: const Text('Google'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: !authState.isLoading ? () {} : null,
                  icon: const Icon(Icons.apple),
                  label: const Text('Apple'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
