/*
  # Create OEE (Overall Equipment Effectiveness) Schema

  1. New Tables
    - `oee_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `default_planned_production_time` (numeric) - Default planned production time per day in hours
      - `default_ideal_cycle_time` (numeric) - Default ideal cycle time per piece in minutes
      - `default_target_oee` (numeric) - Target OEE percentage (default 85)
      - `green_min_oee` (numeric) - Minimum OEE for green status (default 85)
      - `yellow_min_oee` (numeric) - Minimum OEE for yellow status (default 70)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `oee_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `machine_name` (text)
      - `date` (date)
      - `planned_production_time` (numeric) - Planned production time in hours
      - `downtime` (numeric) - Downtime in hours
      - `good_pieces` (numeric) - Number of good pieces produced
      - `total_pieces` (numeric) - Total pieces produced (including scrap)
      - `ideal_cycle_time` (numeric) - Ideal cycle time per piece in minutes
      - `availability` (numeric) - Calculated availability percentage
      - `performance` (numeric) - Calculated performance percentage
      - `quality` (numeric) - Calculated quality percentage
      - `oee` (numeric) - Calculated OEE percentage
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add indexes for efficient querying by date, machine, and user
*/

CREATE TABLE IF NOT EXISTS oee_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  default_planned_production_time numeric NOT NULL DEFAULT 16,
  default_ideal_cycle_time numeric NOT NULL DEFAULT 1.0,
  default_target_oee numeric NOT NULL DEFAULT 85,
  green_min_oee numeric NOT NULL DEFAULT 85,
  yellow_min_oee numeric NOT NULL DEFAULT 70,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE oee_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own OEE settings"
  ON oee_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OEE settings"
  ON oee_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OEE settings"
  ON oee_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own OEE settings"
  ON oee_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS oee_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  machine_name text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  planned_production_time numeric NOT NULL DEFAULT 16,
  downtime numeric NOT NULL DEFAULT 0,
  good_pieces numeric NOT NULL DEFAULT 0,
  total_pieces numeric NOT NULL DEFAULT 0,
  ideal_cycle_time numeric NOT NULL DEFAULT 1.0,
  availability numeric NOT NULL DEFAULT 0,
  performance numeric NOT NULL DEFAULT 0,
  quality numeric NOT NULL DEFAULT 0,
  oee numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE oee_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own OEE data"
  ON oee_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OEE data"
  ON oee_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OEE data"
  ON oee_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own OEE data"
  ON oee_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_oee_data_user_date ON oee_data(user_id, date);
CREATE INDEX IF NOT EXISTS idx_oee_data_user_machine ON oee_data(user_id, machine_name);
CREATE INDEX IF NOT EXISTS idx_oee_data_date ON oee_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_oee_settings_user ON oee_settings(user_id);
