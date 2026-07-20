-- Enabled after shared_preload_libraries includes pgaudit (see Dockerfile CMD)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgaudit;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
