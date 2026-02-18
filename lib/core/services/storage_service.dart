import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class StorageService {
  final SharedPreferences _prefs;

  static const String _authTokenKey = 'auth_token';
  static const String _userDataKey = 'user_data';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _lastLocaleKey = 'last_locale';
  static const String _onboardingKey = 'onboarding_complete';

  StorageService(this._prefs);

  // Auth Token Management
  Future<bool> saveAuthToken(String token) async {
    return await _prefs.setString(_authTokenKey, token);
  }

  String? getAuthToken() {
    return _prefs.getString(_authTokenKey);
  }

  Future<bool> saveRefreshToken(String token) async {
    return await _prefs.setString(_refreshTokenKey, token);
  }

  String? getRefreshToken() {
    return _prefs.getString(_refreshTokenKey);
  }

  Future<bool> clearAuthTokens() async {
    final token = await _prefs.remove(_authTokenKey);
    final refresh = await _prefs.remove(_refreshTokenKey);
    return token && refresh;
  }

  // User Data Management
  Future<bool> saveUserData(Map<String, dynamic> userData) async {
    final jsonString = jsonEncode(userData);
    return await _prefs.setString(_userDataKey, jsonString);
  }

  Map<String, dynamic>? getUserData() {
    final jsonString = _prefs.getString(_userDataKey);
    if (jsonString == null) return null;
    try {
      return jsonDecode(jsonString) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  Future<bool> clearUserData() async {
    return await _prefs.remove(_userDataKey);
  }

  // Locale Management
  Future<bool> saveLocale(String localeCode) async {
    return await _prefs.setString(_lastLocaleKey, localeCode);
  }

  String? getLastLocale() {
    return _prefs.getString(_lastLocaleKey);
  }

  // Onboarding Management
  Future<bool> setOnboardingComplete() async {
    return await _prefs.setBool(_onboardingKey, true);
  }

  bool isOnboardingComplete() {
    return _prefs.getBool(_onboardingKey) ?? false;
  }

  // Generic Storage Methods
  Future<bool> setString(String key, String value) async {
    return await _prefs.setString(key, value);
  }

  String? getString(String key) {
    return _prefs.getString(key);
  }

  Future<bool> setBool(String key, bool value) async {
    return await _prefs.setBool(key, value);
  }

  bool? getBool(String key) {
    return _prefs.getBool(key);
  }

  Future<bool> setInt(String key, int value) async {
    return await _prefs.setInt(key, value);
  }

  int? getInt(String key) {
    return _prefs.getInt(key);
  }

  Future<bool> setDouble(String key, double value) async {
    return await _prefs.setDouble(key, value);
  }

  double? getDouble(String key) {
    return _prefs.getDouble(key);
  }

  Future<bool> setStringList(String key, List<String> value) async {
    return await _prefs.setStringList(key, value);
  }

  List<String>? getStringList(String key) {
    return _prefs.getStringList(key);
  }

  Future<bool> remove(String key) async {
    return await _prefs.remove(key);
  }

  Future<bool> clear() async {
    return await _prefs.clear();
  }

  bool containsKey(String key) {
    return _prefs.containsKey(key);
  }
}
