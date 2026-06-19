INSERT INTO "Skill" ("id", "name", "category")
VALUES
  ('skill_oracle_database_database', 'Oracle Database', 'DATABASE'),
  ('skill_sqlite_database', 'SQLite', 'DATABASE'),
  ('skill_sql_server_database', 'SQL Server', 'DATABASE'),
  ('skill_wpf_framework', 'WPF', 'FRAMEWORK')
ON CONFLICT ("name") DO UPDATE
SET "category" = EXCLUDED."category";

DELETE FROM "Skill"
WHERE "name" = 'Remix';
