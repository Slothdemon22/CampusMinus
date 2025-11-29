import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

// GET - Get all answers for a question
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = await getPrismaClient();
    
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }
    
    const answers = await prisma.$queryRaw`
      SELECT a.*, u.id as "user_id", u.name, u.email
      FROM answers a
      JOIN users u ON a."userId" = u.id
      WHERE a."questionId" = ${id}
      ORDER BY a."createdAt" ASC
    `;
    
    // Transform the raw query result to match expected format
    const formattedAnswers = (answers as any[]).map((row: any) => ({
      id: row.id,
      description: row.description,
      images: Array.isArray(row.images) ? row.images : (row.images ? JSON.parse(row.images) : []),
      userId: row.userId,
      questionId: row.questionId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
      },
    }));
    
    return NextResponse.json({ answers: formattedAnswers });
  } catch (error: any) {
    console.error('Error fetching answers:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new answer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { description, images } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const prisma = await getPrismaClient();
    
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }
    
    // Verify question exists
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Use raw query to insert answer
    const answerId = randomUUID();
    const imageList = Array.isArray(images)
      ? images.filter((url: unknown) => typeof url === 'string' && url.trim().length > 0)
      : [];
    const imagesSql =
      imageList.length > 0
        ? Prisma.sql`ARRAY[${Prisma.join(imageList.map((url) => Prisma.sql`${url}`))}]::text[]`
        : Prisma.sql`ARRAY[]::text[]`;
    
    await prisma.$executeRaw`
      INSERT INTO answers (id, description, images, "questionId", "userId", "createdAt", "updatedAt")
      VALUES (${answerId}, ${description.trim()}, ${imagesSql}, ${id}, ${user.id}, NOW(), NOW())
    `;
    
    // Fetch the created answer with user info
    const results = await prisma.$queryRaw`
      SELECT a.*, u.id as "user_id", u.name, u.email
      FROM answers a
      JOIN users u ON a."userId" = u.id
      WHERE a.id = ${answerId}
    `;
    const createdAnswer = Array.isArray(results) && results.length > 0 ? (results[0] as any) : null;
    
    if (!createdAnswer) {
      return NextResponse.json({ error: 'Failed to create answer' }, { status: 500 });
    }
    
    const answer = {
      id: createdAnswer.id,
      description: createdAnswer.description,
      images: Array.isArray(createdAnswer.images) 
        ? createdAnswer.images 
        : (createdAnswer.images ? JSON.parse(createdAnswer.images) : []),
      userId: createdAnswer.userId,
      questionId: createdAnswer.questionId,
      createdAt: createdAnswer.createdAt,
      updatedAt: createdAnswer.updatedAt,
      user: {
        id: createdAnswer.user_id,
        name: createdAnswer.name,
        email: createdAnswer.email,
      },
    };

    return NextResponse.json({ answer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating answer:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
