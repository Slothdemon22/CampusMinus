# OOP Architecture Documentation

This document describes the Object-Oriented Programming (OOP) architecture implemented in the project.

## Architecture Overview

The codebase follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────┐
│         API Routes (Controllers)    │  ← Thin layer, delegates to services
├─────────────────────────────────────┤
│         Service Layer               │  ← Business logic
├─────────────────────────────────────┤
│         Repository Layer            │  ← Data access
├─────────────────────────────────────┤
│         Model Layer                 │  ← Domain entities
└─────────────────────────────────────┘
```

## Directory Structure

```
lib/
├── models/              # Domain model classes
│   ├── User.ts
│   ├── Question.ts
│   ├── Answer.ts
│   ├── Task.ts
│   └── Note.ts
├── repositories/        # Data access layer
│   ├── BaseRepository.ts
│   ├── UserRepository.ts
│   ├── QuestionRepository.ts
│   ├── AnswerRepository.ts
│   ├── TaskRepository.ts
│   └── NoteRepository.ts
├── services/           # Business logic layer
│   ├── AuthService.ts
│   ├── UserService.ts
│   ├── QuestionService.ts
│   ├── EmbeddingService.ts
│   └── (TaskService, NoteService can be added)
└── utils/              # Utility classes
    └── ResponseBuilder.ts
```

## Design Patterns Used

### 1. Repository Pattern
- **Purpose**: Abstracts data access logic
- **Implementation**: `BaseRepository` provides common CRUD operations
- **Benefits**: 
  - Easy to swap data sources
  - Testable (can mock repositories)
  - Centralized data access logic

### 2. Service Pattern
- **Purpose**: Encapsulates business logic
- **Implementation**: Service classes handle business rules
- **Benefits**:
  - Reusable business logic
  - Single Responsibility Principle
  - Easy to test

### 3. Model Pattern
- **Purpose**: Represents domain entities
- **Implementation**: Classes with methods for entity behavior
- **Benefits**:
  - Encapsulation of entity logic
  - Type safety
  - Rich domain models

### 4. Builder Pattern
- **Purpose**: Constructs complex objects
- **Implementation**: `ResponseBuilder` for API responses
- **Benefits**:
  - Consistent API responses
  - Easy to extend

## Key Classes

### Models

#### User
```typescript
class User {
  isAdmin(): boolean
  isStudent(): boolean
  getDisplayName(): string
  toJSON(): Record<string, any>
}
```

#### Question
```typescript
class Question {
  hasImages(): boolean
  getAuthorName(): string
  belongsTo(userId: string): boolean
  toJSON(): Record<string, any>
}
```

### Repositories

All repositories extend `BaseRepository` and implement:
- `findById(id: string)`
- `findAll()`
- `create(data)`
- `update(id, data)`
- `delete(id)`

Additional methods are entity-specific:
- `UserRepository.findByEmail()`
- `QuestionRepository.searchByEmbedding()`
- `AnswerRepository.findByQuestionId()`

### Services

#### AuthService
- `signup(email, password, name)`
- `login(email, password)`
- `logout()`

#### QuestionService
- `getAllQuestions()`
- `createQuestion(data)`
- `searchQuestions(query, limit)`
- `createAnswer(data)`
- `deleteQuestion(id)`

#### UserService
- `getAllUsers()`
- `updateUserRole(userId, role)`
- `deleteUser(userId)`

## Usage Example

### Before (Procedural)
```typescript
export async function POST(request: NextRequest) {
  const prisma = await getPrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    return NextResponse.json({ error: 'User exists' }, { status: 400 });
  }
  const hashedPassword = await hashPassword(password);
  const newUser = await prisma.user.create({ data: { ... } });
  // ... more logic
}
```

### After (OOP)
```typescript
export async function POST(request: NextRequest) {
  const authService = new AuthService();
  try {
    const { user, token } = await authService.signup(email, password, name);
    return ResponseBuilder.success({ user: user.toJSON() });
  } catch (error) {
    return ResponseBuilder.error(error.message, 400);
  }
}
```

## Benefits of OOP Refactoring

1. **Separation of Concerns**: Business logic separated from API routes
2. **Reusability**: Services can be used across different routes
3. **Testability**: Easy to unit test services and repositories
4. **Maintainability**: Changes in one layer don't affect others
5. **Type Safety**: Strong typing with TypeScript classes
6. **Encapsulation**: Data and behavior are encapsulated in classes
7. **Extensibility**: Easy to add new features following existing patterns

## Migration Strategy

1. ✅ Created base classes (BaseRepository, Models)
2. ✅ Created repositories for all entities
3. ✅ Created service classes
4. ✅ Created utility classes
5. 🔄 Refactoring API routes to use services (in progress)
6. ⏳ Add unit tests for services
7. ⏳ Add integration tests

## Next Steps

1. Refactor remaining API routes to use service classes
2. Create TaskService and NoteService
3. Add error handling middleware
4. Add validation classes
5. Add unit tests

