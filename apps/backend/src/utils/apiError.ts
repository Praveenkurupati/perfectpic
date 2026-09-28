// apps/backend/src/utils/apiError.ts

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    statusCode: number,
    message: string,
    errorCode = 'API_ERROR',
    isOperational = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  public static badRequest(message = 'Bad Request', details?: any) {
    return new ApiError(400, message, 'BAD_REQUEST', true, details);
  }

  public static unauthorized(message = 'Unauthorized access', details?: any) {
    return new ApiError(401, message, 'UNAUTHORIZED', true, details);
  }

  public static forbidden(message = 'Forbidden resource', details?: any) {
    return new ApiError(403, message, 'FORBIDDEN', true, details);
  }

  public static notFound(message = 'Resource not found', details?: any) {
    return new ApiError(404, message, 'NOT_FOUND', true, details);
  }

  public static conflict(message = 'Resource conflict', details?: any) {
    return new ApiError(409, message, 'CONFLICT', true, details);
  }

  public static unprocessable(message = 'Validation error', details?: any) {
    return new ApiError(422, message, 'UNPROCESSABLE_ENTITY', true, details);
  }

  public static internal(message = 'Internal server error', details?: any) {
    return new ApiError(500, message, 'INTERNAL_SERVER_ERROR', false, details);
  }
}
