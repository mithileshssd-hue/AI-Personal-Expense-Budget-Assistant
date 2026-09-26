-- Migration 0003: Add transaction time column to expenses and income tables
ALTER TABLE expenses ADD COLUMN time TEXT;
ALTER TABLE income ADD COLUMN time TEXT;
