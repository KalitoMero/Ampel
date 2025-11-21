/*
  # Add user authentication and Row Level Security

  1. Changes
    - Add user_id column to all user-data tables
    - Update RLS policies to restrict access to authenticated users
    - Ensure users can only access their own data
  
  2. Tables Updated
    - column_mappings: Add user_id, update policies for user ownership
    - traffic_light_settings: Add user_id, update policies for user ownership
    - excel_data: Add user_id, update policies for user ownership
    - user_preferences: Add user_id, update policies for user ownership
    - machine_targets: Add user_id, update policies for user ownership
  
  3. Security
    - All policies now check auth.uid() to ensure users only access their own data
    - SELECT, INSERT, UPDATE, DELETE policies created for each table
    - All operations restricted to authenticated users only
*/

-- Add user_id column to column_mappings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'column_mappings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE column_mappings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to traffic_light_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'traffic_light_settings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE traffic_light_settings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to excel_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'excel_data' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE excel_data ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to user_preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to machine_targets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'machine_targets' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE machine_targets ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read mappings" ON column_mappings;
DROP POLICY IF EXISTS "Anyone can insert mappings" ON column_mappings;
DROP POLICY IF EXISTS "Anyone can update mappings" ON column_mappings;
DROP POLICY IF EXISTS "Anyone can delete mappings" ON column_mappings;

DROP POLICY IF EXISTS "Anyone can read settings" ON traffic_light_settings;
DROP POLICY IF EXISTS "Anyone can insert settings" ON traffic_light_settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON traffic_light_settings;

DROP POLICY IF EXISTS "Anyone can read excel data" ON excel_data;
DROP POLICY IF EXISTS "Anyone can insert excel data" ON excel_data;
DROP POLICY IF EXISTS "Anyone can delete excel data" ON excel_data;

DROP POLICY IF EXISTS "Anyone can read preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can insert preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can update preferences" ON user_preferences;

DROP POLICY IF EXISTS "Anyone can read machine targets" ON machine_targets;
DROP POLICY IF EXISTS "Anyone can insert machine targets" ON machine_targets;
DROP POLICY IF EXISTS "Anyone can update machine targets" ON machine_targets;
DROP POLICY IF EXISTS "Anyone can delete machine targets" ON machine_targets;

-- Column Mappings Policies
CREATE POLICY "Users can view own mappings"
  ON column_mappings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mappings"
  ON column_mappings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mappings"
  ON column_mappings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mappings"
  ON column_mappings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Traffic Light Settings Policies
CREATE POLICY "Users can view own settings"
  ON traffic_light_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON traffic_light_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON traffic_light_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON traffic_light_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Excel Data Policies
CREATE POLICY "Users can view own excel data"
  ON excel_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own excel data"
  ON excel_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own excel data"
  ON excel_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own excel data"
  ON excel_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Preferences Policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Machine Targets Policies
CREATE POLICY "Users can view own machine targets"
  ON machine_targets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own machine targets"
  ON machine_targets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own machine targets"
  ON machine_targets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own machine targets"
  ON machine_targets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
