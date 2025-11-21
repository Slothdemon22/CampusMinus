import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';

// GET - Get all tasks for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await getPrismaClient();
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, deadline } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    let deadlineDate: Date | null = null;
    if (deadline) {
      deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        deadlineDate = null;
      }
    }

    const prisma = await getPrismaClient();
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        content: content || '',
        deadline: deadlineDate,
        userId: user.id,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

