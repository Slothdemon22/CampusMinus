import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { ResponseBuilder } from '@/lib/utils/ResponseBuilder';

/**
 * PUT - Change Password
 * Allows logged-in users to change their password
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return ResponseBuilder.unauthorized('Unauthorized');
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return ResponseBuilder.badRequest('Current password and new password are required');
    }

    if (newPassword.length < 6) {
      return ResponseBuilder.badRequest('New password must be at least 6 characters long');
    }

    const prisma = await getPrismaClient();
    if (!prisma) {
      return ResponseBuilder.error('Database connection error', 500);
    }

    // Get user with password
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!userWithPassword) {
      return ResponseBuilder.notFound('User not found');
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, userWithPassword.password);
    if (!isValidPassword) {
      return ResponseBuilder.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return ResponseBuilder.success({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return ResponseBuilder.internalError('Internal server error', error.message);
  }
}

