-- Fix Traffic Light Settings RLS Policies
--
-- 1. Changes
--    - Drop old policies that only allowed 'anon' role
--    - Create new policies for 'authenticated' users
--    - Allow authenticated users to read, insert, and update settings
--
-- 2. Security
--    - Authenticated users can access and modify traffic light settings
--    - Each user can only access their own settings (based on user_id)
--    - Settings without user_id can be read by anyone (for backwards compatibility)

-- Drop old policies
DROP POLICY IF EXISTS "Allow public read settings" ON traffic_light_settings;
DROP POLICY IF EXISTS "Allow public insert settings" ON traffic_light_settings;
DROP POLICY IF EXISTS "Allow public update settings" ON traffic_light_settings;
DROP POLICY IF EXISTS "Allow public delete settings" ON traffic_light_settings;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can read settings"
  ON traffic_light_settings FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Authenticated users can insert settings"
  ON traffic_light_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Authenticated users can update settings"
  ON traffic_light_settings FOR UPDATE
  TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Authenticated users can delete settings"
  ON traffic_light_settings FOR DELETE
  TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());