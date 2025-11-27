-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN "embedding" vector(768);
