ALTER TABLE "EngineerProfile"
  ALTER COLUMN "desiredWeeklyDays" DROP DEFAULT;

ALTER TABLE "EngineerProfile"
  ALTER COLUMN "desiredWeeklyDays" TYPE INTEGER[]
  USING CASE
    WHEN "desiredWeeklyDays" IS NULL THEN ARRAY[]::INTEGER[]
    ELSE ARRAY["desiredWeeklyDays"]
  END;

ALTER TABLE "EngineerProfile"
  ALTER COLUMN "desiredWeeklyDays" SET DEFAULT ARRAY[]::INTEGER[],
  ALTER COLUMN "desiredWeeklyDays" SET NOT NULL;
