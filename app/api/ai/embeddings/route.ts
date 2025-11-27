import { NextRequest, NextResponse } from 'next/server';

// Gemini text-embedding-004 model produces 768-dimensional vectors
const EMBEDDING_DIMENSIONS = 768;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI is not configured. Missing GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text } = body as { text?: string };

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Use Gemini REST API for embeddings (text-embedding-004)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text: text.trim() }]
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const embedding = data.embedding?.values || data.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json(
        { error: 'Invalid embedding response from API' },
        { status: 500 }
      );
    }

    // Ensure we have the right dimensions (768 for text-embedding-004)
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      console.warn(`Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`);
    }

    return NextResponse.json({ 
      embedding: embedding.slice(0, EMBEDDING_DIMENSIONS), // Ensure correct dimensions
      dimensions: embedding.length 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate embedding',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}
