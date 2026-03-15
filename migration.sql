-- Add mobile_number column to users table
ALTER TABLE users ADD COLUMN mobile_number text UNIQUE;
