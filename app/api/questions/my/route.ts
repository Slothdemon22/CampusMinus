import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';

// GET - Get current user's questions
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await getPrismaClient();
    const questions = await prisma.question.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

