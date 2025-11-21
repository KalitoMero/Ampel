/*
  # Fix Scrap Settings Table - Add Unique Constraint

  1. Changes
    - Remove duplicate scrap_settings entries (keep only the most recent one per user)
    - Add UNIQUE constraint on user_id to prevent future duplicates
    
  2. Important Notes
    - This ensures each user has exactly one settings record
    - The updateScrapSettings function will now work correctly
*/

DO $$
DECLARE
  duplicate_record RECORD;
BEGIN
  FOR duplicate_record IN
    SELECT user_id, array_agg(id ORDER BY updated_at DESC) as ids
    FROM scrap_settings
    GROUP BY user_id
    HAVING count(*) > 1
  LOOP
    DELETE FROM scrap_settings
    WHERE user_id = duplicate_record.user_id
    AND id != duplicate_record.ids[1];
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'scrap_settings_user_id_unique'
  ) THEN
    ALTER TABLE scrap_settings ADD CONSTRAINT scrap_settings_user_id_unique UNIQUE (user_id);
  END IF;
END $$;
