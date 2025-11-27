import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';

// GET - Get all notes for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    const notes = await prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Transform JSON content to string for frontend
    const formattedNotes = notes.map((note) => {
      let contentString = '';
      if (typeof note.content === 'string') {
        contentString = note.content;
      } else if (note.content && typeof note.content === 'object') {
        // Extract HTML from JSON structure
        const contentObj = note.content as any;
        contentString = contentObj.html || JSON.stringify(note.content);
      } else {
        contentString = JSON.stringify(note.content);
      }
      
      return {
        id: note.id,
        title: note.title,
        content: contentString,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ notes: formattedNotes });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
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

    // Store content as JSON - TipTap content is HTML string, store it in a JSON structure
    const contentJson = {
      html: typeof content === 'string' ? content : JSON.stringify(content),
      type: 'html',
    };

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: contentJson,
        userId: user.id,
      },
    });

    // Log to console as requested
    console.log('Saved Note to DB:', JSON.stringify({
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }, null, 2));

    // Extract HTML from JSON structure for response
    const contentObj = note.content as any;
    const contentString = contentObj?.html || JSON.stringify(note.content);

    return NextResponse.json({
      note: {
        id: note.id,
        title: note.title,
        content: contentString,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

