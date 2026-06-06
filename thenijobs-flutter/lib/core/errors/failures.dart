// ============================================================
// THENIJOBS — Failure Classes for Clean Architecture
// ============================================================

abstract class Failure {
  final String message;
  const Failure(this.message);

  @override
  String toString() => message;
}

class ServerFailure extends Failure {
  const ServerFailure([String message = 'A server error occurred. Please try again.']) : super(message);
}

class AuthFailure extends Failure {
  const AuthFailure([String message = 'Authentication failed. Please check your credentials.']) : super(message);
}

class CacheFailure extends Failure {
  const CacheFailure([String message = 'Failed to load local cached data.']) : super(message);
}

class NetworkFailure extends Failure {
  const NetworkFailure([String message = 'No internet connection detected. Please connect and retry.']) : super(message);
}

class ValidationFailure extends Failure {
  const ValidationFailure(String message) : super(message);
}
