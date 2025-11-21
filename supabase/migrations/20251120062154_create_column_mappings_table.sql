/*
  # Excel Column Mappings Table

  1. New Tables
    - `column_mappings`
      - `id` (uuid, primary key) - Unique identifier for each mapping
      - `mapping_name` (text) - Name/description of this mapping configuration
      - `stunden_teg` (text) - Column name for "Stunden (TEG)" field
      - `ausschussmenge` (text) - Column name for "Ausschussmenge" field
      - `datum` (text) - Column name for "Datum oder Jahr/Monat" field
      - `auftragsnummer` (text) - Column name for "Internes BA-Kürzel / Auftragsnummer" field
      - `ressource` (text) - Column name for "Ressource (Maschine)" field
      - `menge_gut` (text, nullable) - Column name for "Menge gut" field (optional)
      - `created_at` (timestamptz) - Timestamp when mapping was created
      - `updated_at` (timestamptz) - Timestamp when mapping was last updated

  2. Security
    - Enable RLS on `column_mappings` table
    - Add policy for authenticated users to read all mappings
    - Add policy for authenticated users to insert mappings
    - Add policy for authenticated users to update mappings
    - Add policy for authenticated users to delete mappings

  3. Notes
    - This table stores the column name mappings from Excel files
    - Each mapping configuration can be reused for processing multiple Excel files
    - The mapping_name allows users to save different configurations for different file formats
*/

CREATE TABLE IF NOT EXISTS column_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_name text NOT NULL DEFAULT 'Standard Mapping',
  stunden_teg text,
  ausschussmenge text,
  datum text,
  auftragsnummer text,
  ressource text,
  menge_gut text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all mappings"
  ON column_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert mappings"
  ON column_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update mappings"
  ON column_mappings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete mappings"
  ON column_mappings FOR DELETE
  TO authenticated
  USING (true);