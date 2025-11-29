/**
 * User model class representing a user entity
 */
export class User {
  public id: string;
  public email: string;
  public name: string | null;
  public role: 'STUDENT' | 'ADMIN';
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    id: string,
    email: string,
    name: string | null,
    role: 'STUDENT' | 'ADMIN',
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Check if user is an admin
   */
  public isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  /**
   * Check if user is a student
   */
  public isStudent(): boolean {
    return this.role === 'STUDENT';
  }

  /**
   * Get display name (name or email prefix)
   */
  public getDisplayName(): string {
    return this.name || this.email.split('@')[0];
  }

  /**
   * Convert to plain object
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

