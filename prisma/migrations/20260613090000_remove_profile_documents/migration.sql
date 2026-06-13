ALTER TABLE "EngineerProfile"
  DROP COLUMN IF EXISTS "resumeFileName",
  DROP COLUMN IF EXISTS "resumeFilePath",
  DROP COLUMN IF EXISTS "resumeUploadedAt",
  DROP COLUMN IF EXISTS "workHistoryFileName",
  DROP COLUMN IF EXISTS "workHistoryFilePath",
  DROP COLUMN IF EXISTS "workHistoryUploadedAt";
