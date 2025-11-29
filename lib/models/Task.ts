import { User } from './User';

/**
 * Task model class representing a task entity
 */
export class Task {
  public id: string;
  public title: string;
  public content: string;
  public completed: boolean;
  public deadline: Date | null;
  public userId: string;
  public user: User;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    id: string,
    title: string,
    content: string,
    completed: boolean,
    deadline: Date | null,
    userId: string,
    user: User,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.completed = completed;
    this.deadline = deadline;
    this.userId = userId;
    this.user = user;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Check if task is overdue
   */
  public isOverdue(): boolean {
    if (!this.deadline || this.completed) {
      return false;
    }
    return new Date() > this.deadline;
  }

  /**
   * Check if task is due soon (within 24 hours)
   */
  public isDueSoon(): boolean {
    if (!this.deadline || this.completed) {
      return false;
    }
    const hoursUntilDeadline = (this.deadline.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0;
  }

  /**
   * Toggle completion status
   */
  public toggleCompletion(): void {
    this.completed = !this.completed;
  }

  /**
   * Check if task belongs to a user
   */
  public belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Convert to plain object
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      completed: this.completed,
      deadline: this.deadline,
      userId: this.userId,
      user: this.user.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

