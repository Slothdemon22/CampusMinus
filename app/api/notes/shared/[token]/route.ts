import { NextRequest, NextResponse } from 'next/server';
import { NoteRepository } from '@/lib/repositories/NoteRepository';
import { ResponseBuilder } from '@/lib/utils/ResponseBuilder';

/**
 * GET - Get a shared note by token
 * Public endpoint - no authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const noteRepository = new NoteRepository();

    // Find note by share token
    const note = await noteRepository.findByShareToken(token);

    if (!note) {
      return ResponseBuilder.notFound('Shared note not found or no longer available');
    }

    // Extract HTML content from JSON structure
    let contentString = '';
    if (typeof note.content === 'string') {
      contentString = note.content;
    } else if (note.content && typeof note.content === 'object') {
      const contentObj = note.content as any;
      contentString = contentObj.html || JSON.stringify(note.content);
    } else {
      contentString = JSON.stringify(note.content);
    }

    return ResponseBuilder.success({
      note: {
        id: note.id,
        title: note.title,
        content: contentString,
        author: note.user.getDisplayName(),
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching shared note:', error);
    return ResponseBuilder.error('Failed to fetch shared note', 500, error.message);
  }
}

