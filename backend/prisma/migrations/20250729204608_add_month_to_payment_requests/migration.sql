-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "landlord_last_read" TIMESTAMPTZ(6),
ADD COLUMN     "tenant_last_read" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "reply_to_id" UUID;

-- AlterTable
ALTER TABLE "payment_requests" ADD COLUMN     "month" TEXT;

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "listingId" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "landlordcomment" TEXT,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID,
    "listing_id" BIGINT,
    "start_date" DATE,
    "end_date" DATE,
    "rent" DOUBLE PRECISION,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "document" TEXT,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_profiles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
