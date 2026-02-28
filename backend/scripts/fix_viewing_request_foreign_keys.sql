-- Add foreign key constraints for viewingRequest table
-- These were commented out in the original migration

-- Add foreign key for landlordId
ALTER TABLE "viewingRequest" 
ADD CONSTRAINT "viewingRequest_landlordId_fkey" 
FOREIGN KEY ("landlordId") 
REFERENCES "landlord_profiles"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key for propertyId
ALTER TABLE "viewingRequest" 
ADD CONSTRAINT "viewingRequest_propertyId_fkey" 
FOREIGN KEY ("propertyId") 
REFERENCES "listings"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key for tenantId
ALTER TABLE "viewingRequest" 
ADD CONSTRAINT "viewingRequest_tenantId_fkey" 
FOREIGN KEY ("tenantId") 
REFERENCES "tenant_profiles"("id") 
ON DELETE CASCADE ON UPDATE CASCADE; 