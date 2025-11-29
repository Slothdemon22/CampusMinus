import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPrismaClient } from '@/lib/prisma';

// DELETE - Delete an answer (only admin can delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete answers
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can delete answers' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const prisma = await getPrismaClient();
    
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Check if answer exists
    const answer = await prisma.answer.findUnique({
      where: { id },
    });

    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    // Delete answer
    await prisma.answer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Answer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting answer:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

