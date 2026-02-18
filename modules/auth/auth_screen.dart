import "dart:async";

import "package:flutter/material.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/core/roles/role_catalog.dart";
import "package:djoraa_mobile/core/theme/design_tokens.dart";
import "package:djoraa_mobile/routes/app_routes.dart";

enum _AuthMode { login, register }

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  static const int _maxBackoffSeconds = 32;

  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _registerPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _otpController = TextEditingController();

  final AuthSessionController _session = AuthSessionController.instance;

  _AuthMode _mode = _AuthMode.login;
  DjoraaRole _selectedRole = DjoraaRole.patient;
  String? _formMessage;
  bool _redirecting = false;

  bool _serviceUnavailable = false;
  int _backoffAttempt = 0;
  int _backoffSecondsRemaining = 0;
  Timer? _backoffTimer;

  bool get _backoffActive => _backoffSecondsRemaining > 0;

  @override
  void initState() {
    super.initState();
    _session.addListener(_onSessionChanged);
    _onSessionChanged();
  }

  @override
  void dispose() {
    _session.removeListener(_onSessionChanged);
    _backoffTimer?.cancel();
    _identifierController.dispose();
    _passwordController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _registerPasswordController.dispose();
    _confirmPasswordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _onSessionChanged() {
    if (!mounted) {
      return;
    }

    if (_session.isAuthenticated && !_redirecting) {
      _redirecting = true;
      final user = _session.user!;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, AppRoutes.homeForRole(user.role));
      });
    } else {
      setState(() {
        _formMessage = _session.errorMessage;
      });
    }
  }

  int _resolveBackoffSeconds(int attempt) {
    final value = 1 << attempt;
    if (value > _maxBackoffSeconds) {
      return _maxBackoffSeconds;
    }
    return value;
  }

  bool _isServiceUnavailableMessage(String? message) {
    if (message == null || message.isEmpty) {
      return false;
    }

    final value = message.toLowerCase();
    return value.contains("indisponible") ||
        value.contains("service unavailable") ||
        value.contains("service d'authentification") ||
        value.contains("impossible de joindre") ||
        value.contains("غير متاحة");
  }

  void _startBackoff() {
    final nextAttempt = _backoffAttempt + 1;
    final delaySeconds = _resolveBackoffSeconds(nextAttempt);

    _backoffTimer?.cancel();

    setState(() {
      _serviceUnavailable = true;
      _backoffAttempt = nextAttempt;
      _backoffSecondsRemaining = delaySeconds;
    });

    _backoffTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      if (_backoffSecondsRemaining <= 1) {
        timer.cancel();
        setState(() {
          _backoffSecondsRemaining = 0;
        });
        return;
      }

      setState(() {
        _backoffSecondsRemaining -= 1;
      });
    });
  }

  void _resetBackoff() {
    _backoffTimer?.cancel();
    setState(() {
      _serviceUnavailable = false;
      _backoffAttempt = 0;
      _backoffSecondsRemaining = 0;
    });
  }

  Future<void> _submit() async {
    if (_mode == _AuthMode.login) {
      await _login();
      return;
    }
    await _register();
  }

  Future<void> _login() async {
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text.trim();

    if (identifier.isEmpty || password.isEmpty) {
      setState(() => _formMessage = "البريد/الهاتف وكلمة المرور مطلوبان | Email/téléphone et mot de passe requis.");
      return;
    }

    if (_backoffActive) {
      setState(
        () => _formMessage =
            "خدمة المصادقة غير جاهزة. أعد المحاولة بعد $_backoffSecondsRemaining ثانية | Réessayez après $_backoffSecondsRemaining s.",
      );
      return;
    }

    final success = await _session.login(
      identifier: identifier,
      password: password,
    );

    if (!mounted) return;

    if (success) {
      _resetBackoff();
      return;
    }

    if (_session.pendingIdentifier != null) {
      _resetBackoff();
      setState(() {
        _formMessage = "مطلوب التحقق عبر OTP لإكمال الدخول | Vérification OTP requise pour terminer la connexion.";
      });
      return;
    }

    if (_isServiceUnavailableMessage(_session.errorMessage)) {
      _startBackoff();
    } else if (_serviceUnavailable) {
      _resetBackoff();
    }
  }

  Future<void> _retryLoginNow() async {
    if (_backoffActive || _session.isLoading) {
      return;
    }
    await _login();
  }

  Future<void> _register() async {
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _registerPasswordController.text.trim();
    final confirm = _confirmPasswordController.text.trim();

    if (email.isEmpty && phone.isEmpty) {
      setState(() => _formMessage = "البريد أو الهاتف مطلوب | Email ou téléphone requis.");
      return;
    }
    if (password.length < 8) {
      setState(() => _formMessage = "كلمة المرور يجب أن تكون 8 أحرف على الأقل | Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password != confirm) {
      setState(() => _formMessage = "كلمتا المرور غير متطابقتين | Les mots de passe ne correspondent pas.");
      return;
    }

    final success = await _session.register(
      role: _selectedRole,
      password: password,
      email: email.isEmpty ? null : email,
      phone: phone.isEmpty ? null : phone,
    );

    if (!mounted) return;

    if (success) {
      _resetBackoff();
      setState(() {
        _mode = _AuthMode.login;
        _formMessage = "تم التسجيل. يرجى تأكيد OTP لتفعيل الحساب | Inscription terminée. Vérifiez l'OTP pour activer le compte.";
      });
      return;
    }

    if (_isServiceUnavailableMessage(_session.errorMessage)) {
      _startBackoff();
    }
  }

  Future<void> _verifyOtp() async {
    final code = _otpController.text.trim();
    if (code.length != 6) {
      setState(() => _formMessage = "أدخل رمز OTP صحيح من 6 أرقام | Entrez un code OTP valide à 6 chiffres.");
      return;
    }

    if (_backoffActive) {
      setState(
        () => _formMessage =
            "خدمة المصادقة غير جاهزة. أعد المحاولة بعد $_backoffSecondsRemaining ثانية | Réessayez après $_backoffSecondsRemaining s.",
      );
      return;
    }

    final success = await _session.verifyOtp(
      code: code,
      identifier: _session.pendingIdentifier ?? _identifierController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      _resetBackoff();
      return;
    }

    if (_isServiceUnavailableMessage(_session.errorMessage)) {
      _startBackoff();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = _session.isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text("بوابة الدخول | DJORAA Access")),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFFFFCFF),
              DjoraaColors.background,
              Color(0xFFF3ECFF),
            ],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: -80,
              left: -40,
              child: _blurBubble(const Color(0x33D86BFF), 180),
            ),
            Positioned(
              top: 80,
              right: -55,
              child: _blurBubble(const Color(0x2A6A0DAD), 200),
            ),
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildHero(context),
                const SizedBox(height: 16),
                if (_serviceUnavailable) ...[
                  _buildServiceUnavailableBanner(isLoading),
                  const SizedBox(height: 12),
                ],
                _buildGlassPanel(
                  child: Column(
                    children: [
                      SegmentedButton<_AuthMode>(
                        segments: const [
                          ButtonSegment<_AuthMode>(
                            value: _AuthMode.login,
                            icon: Icon(Icons.login_rounded),
                            label: Text("دخول | Connexion"),
                          ),
                          ButtonSegment<_AuthMode>(
                            value: _AuthMode.register,
                            icon: Icon(Icons.person_add_alt_rounded),
                            label: Text("تسجيل | Inscription"),
                          ),
                        ],
                        selected: {_mode},
                        onSelectionChanged: (Set<_AuthMode> selection) {
                          setState(() {
                            _mode = selection.first;
                            _formMessage = null;
                          });
                        },
                      ),
                      const SizedBox(height: 14),
                      if (_mode == _AuthMode.login) _buildLoginForm(isLoading),
                      if (_mode == _AuthMode.register) _buildRegisterForm(isLoading),
                      if (_formMessage != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          _formMessage!,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: DjoraaColors.textMuted,
                              ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _buildGlassPanel(child: _buildOtpCard(isLoading)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHero(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(DjoraaSpacing.lg),
      decoration: BoxDecoration(
        gradient: DjoraaGradients.primaryHeader,
        borderRadius: BorderRadius.circular(DjoraaRadius.lg),
        boxShadow: [
          BoxShadow(
            color: DjoraaColors.accent.withOpacity(0.24),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "جرعة | DJORAA",
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: Colors.white,
                ),
          ),
          const SizedBox(height: DjoraaSpacing.xs),
          Text(
            "تسجيل آمن للوصول إلى ملفك الطبي | Authentification sécurisée pour accéder au dossier médical.",
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withOpacity(0.94),
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceUnavailableBanner(bool isLoading) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF6E5),
        borderRadius: BorderRadius.circular(DjoraaRadius.md),
        border: Border.all(color: const Color(0xFFF9DDA7)),
      ),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_rounded, color: Color(0xFFA95E00)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Auth service / DB unavailable",
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: const Color(0xFFA95E00),
                      ),
                ),
                Text(
                  _backoffActive
                      ? "Retry in $_backoffSecondsRemaining s (attempt $_backoffAttempt)"
                      : "Retry window is open now",
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFFA95E00),
                      ),
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: (_backoffActive || isLoading) ? null : _retryLoginNow,
            child: Text(_backoffActive ? "Retry $_backoffSecondsRemaining s" : "Retry"),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassPanel({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(DjoraaRadius.lg),
        border: Border.all(color: DjoraaColors.border.withOpacity(0.6)),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withOpacity(0.92),
            const Color(0xFFFAF7FF).withOpacity(0.9),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: DjoraaColors.accent.withOpacity(0.1),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildLoginForm(bool isLoading) {
    return Column(
      children: [
        TextField(
          controller: _identifierController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: "البريد أو الهاتف | Email ou téléphone",
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _passwordController,
          obscureText: true,
          decoration: const InputDecoration(
            labelText: "كلمة المرور | Mot de passe",
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: (isLoading || _backoffActive) ? null : _submit,
            child: Text(
              isLoading
                  ? "يرجى الانتظار..."
                  : _backoffActive
                      ? "Retry in $_backoffSecondsRemaining s"
                      : "تسجيل الدخول | Connexion",
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRegisterForm(bool isLoading) {
    return Column(
      children: [
        DropdownButtonFormField<DjoraaRole>(
          value: _selectedRole,
          decoration: const InputDecoration(labelText: "الدور | Rôle"),
          items: DjoraaRole.values
              .map(
                (DjoraaRole role) => DropdownMenuItem<DjoraaRole>(
                  value: role,
                  child: Text("${role.label} (${role.arabicLabel})"),
                ),
              )
              .toList(growable: false),
          onChanged: isLoading
              ? null
              : (DjoraaRole? role) {
                  if (role == null) return;
                  setState(() => _selectedRole = role);
                },
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: "البريد الإلكتروني | Email",
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: "الهاتف (اختياري) | Téléphone (optionnel)",
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _registerPasswordController,
          obscureText: true,
          decoration: const InputDecoration(
            labelText: "كلمة المرور | Mot de passe",
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _confirmPasswordController,
          obscureText: true,
          decoration: const InputDecoration(
            labelText: "تأكيد كلمة المرور | Confirmer le mot de passe",
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: isLoading ? null : _submit,
            child: Text(isLoading ? "يرجى الانتظار..." : "إنشاء حساب | Inscription"),
          ),
        ),
      ],
    );
  }

  Widget _buildOtpCard(bool isLoading) {
    final pending = _session.pendingIdentifier;
    final debugOtp = _session.otpDebugCode;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "التحقق عبر OTP | Vérification OTP",
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Text(
          pending == null
              ? "لا يوجد طلب OTP معلق | Aucun OTP en attente."
              : "المعرّف | Identifiant: $pending",
        ),
        if (debugOtp != null) ...[
          const SizedBox(height: 4),
          Text(
            "OTP التجريبي | OTP debug: $debugOtp",
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
        const SizedBox(height: 10),
        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: "رمز OTP | Code OTP"),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: (isLoading || _backoffActive) ? null : _verifyOtp,
            child: Text(_backoffActive ? "Retry in $_backoffSecondsRemaining s" : "تأكيد OTP | Vérifier OTP"),
          ),
        ),
      ],
    );
  }

  Widget _blurBubble(Color color, double size) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color,
          boxShadow: [
            BoxShadow(
              color: color,
              blurRadius: 80,
              spreadRadius: 25,
            ),
          ],
        ),
      ),
    );
  }
}
