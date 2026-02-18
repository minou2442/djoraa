import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'localization_en.dart';
import 'localization_ar.dart';
import 'localization_fr.dart';

class AppLocalizations {
  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  late Map<String, String> _localizedStrings;

  Future<bool> load() async {
    final Map<String, String> strings =
        _getLocalizationData(locale.languageCode);
    _localizedStrings = strings;
    return true;
  }

  Map<String, String> _getLocalizationData(String languageCode) {
    switch (languageCode) {
      case 'ar':
        return localizationAr;
      case 'fr':
        return localizationFr;
      case 'en':
      default:
        return localizationEn;
    }
  }

  String translate(String key) {
    return _localizedStrings[key] ?? key;
  }

  String get(String key) => translate(key);

  // Common translations
  String get appName => translate('app_name');
  String get appTitle => translate('app_title');
  String get login => translate('login');
  String get register => translate('register');
  String get forgotPassword => translate('forgot_password');
  String get email => translate('email');
  String get password => translate('password');
  String get logout => translate('logout');
  String get home => translate('home');
  String get profile => translate('profile');
  String get settings => translate('settings');
  String get dashboard => translate('dashboard');
  String get appointments => translate('appointments');
  String get prescriptions => translate('prescriptions');
  String get labResults => translate('lab_results');
  String get medications => translate('medications');
  String get medicalFile => translate('medical_file');
  String get notifications => translate('notifications');
  String get loading => translate('loading');
  String get error => translate('error');
  String get success => translate('success');
  String get cancel => translate('cancel');
  String get save => translate('save');
  String get delete => translate('delete');
  String get edit => translate('edit');
  String get back => translate('back');
  String get next => translate('next');
  String get submit => translate('submit');
  String get noData => translate('no_data');
  String get retry => translate('retry');
  String get networkError => translate('network_error');
  String get serverError => translate('server_error');
  String get unknownError => translate('unknown_error');
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) =>
      ['en', 'ar', 'fr'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async {
    final AppLocalizations appLocalizations = AppLocalizations(locale);
    await appLocalizations.load();
    Intl.defaultLocale = locale.toString();
    return appLocalizations;
  }

  @override
  bool shouldReload(LocalizationsDelegate<AppLocalizations> old) => false;
}
