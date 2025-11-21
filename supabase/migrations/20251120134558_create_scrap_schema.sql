/*
  # Create Scrap (Ausschuss) Management Schema

  1. New Tables
    - `scrap_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `week_target` (numeric) - Target scrap amount for the week
      - `week_tolerance` (numeric) - Yellow threshold for the week
      - `month_target` (numeric) - Target scrap amount for the month
      - `month_tolerance` (numeric) - Yellow threshold for the month
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `scrap_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `machine_name` (text) - Name of the machine
      - `bab_number` (text) - BAB order number
      - `scrap_amount` (numeric) - Amount of scrap pieces
      - `scrap_date` (date) - Date when scrap was recorded
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS scrap_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_target numeric NOT NULL DEFAULT 100,
  week_tolerance numeric NOT NULL DEFAULT 150,
  month_target numeric NOT NULL DEFAULT 400,
  month_tolerance numeric NOT NULL DEFAULT 600,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scrap_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scrap settings"
  ON scrap_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scrap settings"
  ON scrap_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scrap settings"
  ON scrap_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scrap settings"
  ON scrap_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS scrap_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  machine_name text NOT NULL,
  bab_number text NOT NULL,
  scrap_amount numeric NOT NULL DEFAULT 0,
  scrap_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scrap_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scrap data"
  ON scrap_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scrap data"
  ON scrap_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scrap data"
  ON scrap_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scrap data"
  ON scrap_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scrap_data_user_date ON scrap_data(user_id, scrap_date);
CREATE INDEX IF NOT EXISTS idx_scrap_data_machine ON scrap_data(user_id, machine_name);
CREATE INDEX IF NOT EXISTS idx_scrap_settings_user ON scrap_settings(user_id);
