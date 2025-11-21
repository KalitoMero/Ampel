/*
  # Create Settings and Excel Data Tables

  1. New Tables
    - `traffic_light_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `setting_key` (text, unique) - Key for the setting (e.g., 'hours_14d')
      - `target_hours_14d` (numeric) - Target hours for 14-day period
      - `green_min_ratio` (numeric) - Minimum ratio for green light (e.g., 0.95 = 95%)
      - `yellow_min_ratio` (numeric) - Minimum ratio for yellow light (e.g., 0.80 = 80%)
      - `created_at` (timestamptz) - When setting was created
      - `updated_at` (timestamptz) - When setting was last updated

    - `excel_data`
      - `id` (uuid, primary key) - Unique identifier for each row
      - `mapping_id` (uuid) - Reference to the column mapping used
      - `file_name` (text) - Name of the uploaded Excel file
      - `row_data` (jsonb) - Raw row data from Excel (key-value pairs)
      - `uploaded_at` (timestamptz) - When the data was uploaded
      - `created_at` (timestamptz) - Timestamp

  2. Security
    - Enable RLS on both tables
    - Allow public access for anonymous users (admin is password-protected in frontend)

  3. Notes
    - traffic_light_settings stores configuration for each traffic light metric
    - excel_data stores all uploaded Excel rows for calculations
    - row_data is JSONB to handle flexible column structures
*/

CREATE TABLE IF NOT EXISTS traffic_light_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  target_hours_14d numeric DEFAULT 450,
  green_min_ratio numeric DEFAULT 0.95,
  yellow_min_ratio numeric DEFAULT 0.80,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS excel_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid REFERENCES column_mappings(id),
  file_name text NOT NULL,
  row_data jsonb NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_excel_data_uploaded_at ON excel_data(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_excel_data_mapping_id ON excel_data(mapping_id);

ALTER TABLE traffic_light_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE excel_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read settings"
  ON traffic_light_settings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert settings"
  ON traffic_light_settings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update settings"
  ON traffic_light_settings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete settings"
  ON traffic_light_settings FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read excel data"
  ON excel_data FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert excel data"
  ON excel_data FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update excel data"
  ON excel_data FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete excel data"
  ON excel_data FOR DELETE
  TO anon
  USING (true);

INSERT INTO traffic_light_settings (setting_key, target_hours_14d, green_min_ratio, yellow_min_ratio)
VALUES ('hours_14d', 450, 0.95, 0.80)
ON CONFLICT (setting_key) DO NOTHING;