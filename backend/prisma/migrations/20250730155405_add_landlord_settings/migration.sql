-- Add landlord settings fields
ALTER TABLE "landlord_profiles" ADD COLUMN "rentReminderDays" INTEGER DEFAULT 3;
ALTER TABLE "landlord_profiles" ADD COLUMN "viewingRequestNotifications" BOOLEAN DEFAULT true; 