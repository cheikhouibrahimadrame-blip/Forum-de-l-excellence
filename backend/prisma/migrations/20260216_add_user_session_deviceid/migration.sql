-- Add deviceIdHash to UserSession
ALTER TABLE "UserSession" ADD COLUMN "deviceIdHash" VARCHAR(128);
