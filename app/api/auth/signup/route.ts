import { NextRequest } from 'next/server';
import { ServiceFactory } from '@/lib/di/ServiceFactory';
import { ResponseBuilder } from '@/lib/utils/ResponseBuilder';

/**
 * Signup API Route - Refactored to use OOP Service Pattern with Dependency Injection
 * Uses ServiceFactory to create AuthService with proper dependencies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password) {
      return ResponseBuilder.error('Email and password are required', 400);
    }

    // Use ServiceFactory to create AuthService with dependencies (DIP)
    const authService = ServiceFactory.createAuthService();
    const { user, token } = await authService.signup(email, password, name);

    return ResponseBuilder.success({
      user: user.toJSON(),
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle known errors
    if (error.message === 'User with this email already exists') {
      return ResponseBuilder.error(error.message, 400);
    }

    return ResponseBuilder.internalError('Internal server error', error.message);
  }
}

