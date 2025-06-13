#!/usr/bin/env node

/**
 * Database initialization script for Advanced Memory Bank
 * 
 * This script:
 * 1. Connects to PostgreSQL
 * 2. Enables the pgvector extension
 * 3. Creates necessary tables for memory storage
 * 4. Sets up indexes for efficient vector similarity search
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Database connection parameters from environment
const host = process.env.POSTGRES_HOST || 'localhost';
const port = parseInt(process.env.POSTGRES_PORT || '5432');
const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD || 'postgres';
const database = process.env.POSTGRES_DB || 'memory_bank';

// Connect to PostgreSQL
const sql = postgres({
  host,
  port,
  user,
  password,
  database,
  onnotice: () => {}, // Ignore notices
});

/**
 * Initialize the database schema for Advanced Memory Bank
 */
async function initializeDatabase() {
  try {
    console.log('🚀 Initializing Advanced Memory Bank database...');

    // Enable pgvector extension if not already enabled
    console.log('📦 Enabling pgvector extension...');
    await sql`
      CREATE EXTENSION IF NOT EXISTS vector;
    `;
    
    // Create projects table
    console.log('📝 Creating projects table...');
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create memories table with vector support
    console.log('🧠 Creating memories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        memory_type TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(1536),
        importance FLOAT NOT NULL DEFAULT 0.5,
        access_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(project_id, title)
      );
    `;
    
    // Create metadata table for flexible attributes
    console.log('🏷️ Creating memory_metadata table...');
    await sql`
      CREATE TABLE IF NOT EXISTS memory_metadata (
        memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value JSONB,
        PRIMARY KEY(memory_id, key)
      );
    `;
    
    // Create indexes for efficient retrieval
    console.log('📇 Creating indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_memories_project_id ON memories(project_id);
      CREATE INDEX IF NOT EXISTS idx_memories_memory_type ON memories(memory_type);
      CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
      CREATE INDEX IF NOT EXISTS idx_memories_last_accessed ON memories(last_accessed);
    `;
    
    // Create vector index for similarity search
    console.log('🔍 Creating vector similarity index...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `;

    console.log('✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the initialization if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase().catch(console.error);
}

export { initializeDatabase };