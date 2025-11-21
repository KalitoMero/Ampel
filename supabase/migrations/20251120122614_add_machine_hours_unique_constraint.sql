/*
  # Add Unique Constraint to Machine Hours
  
  1. Changes
    - Add unique constraint on (user_id, machine_name, date) to prevent duplicate entries
    - This ensures that when data is re-imported, duplicates are avoided
  
  2. Notes
    - The constraint allows for efficient upsert operations
    - Each user can have one record per machine per date
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'machine_hours_user_machine_date_key'
  ) THEN
    ALTER TABLE machine_hours 
    ADD CONSTRAINT machine_hours_user_machine_date_key 
    UNIQUE (user_id, machine_name, date);
  END IF;
END $$;