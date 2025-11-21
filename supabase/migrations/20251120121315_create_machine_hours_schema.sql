/*
  # Machine Hours Tracking Schema

  1. New Tables
    - `machine_hours`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `machine_name` (text)
      - `date` (date)
      - `hours_worked` (numeric)
      - `target_hours` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `default_target_hours` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own machine hours and settings

  3. Indexes
    - Add index on user_id and date for efficient querying
    - Add unique constraint on user_id for settings
*/

CREATE TABLE IF NOT EXISTS machine_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  machine_name text NOT NULL,
  date date NOT NULL,
  hours_worked numeric NOT NULL DEFAULT 0,
  target_hours numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_target_hours numeric NOT NULL DEFAULT 8,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_machine_hours_user_date ON machine_hours(user_id, date);
CREATE INDEX IF NOT EXISTS idx_machine_hours_user_machine ON machine_hours(user_id, machine_name);

ALTER TABLE machine_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own machine hours"
  ON machine_hours FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own machine hours"
  ON machine_hours FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own machine hours"
  ON machine_hours FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own machine hours"
  ON machine_hours FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);