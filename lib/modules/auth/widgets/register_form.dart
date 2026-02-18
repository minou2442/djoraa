import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/auth_provider.dart';
import '../../../core/localization/app_localization.dart';
import '../../../core/theme/color_scheme.dart';

class RegisterForm extends ConsumerStatefulWidget {
  const RegisterForm({Key? key}) : super(key: key);

  @override
  ConsumerState<RegisterForm> createState() => _RegisterFormState();
}

class _RegisterFormState extends ConsumerState<RegisterForm> {
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _passwordController;
  late TextEditingController _confirmPasswordController;

  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _agreeToTerms = false;

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController();
    _lastNameController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
    _passwordController = TextEditingController();
    _confirmPasswordController = TextEditingController();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleRegister() {
    final locale = AppLocalizations.of(context);

    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (firstName.isEmpty ||
        lastName.isEmpty ||
        email.isEmpty ||
        phone.isEmpty ||
        password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(locale?.pleaseFillAllFields ??
              'Please fill all fields'),
          backgroundColor: AppColorScheme.lightColorScheme.error,
        ),
      );
      return;
    }

    if (password != confirmPassword) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(locale?.passwordsDoNotMatch ??
              'Passwords do not match'),
          backgroundColor: AppColorScheme.lightColorScheme.error,
        ),
      );
      return;
    }

    if (password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(locale?.invalidPassword ??
              'Password must be at least 6 characters'),
          backgroundColor: AppColorScheme.lightColorScheme.error,
        ),
      );
      return;
    }

    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(locale?.termsAndConditions ??
              'Please agree to terms and conditions'),
          backgroundColor: AppColorScheme.lightColorScheme.error,
        ),
      );
      return;
    }

    ref.read(authStateProvider.notifier).register(
          email: email,
          password: password,
          firstName: firstName,
          lastName: lastName,
          phoneNumber: phone,
        );
  }

  @override
  Widget build(BuildContext context) {
    final locale = AppLocalizations.of(context);
    final authState = ref.watch(authStateProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // First Name
          TextField(
            controller: _firstNameController,
            enabled: !authState.isLoading,
            decoration: InputDecoration(
              hintText: locale?.firstName ?? 'First Name',
              prefixIcon: const Icon(Icons.person_outline),
            ),
          ),
          const SizedBox(height: 16),

          // Last Name
          TextField(
            controller: _lastNameController,
            enabled: !authState.isLoading,
            decoration: InputDecoration(
              hintText: locale?.lastName ?? 'Last Name',
              prefixIcon: const Icon(Icons.person_outline),
            ),
          ),
          const SizedBox(height: 16),

          // Email
          TextField(
            controller: _emailController,
            enabled: !authState.isLoading,
            decoration: InputDecoration(
              hintText: locale?.email ?? 'Email',
              prefixIcon: const Icon(Icons.email_outlined),
            ),
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),

          // Phone
          TextField(
            controller: _phoneController,
            enabled: !authState.isLoading,
            decoration: InputDecoration(
              hintText: locale?.phone ?? 'Phone Number',
              prefixIcon: const Icon(Icons.phone_outlined),
            ),
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 16),

          // Password
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

          // Confirm Password
          TextField(
            controller: _confirmPasswordController,
            enabled: !authState.isLoading,
            obscureText: !_isConfirmPasswordVisible,
            decoration: InputDecoration(
              hintText: locale?.confirmPassword ?? 'Confirm Password',
              prefixIcon: const Icon(Icons.lock_outlined),
              suffixIcon: IconButton(
                icon: Icon(
                  _isConfirmPasswordVisible
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                ),
                onPressed: () {
                  setState(
                      () => _isConfirmPasswordVisible = !_isConfirmPasswordVisible);
                },
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Terms and Conditions
          Row(
            children: [
              Checkbox(
                value: _agreeToTerms,
                onChanged: !authState.isLoading
                    ? (value) => setState(() => _agreeToTerms = value ?? false)
                    : null,
                activeColor: AppColorScheme.lightColorScheme.primary,
              ),
              Expanded(
                child: GestureDetector(
                  onTap: !authState.isLoading
                      ? () {
                          setState(() => _agreeToTerms = !_agreeToTerms);
                        }
                      : null,
                  child: Text(
                    locale?.termsAndConditions ??
                        'I agree to Terms and Conditions',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

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

          // Register Button
          ElevatedButton(
            onPressed: !authState.isLoading ? _handleRegister : null,
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
                        locale?.register ?? 'Register',
                        style: Theme.of(context)
                            .textTheme
                            .labelLarge
                            ?.copyWith(color: Colors.white),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
