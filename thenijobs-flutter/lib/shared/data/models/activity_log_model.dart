import 'package:cloud_firestore/cloud_firestore.dart';

class ActivityLog {
  final String id;
  final String userId;
  final String userName;
  final String action;
  final String target;
  final String targetId;
  final String? details;
  final String? ipAddress;
  final DateTime timestamp;

  ActivityLog({
    required this.id,
    required this.userId,
    required this.userName,
    required this.action,
    required this.target,
    required this.targetId,
    this.details,
    this.ipAddress,
    required this.timestamp,
  });

  factory ActivityLog.fromFirestore(Map<String, dynamic> data, String id) {
    return ActivityLog(
      id: id,
      userId: data['userId'] as String? ?? '',
      userName: data['userName'] as String? ?? '',
      action: data['action'] as String? ?? '',
      target: data['target'] as String? ?? '',
      targetId: data['targetId'] as String? ?? '',
      details: data['details'] as String?,
      ipAddress: data['ipAddress'] as String?,
      timestamp: data['timestamp'] != null
          ? (data['timestamp'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'userName': userName,
      'action': action,
      'target': target,
      'targetId': targetId,
      if (details != null) 'details': details,
      if (ipAddress != null) 'ipAddress': ipAddress,
      'timestamp': Timestamp.fromDate(timestamp),
    };
  }
}
