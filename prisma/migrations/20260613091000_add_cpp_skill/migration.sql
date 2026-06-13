INSERT INTO "Skill" ("id", "name", "category")
VALUES ('skill_cpp_language', 'C++', 'LANGUAGE')
ON CONFLICT ("name") DO NOTHING;
