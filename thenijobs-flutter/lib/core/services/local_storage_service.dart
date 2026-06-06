import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  LocalStorageService(this._prefs);

  final SharedPreferences _prefs;
  static const _boxName = 'thenijobs_cache';

  static Future<LocalStorageService> init() async {
    await Hive.initFlutter();
    await Hive.openBox<dynamic>(_boxName);
    final prefs = await SharedPreferences.getInstance();
    return LocalStorageService(prefs);
  }

  Box<dynamic> get _box => Hive.box<dynamic>(_boxName);

  Future<void> cache(String key, Object? value) => _box.put(key, value);
  T? read<T>(String key) => _box.get(key) as T?;
  Future<void> remove(String key) => _box.delete(key);

  bool get darkMode => _prefs.getBool('darkMode') ?? true;
  Future<void> setDarkMode(bool value) => _prefs.setBool('darkMode', value);

  String? get lastRole => _prefs.getString('lastRole');
  Future<void> setLastRole(String role) => _prefs.setString('lastRole', role);
}
