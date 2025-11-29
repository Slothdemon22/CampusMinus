import { BaseRepository } from './BaseRepository';
import { Note } from '../models/Note';
import { User } from '../models/User';
import { INoteRepository } from '../interfaces/INoteRepository';

/**
 * Repository class for Note entity operations
 * Handles all database interactions for notes
 * Implements INoteRepository interface - follows Interface Segregation Principle (ISP)
 * Follows Single Responsibility Principle (SRP) - only handles note data access
 */
export class NoteRepository extends BaseRepository<Note> implements INoteRepository {
  /**
   * Find note by ID
   */
  async findById(id: string): Promise<Note | null> {
    await this.initialize();
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!note) return null;

    const user = new User(
      note.user.id,
      note.user.email,
      note.user.name,
      note.user.role as 'STUDENT' | 'ADMIN',
      note.user.createdAt,
      note.user.updatedAt
    );

    return new Note(
      note.id,
      note.title,
      note.content,
      note.userId,
      user,
      note.createdAt,
      note.updatedAt,
      note.shareToken,
      note.isPublic
    );
  }

  /**
   * Find all notes
   */
  async findAll(): Promise<Note[]> {
    await this.initialize();
    const notes = await this.prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return notes.map((n) => {
      const user = new User(n.user.id, n.user.email, n.user.name, n.user.role as 'STUDENT' | 'ADMIN', n.user.createdAt, n.user.updatedAt);
      return new Note(n.id, n.title, n.content, n.userId, user, n.createdAt, n.updatedAt);
    });
  }

  /**
   * Find notes by user ID
   */
  async findByUserId(userId: string): Promise<Note[]> {
    await this.initialize();
    const notes = await this.prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return notes.map((n) => {
      const user = new User(n.user.id, n.user.email, n.user.name, n.user.role as 'STUDENT' | 'ADMIN', n.user.createdAt, n.user.updatedAt);
      return new Note(n.id, n.title, n.content, n.userId, user, n.createdAt, n.updatedAt);
    });
  }

  /**
   * Create a new note
   */
  async create(data: {
    title: string;
    content: any;
    userId: string;
  }): Promise<Note> {
    await this.initialize();
    const note = await this.prisma.note.create({
      data: {
        title: data.title.trim(),
        content: data.content,
        userId: data.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const user = new User(
      note.user.id,
      note.user.email,
      note.user.name,
      note.user.role as 'STUDENT' | 'ADMIN',
      note.user.createdAt,
      note.user.updatedAt
    );

    return new Note(
      note.id,
      note.title,
      note.content,
      note.userId,
      user,
      note.createdAt,
      note.updatedAt,
      note.shareToken,
      note.isPublic
    );
  }

  /**
   * Update note by ID
   */
  async update(id: string, data: Partial<Note>): Promise<Note> {
    await this.initialize();
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.shareToken !== undefined) updateData.shareToken = data.shareToken;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    const note = await this.prisma.note.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const user = new User(
      note.user.id,
      note.user.email,
      note.user.name,
      note.user.role as 'STUDENT' | 'ADMIN',
      note.user.createdAt,
      note.user.updatedAt
    );

    return new Note(
      note.id,
      note.title,
      note.content,
      note.userId,
      user,
      note.createdAt,
      note.updatedAt,
      note.shareToken,
      note.isPublic
    );
  }

  /**
   * Delete note by ID
   */
  async delete(id: string): Promise<void> {
    await this.initialize();
    await this.prisma.note.delete({
      where: { id },
    });
  }

  /**
   * Find note by share token
   */
  async findByShareToken(token: string): Promise<Note | null> {
    await this.initialize();
    const note = await this.prisma.note.findUnique({
      where: { shareToken: token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!note || !note.isPublic) return null;

    const user = new User(
      note.user.id,
      note.user.email,
      note.user.name,
      note.user.role as 'STUDENT' | 'ADMIN',
      note.user.createdAt,
      note.user.updatedAt
    );

    return new Note(
      note.id,
      note.title,
      note.content,
      note.userId,
      user,
      note.createdAt,
      note.updatedAt,
      note.shareToken,
      note.isPublic
    );
  }

  /**
   * Generate share token and make note public
   */
  async enableSharing(id: string): Promise<Note> {
    await this.initialize();
    // Generate a unique token
    const token = require('crypto').randomBytes(32).toString('hex');
    
    const note = await this.prisma.note.update({
      where: { id },
      data: {
        shareToken: token,
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const user = new User(
      note.user.id,
      note.user.email,
      note.user.name,
      note.user.role as 'STUDENT' | 'ADMIN',
      note.user.createdAt,
      note.user.updatedAt
    );

    return new Note(
      note.id,
      note.title,
      note.content,
      note.userId,
      user,
      note.createdAt,
      note.updatedAt,
      note.shareToken,
      note.isPublic
    );
  }

  /**
   * Disable sharing for a note
   */
  async disableSharing(id: string): Promise<Note> {
    await this.initialize();
    const note = await this.prisma.note.update({
      where: { id },
      data: {
        shareToken: null,
        isPublic: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const user = new User(
      note.user.id,
      note.user.email,
      note.user.name,
      note.user.role as 'STUDENT' | 'ADMIN',
      note.user.createdAt,
      note.user.updatedAt
    );

    return new Note(
      note.id,
      note.title,
      note.content,
      note.userId,
      user,
      note.createdAt,
      note.updatedAt,
      note.shareToken,
      note.isPublic
    );
  }
}

