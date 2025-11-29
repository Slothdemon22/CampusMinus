import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { NoteRepository } from '@/lib/repositories/NoteRepository';
import { ResponseBuilder } from '@/lib/utils/ResponseBuilder';

/**
 * POST - Generate share link for a note
 * Creates a unique token and sets isPublic to true
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return ResponseBuilder.unauthorized('Unauthorized');
    }

    const { id } = await params;
    const noteRepository = new NoteRepository();

    // Verify note exists and belongs to user
    const note = await noteRepository.findById(id);
    if (!note) {
      return ResponseBuilder.notFound('Note not found');
    }

    if (note.userId !== user.id) {
      return ResponseBuilder.forbidden('You can only share your own notes');
    }

    // Enable sharing (generates token and sets isPublic to true)
    const sharedNote = await noteRepository.enableSharing(id);

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = sharedNote.getShareUrl(baseUrl);

    return ResponseBuilder.success({
      shareToken: sharedNote.shareToken,
      shareUrl,
      message: 'Note is now shareable',
    });
  } catch (error: any) {
    console.error('Error sharing note:', error);
    return ResponseBuilder.error('Failed to share note', 500, error.message);
  }
}

/**
 * DELETE - Disable sharing for a note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return ResponseBuilder.unauthorized('Unauthorized');
    }

    const { id } = await params;
    const noteRepository = new NoteRepository();

    // Verify note exists and belongs to user
    const note = await noteRepository.findById(id);
    if (!note) {
      return ResponseBuilder.notFound('Note not found');
    }

    if (note.userId !== user.id) {
      return ResponseBuilder.forbidden('You can only manage sharing for your own notes');
    }

    // Disable sharing
    await noteRepository.disableSharing(id);

    return ResponseBuilder.success({
      message: 'Note sharing disabled',
    });
  } catch (error: any) {
    console.error('Error disabling note sharing:', error);
    return ResponseBuilder.error('Failed to disable sharing', 500, error.message);
  }
}

