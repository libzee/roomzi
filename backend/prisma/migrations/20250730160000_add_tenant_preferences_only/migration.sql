-- Add tenant preference fields for filtering listings (safe migration - no data loss)
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "preferredHouseTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "preferredRentMin" DOUBLE PRECISION;
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "preferredRentMax" DOUBLE PRECISION;
ALTER TABLE "tenant_profiles" ADD COLUMN IF NOT EXISTS "preferredDistance" DOUBLE PRECISION; 