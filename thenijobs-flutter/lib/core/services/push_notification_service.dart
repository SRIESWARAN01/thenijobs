import 'package:firebase_messaging/firebase_messaging.dart';

class PushNotificationService {
  PushNotificationService({FirebaseMessaging? messaging}) : _messaging = messaging ?? FirebaseMessaging.instance;

  final FirebaseMessaging _messaging;

  Future<String?> initialize() async {
    await _messaging.requestPermission();
    return _messaging.getToken();
  }

  Stream<RemoteMessage> get foregroundMessages => FirebaseMessaging.onMessage;
}
