import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash';

function formatToHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const paragraphs = trimmed.split(/\n{2,}/).map((p) => p.trim());
  return paragraphs
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

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
    const { prompt, subject } = body as { prompt?: string; subject?: string };

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const systemPrompt = `
You are helping a student create clear, structured study notes.
Return the notes as clean HTML using headings (h2, h3), bullet lists (ul, li), ordered lists (ol, li), and paragraphs (p).
Do not include HTML, head, body, or DOCTYPE tags – only the inner content.
Use proper HTML structure with headings, lists, and paragraphs.

Subject (optional): ${subject || 'General'}
User prompt: ${prompt}
`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    // Check if response already contains HTML tags
    const hasHtmlTags = /<[^>]+>/.test(text);
    const html = hasHtmlTags ? text.trim() : formatToHtml(text);

    return NextResponse.json({ content: html }, { status: 200 });
  } catch (error: any) {
    console.error('Error generating AI notes:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate notes',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}


