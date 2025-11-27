import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 5 } = body as { query?: string; limit?: number };

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Generate embedding for the search query
    const embeddingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query.trim() }),
    });

    if (!embeddingResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to generate search embedding' },
        { status: 500 }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const searchEmbedding = embeddingData.embedding;

    if (!searchEmbedding || !Array.isArray(searchEmbedding)) {
      return NextResponse.json(
        { error: 'Invalid embedding response' },
        { status: 500 }
      );
    }

    const prisma = await getPrismaClient();
    
    // Perform vector similarity search using PostgreSQL
    // Using <-> operator for cosine distance (or Euclidean distance)
    const embeddingArray = Prisma.sql`ARRAY[${Prisma.join(searchEmbedding.map((val) => Prisma.sql`${val}`))}]::real[]`;
    
    const results = await prisma.$queryRaw`
      SELECT 
        q.id,
        q.title,
        q.type,
        q.description,
        q.images,
        q."userId",
        q."createdAt",
        q."updatedAt",
        u.id as "user_id",
        u.name,
        u.email,
        q.embedding <-> ${embeddingArray}::vector as distance
      FROM questions q
      JOIN users u ON q."userId" = u.id
      WHERE q.embedding IS NOT NULL
      ORDER BY q.embedding <-> ${embeddingArray}::vector
      LIMIT ${limit}
    `;

    const questions = (results as any[]).map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      description: row.description,
      images: row.images || [],
      userId: row.userId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      distance: parseFloat(row.distance),
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
      },
    }));

    return NextResponse.json({ 
      questions,
      query: query.trim(),
      count: questions.length 
    });
  } catch (error: any) {
    console.error('Error searching questions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

