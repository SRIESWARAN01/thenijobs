import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';

class DioClient {
  DioClient({FirebaseAuth? auth})
      : _auth = auth ?? FirebaseAuth.instance,
        dio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 15))) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _auth.currentUser?.getIdToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final FirebaseAuth _auth;
  final Dio dio;
}
