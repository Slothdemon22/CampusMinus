import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the embedding model
    // Note: Gemini embedding API might use a different method
    // Try embedContent first, if that doesn't work, we'll use the REST API directly
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'text-embedding-004' 
      });

      // Generate embedding using embedContent
      const result = await model.embedContent(text.trim());
      
      // The response structure may vary, try different access patterns
      let embedding: number[] | null = null;
      
      if (result.embedding) {
        if (Array.isArray(result.embedding)) {
          embedding = result.embedding;
        } else if (result.embedding.values) {
          embedding = result.embedding.values;
        } else if (typeof result.embedding === 'object' && 'values' in result.embedding) {
          embedding = (result.embedding as any).values;
        }
      }
      
      // If embedContent doesn't work, try REST API directly
      if (!embedding || !Array.isArray(embedding)) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text: text.trim() }] }
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          embedding = data.embedding?.values || data.embedding;
        }
      }

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json(
        { error: 'Invalid embedding response' },
        { status: 500 }
      );
    }

    // Ensure we have the right dimensions
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

