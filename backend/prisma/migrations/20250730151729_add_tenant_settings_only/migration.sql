-- Add tenant settings fields
ALTER TABLE "tenant_profiles" ADD COLUMN "viewingRequestNotifications" BOOLEAN DEFAULT true;
ALTER TABLE "tenant_profiles" ADD COLUMN "rentReminderDays" INTEGER DEFAULT 3; 