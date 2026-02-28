-- Add all missing tenant profile fields (comprehensive migration)
-- Add tenant settings fields if they don't exist
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "viewingRequestNotifications" BOOLEAN DEFAULT true;
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "rentReminderDays" INTEGER DEFAULT 3;

-- Add tenant preference fields for filtering listings
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "preferredHouseTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "preferredRentMin" DOUBLE PRECISION;
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "preferredRentMax" DOUBLE PRECISION;
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "preferredDistance" DOUBLE PRECISION; 