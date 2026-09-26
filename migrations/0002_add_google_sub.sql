-- Migration 0002: Add google_sub column to users table for Google Identity Services
ALTER TABLE users ADD COLUMN google_sub TEXT;
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);
