/*
  # Create user_preferences table for global settings

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `last_datum_column` (text) - Last selected date column name
      - `last_stunden_teg_column` (text) - Last selected hours column name
      - `last_schicht_column` (text) - Last selected shift column name
      - `created_at` (timestamptz) - When preferences were created
      - `updated_at` (timestamptz) - When preferences were last updated

  2. Security
    - Enable RLS on `user_preferences` table
    - Add policies for reading and updating preferences
    - Single row approach for simplicity (no user authentication yet)
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_datum_column text,
  last_stunden_teg_column text,
  last_schicht_column text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to read preferences"
  ON user_preferences
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow all to insert preferences"
  ON user_preferences
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow all to update preferences"
  ON user_preferences
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);