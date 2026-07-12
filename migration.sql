-- Add mobile_number column to users table
ALTER TABLE users ADD COLUMN mobile_number text UNIQUE;

-- Add image_url column to questions table
ALTER TABLE questions ADD COLUMN image_url text;
