/*
  # Update Column Mappings RLS Policies

  1. Changes
    - Drop existing restrictive policies that require authentication
    - Create new policies that allow anonymous access
    - This is necessary because the app doesn't have authentication yet

  2. Security Notes
    - These policies allow public access to the column_mappings table
    - In a production environment, you would want to add authentication
    - For now, this allows the admin area (password-protected in frontend) to work
*/

DROP POLICY IF EXISTS "Authenticated users can view all mappings" ON column_mappings;
DROP POLICY IF EXISTS "Authenticated users can insert mappings" ON column_mappings;
DROP POLICY IF EXISTS "Authenticated users can update mappings" ON column_mappings;
DROP POLICY IF EXISTS "Authenticated users can delete mappings" ON column_mappings;

CREATE POLICY "Allow public read access"
  ON column_mappings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access"
  ON column_mappings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON column_mappings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access"
  ON column_mappings FOR DELETE
  TO anon
  USING (true);