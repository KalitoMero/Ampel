-- Check column mappings
SELECT * FROM column_mappings ORDER BY created_at DESC LIMIT 1;

-- Check sample excel data
SELECT id, file_name, created_at, 
       jsonb_pretty(row_data) as data
FROM excel_data 
ORDER BY created_at DESC 
LIMIT 5;
