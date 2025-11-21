/*
  # Create machine targets table

  1. New Tables
    - `machine_targets`
      - `id` (uuid, primary key) - Unique identifier
      - `machine_name` (text, unique, not null) - Name of the machine/resource
      - `target_hours_14d` (numeric, default 0) - Target hours for 14 days
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - When the record was last updated

  2. Security
    - Enable RLS on `machine_targets` table
    - Add policies for authenticated users to read all machine targets
    - Add policies for authenticated users to insert and update machine targets

  3. Important Notes
    - Machine names are automatically discovered from Excel imports
    - Each machine can only have one target entry (enforced by unique constraint)
    - Target hours default to 0 until manually set by admin
*/

CREATE TABLE IF NOT EXISTS machine_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_name text UNIQUE NOT NULL,
  target_hours_14d numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE machine_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read machine targets"
  ON machine_targets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert machine targets"
  ON machine_targets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update machine targets"
  ON machine_targets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete machine targets"
  ON machine_targets
  FOR DELETE
  TO authenticated
  USING (true);
