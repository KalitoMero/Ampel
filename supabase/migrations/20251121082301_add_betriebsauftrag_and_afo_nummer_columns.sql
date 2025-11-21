/*
  # Add betriebsauftrag and afo_nummer columns to column_mappings

  1. Changes
    - Add `betriebsauftrag` column to `column_mappings` table (required for grouping/summing)
    - Add `afo_nummer` column to `column_mappings` table (work sequence identifier)

  2. Important Notes
    - `betriebsauftrag` is a mandatory field used to group rows that belong to the same work order
    - When multiple rows have the same betriebsauftrag, their ruestzeit and serienzeit values are summed
    - `afo_nummer` identifies which work sequence (Arbeitsfolge) each row belongs to
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'column_mappings' AND column_name = 'betriebsauftrag'
  ) THEN
    ALTER TABLE column_mappings ADD COLUMN betriebsauftrag text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'column_mappings' AND column_name = 'afo_nummer'
  ) THEN
    ALTER TABLE column_mappings ADD COLUMN afo_nummer text;
  END IF;
END $$;
