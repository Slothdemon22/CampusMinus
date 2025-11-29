import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { EmailService } from '@/lib/email';
import { hashPassword } from '@/lib/auth';
import { ResponseBuilder } from '@/lib/utils/ResponseBuilder';

/**
 * POST - Forgot Password
 * Generates a new password and sends it via email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return ResponseBuilder.badRequest('Email is required');
    }

    const prisma = await getPrismaClient();
    if (!prisma) {
      return ResponseBuilder.error('Database connection error', 500);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Don't reveal if user exists or not (security best practice)
    // Always return success message
    if (!user) {
      // Still return success to prevent email enumeration
      return ResponseBuilder.success({
        success: true,
        message: 'If an account exists with this email, a password reset email has been sent.',
      });
    }

    // Generate new password
    const newPassword = EmailService.generatePassword(12);
    const hashedPassword = await hashPassword(newPassword);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Send email with new password
    try {
      await EmailService.sendPasswordResetEmail(user.email, newPassword, user.name);
    } catch (emailError: any) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail the request if email fails, but log it
      // In production, you might want to queue this for retry
    }

    return ResponseBuilder.success({
      success: true,
      message: 'If an account exists with this email, a password reset email has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return ResponseBuilder.internalError('Internal server error', error.message);
  }
}

