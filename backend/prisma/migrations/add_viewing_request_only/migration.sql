-- CreateTable
CREATE TABLE "viewingRequest" (
    "id" SERIAL NOT NULL,
    "propertyId" BIGINT NOT NULL,
    "tenantId" UUID NOT NULL,
    "landlordId" UUID NOT NULL,
    "requestedDateTime" TIMESTAMP(3) NOT NULL,
    "proposedDateTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viewingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "viewingRequest_propertyId_idx" ON "viewingRequest"("propertyId");

-- CreateIndex
CREATE INDEX "viewingRequest_tenantId_idx" ON "viewingRequest"("tenantId");

-- CreateIndex
CREATE INDEX "viewingRequest_landlordId_idx" ON "viewingRequest"("landlordId");

-- CreateIndex
CREATE INDEX "viewingRequest_status_idx" ON "viewingRequest"("status");

-- CreateIndex
CREATE INDEX "viewingRequest_requestedDateTime_idx" ON "viewingRequest"("requestedDateTime");

-- Foreign key constraints will be added in a separate migration after column types are confirmed
-- ALTER TABLE "viewingRequest" ADD CONSTRAINT "viewingRequest_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "landlord_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "viewingRequest" ADD CONSTRAINT "viewingRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- ALTER TABLE "viewingRequest" ADD CONSTRAINT "viewingRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE; 