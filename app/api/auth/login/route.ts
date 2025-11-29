import { NextRequest } from 'next/server';
import { ServiceFactory } from '@/lib/di/ServiceFactory';
import { ResponseBuilder } from '@/lib/utils/ResponseBuilder';

/**
 * Login API Route - Refactored to use OOP Service Pattern with Dependency Injection
 * Uses ServiceFactory to create AuthService with proper dependencies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return ResponseBuilder.error('Email and password are required', 400);
    }

    // Use ServiceFactory to create AuthService with dependencies (DIP)
    const authService = ServiceFactory.createAuthService();
    const { user, token } = await authService.login(email, password);

    return ResponseBuilder.success({
      user: user.toJSON(),
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle known errors
    if (error.message === 'Invalid email or password') {
      return ResponseBuilder.unauthorized(error.message);
    }

    return ResponseBuilder.error('Internal server error', 500, error.message);
  }
}

