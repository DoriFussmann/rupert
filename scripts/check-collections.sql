-- Quick SQL query to check collections in your database
-- Run this in your database client (Neon, Supabase, pgAdmin, etc.)

SELECT 
  id,
  name,
  slug,
  "createdAt",
  (SELECT COUNT(*) FROM "Record" WHERE "collectionId" = "Collection".id) as record_count
FROM "Collection"
ORDER BY name;

-- Expected results should include:
-- - Advisors (advisors)
-- - Companies (companies)
-- - Pages (pages)
-- - Structures (structures)
-- - System Prompts (system-prompts)
-- - Tasks (tasks)

