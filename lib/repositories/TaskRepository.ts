import { BaseRepository } from './BaseRepository';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { ITaskRepository } from '../interfaces/ITaskRepository';

/**
 * Repository class for Task entity operations
 * Handles all database interactions for tasks
 * Implements ITaskRepository interface - follows Interface Segregation Principle (ISP)
 * Follows Single Responsibility Principle (SRP) - only handles task data access
 */
export class TaskRepository extends BaseRepository<Task> implements ITaskRepository {
  /**
   * Find task by ID
   */
  async findById(id: string): Promise<Task | null> {
    await this.initialize();
    const task = await this.prisma.task.findUnique({
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

    if (!task) return null;

    const user = new User(
      task.user.id,
      task.user.email,
      task.user.name,
      task.user.role as 'STUDENT' | 'ADMIN',
      task.user.createdAt,
      task.user.updatedAt
    );

    return new Task(
      task.id,
      task.title,
      task.content,
      task.completed,
      task.deadline,
      task.userId,
      user,
      task.createdAt,
      task.updatedAt
    );
  }

  /**
   * Find all tasks
   */
  async findAll(): Promise<Task[]> {
    await this.initialize();
    const tasks = await this.prisma.task.findMany({
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

    return tasks.map((t) => {
      const user = new User(t.user.id, t.user.email, t.user.name, t.user.role as 'STUDENT' | 'ADMIN', t.user.createdAt, t.user.updatedAt);
      return new Task(t.id, t.title, t.content, t.completed, t.deadline, t.userId, user, t.createdAt, t.updatedAt);
    });
  }

  /**
   * Find tasks by user ID
   */
  async findByUserId(userId: string): Promise<Task[]> {
    await this.initialize();
    const tasks = await this.prisma.task.findMany({
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

    return tasks.map((t) => {
      const user = new User(t.user.id, t.user.email, t.user.name, t.user.role as 'STUDENT' | 'ADMIN', t.user.createdAt, t.user.updatedAt);
      return new Task(t.id, t.title, t.content, t.completed, t.deadline, t.userId, user, t.createdAt, t.updatedAt);
    });
  }

  /**
   * Create a new task
   */
  async create(data: {
    title: string;
    content: string;
    deadline: Date | null;
    userId: string;
  }): Promise<Task> {
    await this.initialize();
    const task = await this.prisma.task.create({
      data: {
        title: data.title.trim(),
        content: data.content || '',
        deadline: data.deadline,
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
      task.user.id,
      task.user.email,
      task.user.name,
      task.user.role as 'STUDENT' | 'ADMIN',
      task.user.createdAt,
      task.user.updatedAt
    );

    return new Task(
      task.id,
      task.title,
      task.content,
      task.completed,
      task.deadline,
      task.userId,
      user,
      task.createdAt,
      task.updatedAt
    );
  }

  /**
   * Update task by ID
   */
  async update(id: string, data: Partial<Task>): Promise<Task> {
    await this.initialize();
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.completed !== undefined) updateData.completed = data.completed;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;

    const task = await this.prisma.task.update({
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
      task.user.id,
      task.user.email,
      task.user.name,
      task.user.role as 'STUDENT' | 'ADMIN',
      task.user.createdAt,
      task.user.updatedAt
    );

    return new Task(
      task.id,
      task.title,
      task.content,
      task.completed,
      task.deadline,
      task.userId,
      user,
      task.createdAt,
      task.updatedAt
    );
  }

  /**
   * Delete task by ID
   */
  async delete(id: string): Promise<void> {
    await this.initialize();
    await this.prisma.task.delete({
      where: { id },
    });
  }

  /**
   * Toggle task completion
   */
  async toggleCompletion(id: string): Promise<Task> {
    await this.initialize();
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return await this.update(id, { completed: !task.completed });
  }
}

