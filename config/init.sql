-- Advanced Memory Bank MCP - Database Initialization
-- PostgreSQL + pgvector setup for development/testing

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant permissions to user
GRANT ALL PRIVILEGES ON DATABASE memory_bank_test TO memory_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO memory_user;

-- Set search path
ALTER DATABASE memory_bank_test SET search_path TO public;

-- Create user with superuser privileges for testing
ALTER USER memory_user CREATEDB;

-- Create test schema
CREATE SCHEMA IF NOT EXISTS test_schema;
GRANT ALL PRIVILEGES ON SCHEMA test_schema TO memory_user;

-- Log successful initialization
INSERT INTO pg_stat_statements_info VALUES ('Advanced Memory Bank MCP - Database initialized successfully');

COMMENT ON DATABASE memory_bank_test IS 'Advanced Memory Bank MCP v3.0.0 - Development Database';
