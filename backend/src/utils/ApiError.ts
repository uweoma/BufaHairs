/**
 * Application error carrying an HTTP status code and optional field errors.
 * Anything thrown that is not an ApiError is treated as an unexpected 500 and
 * its details are hidden from clients by the error middleware.
 */
export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: FieldError[];
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, errors: FieldError[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors: FieldError[] = []) {
    return new ApiError(400, message, errors);
  }
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
  static conflict(message = 'Resource conflict') {
    return new ApiError(409, message);
  }
  static unprocessable(message = 'Unprocessable request', errors: FieldError[] = []) {
    return new ApiError(422, message, errors);
  }
  static tooMany(message = 'Too many requests') {
    return new ApiError(429, message);
  }
  static internal(message = 'Something went wrong') {
    return new ApiError(500, message);
  }
}
