INSERT INTO "Skill" ("id", "name", "category")
VALUES
  ('skill_aspnet_core_framework', 'ASP.NET Core', 'FRAMEWORK'),
  ('skill_dotnet_framework', '.NET Framework', 'FRAMEWORK')
ON CONFLICT ("name") DO NOTHING;
