import { BaseRepository } from './BaseRepository';
import { Answer } from '../models/Answer';
import { User } from '../models/User';
import { Prisma } from '@prisma/client';
import { IAnswerRepository } from '../interfaces/IAnswerRepository';

/**
 * Repository class for Answer entity operations
 * Handles all database interactions for answers
 * Implements IAnswerRepository interface - follows Interface Segregation Principle (ISP)
 * Follows Single Responsibility Principle (SRP) - only handles answer data access
 */
export class AnswerRepository extends BaseRepository<Answer> implements IAnswerRepository {
  /**
   * Find answer by ID
   */
  async findById(id: string): Promise<Answer | null> {
    await this.initialize();
    const answer = await this.prisma.answer.findUnique({
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

    if (!answer) return null;

    const user = new User(
      answer.user.id,
      answer.user.email,
      answer.user.name,
      answer.user.role as 'STUDENT' | 'ADMIN',
      answer.user.createdAt,
      answer.user.updatedAt
    );

    return new Answer(
      answer.id,
      answer.description,
      answer.images,
      answer.questionId,
      answer.userId,
      user,
      answer.createdAt,
      answer.updatedAt
    );
  }

  /**
   * Find all answers
   */
  async findAll(): Promise<Answer[]> {
    await this.initialize();
    const answers = await this.prisma.answer.findMany({
      orderBy: { createdAt: 'asc' },
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

    return answers.map((a) => {
      const user = new User(a.user.id, a.user.email, a.user.name, a.user.role as 'STUDENT' | 'ADMIN', a.user.createdAt, a.user.updatedAt);
      return new Answer(a.id, a.description, a.images, a.questionId, a.userId, user, a.createdAt, a.updatedAt);
    });
  }

  /**
   * Find answers by question ID
   */
  async findByQuestionId(questionId: string): Promise<Answer[]> {
    await this.initialize();
    const answers = await this.prisma.$queryRaw`
      SELECT a.*, u.id as "user_id", u.name, u.email, u.role, u."createdAt" as "user_createdAt", u."updatedAt" as "user_updatedAt"
      FROM answers a
      JOIN users u ON a."userId" = u.id
      WHERE a."questionId" = ${questionId}
      ORDER BY a."createdAt" ASC
    `;

    return (answers as any[]).map((row) => {
      const user = new User(
        row.user_id,
        row.email,
        row.name,
        row.role as 'STUDENT' | 'ADMIN',
        row.user_createdAt,
        row.user_updatedAt
      );
      return new Answer(
        row.id,
        row.description,
        Array.isArray(row.images) ? row.images : row.images ? JSON.parse(row.images) : [],
        row.questionId,
        row.userId,
        user,
        row.createdAt,
        row.updatedAt
      );
    });
  }

  /**
   * Create a new answer
   */
  async create(data: {
    description: string;
    images: string[];
    questionId: string;
    userId: string;
  }): Promise<Answer> {
    await this.initialize();
    const answerId = require('crypto').randomUUID();
    const imageList = Array.isArray(data.images)
      ? data.images.filter((url) => typeof url === 'string' && url.trim().length > 0)
      : [];
    const imagesSql =
      imageList.length > 0
        ? Prisma.sql`ARRAY[${Prisma.join(imageList.map((url) => Prisma.sql`${url}`))}]::text[]`
        : Prisma.sql`ARRAY[]::text[]`;

    await this.prisma.$executeRaw`
      INSERT INTO answers (id, description, images, "questionId", "userId", "createdAt", "updatedAt")
      VALUES (${answerId}, ${data.description.trim()}, ${imagesSql}, ${data.questionId}, ${data.userId}, NOW(), NOW())
    `;

    return (await this.findById(answerId))!;
  }

  /**
   * Update answer by ID
   */
  async update(id: string, data: Partial<Answer>): Promise<Answer> {
    await this.initialize();
    const updateData: any = {};
    if (data.description) updateData.description = data.description;
    if (data.images) updateData.images = data.images;

    await this.prisma.answer.update({
      where: { id },
      data: updateData,
    });

    return (await this.findById(id))!;
  }

  /**
   * Delete answer by ID
   */
  async delete(id: string): Promise<void> {
    await this.initialize();
    await this.prisma.answer.delete({
      where: { id },
    });
  }
}

