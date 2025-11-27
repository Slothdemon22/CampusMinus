import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

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
    
    // Generate embedding for the question (title + description)
    let embedding: number[] | null = null;
    try {
      const embeddingText = `${title.trim()} ${description.trim()}`;
      const embeddingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: embeddingText }),
      });
      
      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        embedding = embeddingData.embedding;
      } else {
        console.warn('Failed to generate embedding, continuing without it');
      }
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Continue without embedding
    }

    // Use raw SQL to insert with vector embedding if available
    const questionId = randomUUID();
    const imageList = Array.isArray(images)
      ? images.filter((url: unknown) => typeof url === 'string' && url.trim().length > 0)
      : [];
    const imagesSql =
      imageList.length > 0
        ? Prisma.sql`ARRAY[${Prisma.join(imageList.map((url) => Prisma.sql`${url}`))}]::text[]`
        : Prisma.sql`ARRAY[]::text[]`;

    if (embedding) {
      // Insert with embedding using raw SQL
      const embeddingArray = Prisma.sql`ARRAY[${Prisma.join(embedding.map((val) => Prisma.sql`${val}`))}]::real[]`;
      
      await prisma.$executeRaw`
        INSERT INTO questions (id, title, type, description, images, "userId", embedding, "createdAt", "updatedAt")
        VALUES (
          ${questionId},
          ${title.trim()},
          ${type.trim()},
          ${description.trim()},
          ${imagesSql},
          ${user.id},
          ${embeddingArray}::vector,
          NOW(),
          NOW()
        )
      `;
    } else {
      // Insert without embedding
      await prisma.$executeRaw`
        INSERT INTO questions (id, title, type, description, images, "userId", "createdAt", "updatedAt")
        VALUES (
          ${questionId},
          ${title.trim()},
          ${type.trim()},
          ${description.trim()},
          ${imagesSql},
          ${user.id},
          NOW(),
          NOW()
        )
      `;
    }

    // Fetch the created question with user info
    const [createdQuestion] = await prisma.$queryRaw`
      SELECT q.*, u.id as "user_id", u.name, u.email
      FROM questions q
      JOIN users u ON q."userId" = u.id
      WHERE q.id = ${questionId}
    `;

    const question = {
      id: (createdQuestion as any).id,
      title: (createdQuestion as any).title,
      type: (createdQuestion as any).type,
      description: (createdQuestion as any).description,
      images: (createdQuestion as any).images || [],
      userId: (createdQuestion as any).userId,
      createdAt: (createdQuestion as any).createdAt,
      updatedAt: (createdQuestion as any).updatedAt,
      user: {
        id: (createdQuestion as any).user_id,
        name: (createdQuestion as any).name,
        email: (createdQuestion as any).email,
      },
    };

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

