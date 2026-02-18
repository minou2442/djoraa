import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'config/app_config.dart';
import 'config/routes/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/localization/app_localization.dart';
import 'core/di/service_locator.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize all services
  await setupServiceLocator();
  
  runApp(
    const ProviderScope(
      child: DjoraaApp(
        initialLocale: Locale('ar', ''),
      ),
    ),
  );
}

class DjoraaApp extends ConsumerWidget {
  final Locale initialLocale;

  const DjoraaApp({
    Key? key,
    required this.initialLocale,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appRouter = ref.watch(appRouterProvider);
    final appTheme = AppTheme();

    return MaterialApp.router(
      title: 'Djoraa Healthcare',
      theme: appTheme.lightTheme,
      darkTheme: appTheme.darkTheme,
      themeMode: ThemeMode.light,
      routerDelegate: appRouter.routerDelegate,
      routeInformationParser: appRouter.routeInformationParser,
      routeInformationProvider: appRouter.routeInformationProvider,
      localizationsDelegates: [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: [
        const Locale('ar', ''), // Arabic
        const Locale('fr', ''), // French
        const Locale('en', ''), // English
      ],
      locale: initialLocale,
      debugShowCheckedModeBanner: false,
    );
  }
}
