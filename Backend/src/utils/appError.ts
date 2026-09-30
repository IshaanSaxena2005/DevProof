export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any;

  constructor(message: string, statusCode = 500, errors?: any, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: any) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Access forbidden') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  static conflict(message: string) {
    return new AppError(message, 409);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500, undefined, false);
  }

  /**
   * The request is valid but the capability does not exist yet.
   *
   * Distinct from 400 (the caller asked for something wrong) and 503 (it exists
   * but is temporarily down): 501 says the caller is right and we have not
   * built it, which is not something a retry will fix.
   */
  static notImplemented(message: string) {
    return new AppError(message, 501);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new AppError(message, 503);
  }
}
