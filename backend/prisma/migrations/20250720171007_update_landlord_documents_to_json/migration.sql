/*
  Warnings:

  - The `documents` column on the `landlord_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `ViewingRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "landlord_last_read" TIMESTAMPTZ(6),
ADD COLUMN     "tenant_last_read" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "landlord_profiles" DROP COLUMN "documents",
ADD COLUMN     "documents" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "reply_to_id" UUID;

-- Add documents column to tenant_profiles
ALTER TABLE "tenant_profiles" ADD COLUMN "documents" JSONB[] DEFAULT ARRAY[]::JSONB[];

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
