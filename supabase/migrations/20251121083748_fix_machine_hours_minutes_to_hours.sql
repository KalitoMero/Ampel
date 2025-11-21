/*
  # Fix machine_hours data - convert minutes to hours

  1. Problem
    - Existing data in machine_hours table is stored in minutes instead of hours
    - This causes extremely high values in reports (e.g., 7542 instead of 125.7)

  2. Solution
    - Divide all hours_worked values by 60 to convert minutes to hours
    - Only update rows where hours_worked > 100 (these are clearly in minutes)

  3. Important Notes
    - This is a one-time data fix for existing records
    - New imports will automatically divide by 60 in the import logic
*/

UPDATE machine_hours
SET hours_worked = hours_worked / 60
WHERE hours_worked > 100;
