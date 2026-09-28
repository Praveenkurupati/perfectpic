// apps/backend/src/utils/apiResponse.ts
import { Response } from 'express';

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: any;
  };
  error?: {
    code?: string;
    details?: any;
  };
}

export class ApiResponse {
  public static success<T>(
    res: Response,
    data: T,
    message = 'Request successful',
    statusCode = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  public static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
  ): Response {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  public static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page = 1,
    limit = 20,
    message = 'Data retrieved successfully'
  ): Response {
    const totalPages = Math.ceil(total / limit) || 1;
    return res.status(200).json({
      success: true,
      message,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  }

  public static error(
    res: Response,
    message = 'An unexpected error occurred',
    statusCode = 500,
    errorCode = 'INTERNAL_ERROR',
    details?: any
  ): Response {
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        code: errorCode,
        details,
      },
    });
  }
}
