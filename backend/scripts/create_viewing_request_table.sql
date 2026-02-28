-- Create ViewingRequest table
CREATE TABLE IF NOT EXISTS "ViewingRequest" (
    "id" SERIAL PRIMARY KEY,
    "propertyId" BIGINT NOT NULL,
    "tenantId" UUID NOT NULL,
    "landlordId" UUID NOT NULL,
    "requestedDateTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE "ViewingRequest" ADD CONSTRAINT "ViewingRequest_propertyId_fkey" 
    FOREIGN KEY ("propertyId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ViewingRequest" ADD CONSTRAINT "ViewingRequest_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ViewingRequest" ADD CONSTRAINT "ViewingRequest_landlordId_fkey" 
    FOREIGN KEY ("landlordId") REFERENCES "landlord_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "ViewingRequest_propertyId_idx" ON "ViewingRequest"("propertyId");
CREATE INDEX IF NOT EXISTS "ViewingRequest_tenantId_idx" ON "ViewingRequest"("tenantId");
CREATE INDEX IF NOT EXISTS "ViewingRequest_landlordId_idx" ON "ViewingRequest"("landlordId");
CREATE INDEX IF NOT EXISTS "ViewingRequest_status_idx" ON "ViewingRequest"("status");
CREATE INDEX IF NOT EXISTS "ViewingRequest_requestedDateTime_idx" ON "ViewingRequest"("requestedDateTime"); 