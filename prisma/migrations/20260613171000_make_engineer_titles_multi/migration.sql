ALTER TABLE "EngineerProfile"
  ALTER COLUMN "title" DROP DEFAULT;

ALTER TABLE "EngineerProfile"
  ALTER COLUMN "title" TYPE TEXT[]
  USING CASE
    WHEN "title" IS NULL OR "title" = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY["title"]
  END;

ALTER TABLE "EngineerProfile"
  ALTER COLUMN "title" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "title" SET NOT NULL;
