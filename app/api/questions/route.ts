import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';

// GET - Get all questions (public, everyone can see)
export async function GET() {
  try {
    const prisma = await getPrismaClient();
    const questions = await prisma.question.findMany({
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

// POST - Create a new question
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, description, images } = body;

    if (!title || !type || !description) {
      return NextResponse.json(
        { error: 'Title, type, and description are required' },
        { status: 400 }
      );
    }

    const prisma = await getPrismaClient();
    const question = await prisma.question.create({
      data: {
        title: title.trim(),
        type: type.trim(),
        description: description.trim(),
        images: images || [],
        userId: user.id,
      },
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

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

