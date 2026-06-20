INSERT INTO "Skill" ("id", "name", "category")
VALUES
  ('skill_dotnet_framework_base', '.NET', 'FRAMEWORK'),
  ('skill_aws_cdk_infra', 'AWS CDK', 'INFRA'),
  ('skill_jest_tool', 'Jest', 'TOOL'),
  ('skill_storybook_tool', 'Storybook', 'TOOL')
ON CONFLICT ("name") DO UPDATE
SET "category" = EXCLUDED."category";

DELETE FROM "Skill"
WHERE "name" = 'ASP.NET';
