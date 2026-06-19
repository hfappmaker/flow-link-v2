ALTER TABLE "OAuthAuthorizationCode" ADD COLUMN "resource" TEXT NOT NULL DEFAULT 'https://flow-link-v2.vercel.app/api/mcp';
ALTER TABLE "OAuthAccessToken" ADD COLUMN "resource" TEXT NOT NULL DEFAULT 'https://flow-link-v2.vercel.app/api/mcp';
ALTER TABLE "OAuthRefreshToken" ADD COLUMN "resource" TEXT NOT NULL DEFAULT 'https://flow-link-v2.vercel.app/api/mcp';

CREATE INDEX "OAuthAuthorizationCode_resource_idx" ON "OAuthAuthorizationCode"("resource");
CREATE INDEX "OAuthAccessToken_resource_idx" ON "OAuthAccessToken"("resource");
CREATE INDEX "OAuthRefreshToken_resource_idx" ON "OAuthRefreshToken"("resource");
