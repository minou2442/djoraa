import "package:flutter/material.dart";
import "package:djoraa_mobile/core/accessibility/accessibility_controller.dart";
import "package:djoraa_mobile/core/auth/auth_session_controller.dart";
import "package:djoraa_mobile/routes/app_routes.dart";

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("الإعدادات | Paramètres")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ValueListenableBuilder<bool>(
              valueListenable: AccessibilityController.largeTextMode,
              builder: (BuildContext context, bool enabled, Widget? child) {
                return SwitchListTile(
                  value: enabled,
                  onChanged: AccessibilityController.setLargeTextMode,
                  title: const Text("خط كبير | Police large"),
                  subtitle: const Text("تحسين القراءة لكل الشاشات | Améliorer la lisibilité"),
                );
              },
            ),
          ),
          Card(
            child: ValueListenableBuilder<Locale?>(
              valueListenable: AccessibilityController.selectedLocale,
              builder: (BuildContext context, Locale? locale, Widget? child) {
                final selectedCode =
                    locale?.languageCode ??
                    Localizations.localeOf(context).languageCode;

                return Column(
                  children: [
                    RadioListTile<String>(
                      title: const Text("\u0627\u0644\u0639\u0631\u0628\u064a\u0629"),
                      subtitle: const Text("RTL"),
                      value: "ar",
                      groupValue: selectedCode,
                      onChanged: (String? value) {
                        if (value == null) return;
                        AccessibilityController.setLocale(const Locale("ar"));
                      },
                    ),
                    const Divider(height: 1),
                    RadioListTile<String>(
                      title: const Text("Français"),
                      subtitle: const Text("LTR"),
                      value: "fr",
                      groupValue: selectedCode,
                      onChanged: (String? value) {
                        if (value == null) return;
                        AccessibilityController.setLocale(const Locale("fr"));
                      },
                    ),
                  ],
                );
              },
            ),
          ),
          const Card(
            child: ListTile(
              leading: Icon(Icons.record_voice_over_rounded),
              title: Text("التنقل الصوتي | Navigation vocale"),
              subtitle: Text("ميزة مستقبلية | Fonction prévue"),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.logout_rounded),
              title: const Text("تسجيل الخروج | Déconnexion"),
              subtitle: const Text("خروج آمن وقفل البيانات الطبية | Déconnexion sécurisée et verrouillage des données"),
              onTap: () async {
                await AuthSessionController.instance.logout();
                if (!context.mounted) return;
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  AppRoutes.auth,
                  (Route<dynamic> route) => false,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
