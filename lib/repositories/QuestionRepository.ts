import { BaseRepository } from './BaseRepository';
import { Question } from '../models/Question';
import { User } from '../models/User';
import { Prisma } from '@prisma/client';
import { IQuestionRepository } from '../interfaces/IQuestionRepository';

/**
 * Repository class for Question entity operations
 * Handles all database interactions for questions
 * Implements IQuestionRepository interface - follows Interface Segregation Principle (ISP)
 * Follows Single Responsibility Principle (SRP) - only handles question data access
 */
export class QuestionRepository extends BaseRepository<Question> implements IQuestionRepository {
  /**
   * Find question by ID
   */
  async findById(id: string): Promise<Question | null> {
    await this.initialize();
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    if (!question) return null;

    const user = question.user
      ? new User(
          question.user.id,
          question.user.email,
          question.user.name,
          question.user.role as 'STUDENT' | 'ADMIN',
          new Date(),
          new Date()
        )
      : null;

    return new Question(
      question.id,
      question.title,
      question.type,
      question.description,
      question.images,
      question.userId,
      user,
      question.createdAt,
      question.updatedAt,
      question._count.answers
    );
  }

  /**
   * Find all questions
   */
  async findAll(): Promise<Question[]> {
    await this.initialize();
    const questions = await this.prisma.question.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    return questions.map((q) => {
      const user = q.user
        ? new User(q.user.id, q.user.email, q.user.name, q.user.role as 'STUDENT' | 'ADMIN', new Date(), new Date())
        : null;

      return new Question(
        q.id,
        q.title,
        q.type,
        q.description,
        q.images,
        q.userId,
        user,
        q.createdAt,
        q.updatedAt,
        q._count.answers
      );
    });
  }

  /**
   * Find questions by user ID
   */
  async findByUserId(userId: string): Promise<Question[]> {
    await this.initialize();
    const questions = await this.prisma.question.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    return questions.map((q) => {
      const user = q.user
        ? new User(q.user.id, q.user.email, q.user.name, q.user.role as 'STUDENT' | 'ADMIN', new Date(), new Date())
        : null;

      return new Question(
        q.id,
        q.title,
        q.type,
        q.description,
        q.images,
        q.userId,
        user,
        q.createdAt,
        q.updatedAt,
        q._count.answers
      );
    });
  }

  /**
   * Create a new question
   */
  async create(data: {
    title: string;
    type: string;
    description: string;
    images: string[];
    userId: string;
    embedding?: number[] | null;
  }): Promise<Question> {
    await this.initialize();
    const questionId = require('crypto').randomUUID();
    const imageList = Array.isArray(data.images)
      ? data.images.filter((url) => typeof url === 'string' && url.trim().length > 0)
      : [];
    const imagesSql =
      imageList.length > 0
        ? Prisma.sql`ARRAY[${Prisma.join(imageList.map((url) => Prisma.sql`${url}`))}]::text[]`
        : Prisma.sql`ARRAY[]::text[]`;

    try {
      if (data.embedding && Array.isArray(data.embedding) && data.embedding.length > 0) {
        const embeddingArray = Prisma.sql`ARRAY[${Prisma.join(data.embedding.map((val) => Prisma.sql`${val}`))}]::real[]`;

        await this.prisma.$executeRaw`
          INSERT INTO questions (id, title, type, description, images, "userId", embedding, "createdAt", "updatedAt")
          VALUES (
            ${questionId},
            ${data.title.trim()},
            ${data.type.trim()},
            ${data.description.trim()},
            ${imagesSql},
            ${data.userId},
            ${embeddingArray}::vector,
            NOW(),
            NOW()
          )
        `;
      } else {
        await this.prisma.$executeRaw`
          INSERT INTO questions (id, title, type, description, images, "userId", "createdAt", "updatedAt")
          VALUES (
            ${questionId},
            ${data.title.trim()},
            ${data.type.trim()},
            ${data.description.trim()},
            ${imagesSql},
            ${data.userId},
            NOW(),
            NOW()
          )
        `;
      }
    } catch (error: any) {
      const errorMessage = error.message || '';
      if (errorMessage.includes('embedding') || errorMessage.includes('column') || errorMessage.includes('42703')) {
        // Embedding column not available, insert without it
        await this.prisma.$executeRaw`
          INSERT INTO questions (id, title, type, description, images, "userId", "createdAt", "updatedAt")
          VALUES (
            ${questionId},
            ${data.title.trim()},
            ${data.type.trim()},
            ${data.description.trim()},
            ${imagesSql},
            ${data.userId},
            NOW(),
            NOW()
          )
        `;
      } else {
        throw error;
      }
    }

    return (await this.findById(questionId))!;
  }

  /**
   * Update question by ID
   */
  async update(id: string, data: Partial<Question>): Promise<Question> {
    await this.initialize();
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.type) updateData.type = data.type;
    if (data.description) updateData.description = data.description;
    if (data.images) updateData.images = data.images;

    await this.prisma.question.update({
      where: { id },
      data: updateData,
    });

    return (await this.findById(id))!;
  }

  /**
   * Delete question by ID (cascade deletes answers)
   */
  async delete(id: string): Promise<void> {
    await this.initialize();
    await this.prisma.question.delete({
      where: { id },
    });
  }

  /**
   * Search questions using vector similarity
   */
  async searchByEmbedding(embedding: number[], limit: number = 3): Promise<Question[]> {
    await this.initialize();
    const embeddingArray = Prisma.sql`ARRAY[${Prisma.join(embedding.map((val) => Prisma.sql`${val}`))}]::real[]`;

    const results = await this.prisma.$queryRaw`
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
        u.role,
        q.embedding <-> ${embeddingArray}::vector as distance
      FROM questions q
      LEFT JOIN users u ON q."userId" = u.id
      WHERE q.embedding IS NOT NULL
      ORDER BY q.embedding <-> ${embeddingArray}::vector
      LIMIT ${limit}
    `;

    return (results as any[]).map((row) => {
      const user = row.user_id
        ? new User(row.user_id, row.email, row.name, row.role as 'STUDENT' | 'ADMIN', new Date(), new Date())
        : null;

      return new Question(
        row.id,
        row.title,
        row.type,
        row.description,
        row.images || [],
        row.userId,
        user,
        row.createdAt,
        row.updatedAt
      );
    });
  }
}

