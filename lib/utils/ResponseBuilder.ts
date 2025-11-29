import { NextResponse } from 'next/server';

/**
 * Utility class for building consistent API responses
 * Follows Builder Pattern for response construction
 */
export class ResponseBuilder {
  /**
   * Build success response
   */
  static success(data: any, status: number = 200): NextResponse {
    return NextResponse.json(
      {
        success: true,
        ...data,
      },
      { status }
    );
  }

  /**
   * Build error response
   */
  static error(message: string, status: number = 400, details?: any): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: message,
        ...(details && { details }),
      },
      { status }
    );
  }

  /**
   * Build unauthorized response
   */
  static unauthorized(message: string = 'Unauthorized'): NextResponse {
    return this.error(message, 401);
  }

  /**
   * Build forbidden response
   */
  static forbidden(message: string = 'Forbidden'): NextResponse {
    return this.error(message, 403);
  }

  /**
   * Build not found response
   */
  static notFound(message: string = 'Resource not found'): NextResponse {
    return this.error(message, 404);
  }

  /**
   * Build bad request response
   */
  static badRequest(message: string = 'Bad Request'): NextResponse {
    return this.error(message, 400);
  }

  /**
   * Build internal server error response
   */
  static internalError(message: string = 'Internal server error', details?: any): NextResponse {
    return this.error(message, 500, details);
  }

  /**
   * Build created response
   */
  static created(data: any): NextResponse {
    return this.success(data, 201);
  }
}

