/*
  # Update column_mappings table for TEG calculation from two columns

  1. Changes
    - Drop the old `stunden_teg` column from `column_mappings` table
    - Add new `ruestzeit` column (setup time column name)
    - Add new `serienzeit` column (production time per piece column name)
    - Update `user_preferences` table to store last used ruestzeit and serienzeit columns
    - Drop old `last_stunden_teg_column` from user_preferences
    - Add `last_ruestzeit_column` and `last_serienzeit_column` to user_preferences

  2. Important Notes
    - TEG (total hours) will now be calculated as: ruestzeit + serienzeit
    - Both columns are required for proper machine hours calculation
    - Existing mappings may need to be recreated by users
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'column_mappings' AND column_name = 'stunden_teg'
  ) THEN
    ALTER TABLE column_mappings DROP COLUMN stunden_teg;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'column_mappings' AND column_name = 'ruestzeit'
  ) THEN
    ALTER TABLE column_mappings ADD COLUMN ruestzeit text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'column_mappings' AND column_name = 'serienzeit'
  ) THEN
    ALTER TABLE column_mappings ADD COLUMN serienzeit text;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'last_stunden_teg_column'
  ) THEN
    ALTER TABLE user_preferences DROP COLUMN last_stunden_teg_column;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'last_ruestzeit_column'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN last_ruestzeit_column text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'last_serienzeit_column'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN last_serienzeit_column text;
  END IF;
END $$;
