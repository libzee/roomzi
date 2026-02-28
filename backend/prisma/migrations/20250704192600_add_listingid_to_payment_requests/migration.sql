-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "chats" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" TEXT NOT NULL,
    "landlord_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "tenant_name" TEXT,
    "property_name" TEXT,
    "landlord_name" TEXT,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landlord_profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "image_url" TEXT,
    "address" TEXT,
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "landlord_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "landlord_id" UUID,
    "tenant_id" UUID,
    "title" TEXT,
    "type" VARCHAR,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" VARCHAR,
    "bedrooms" SMALLINT,
    "bathrooms" SMALLINT,
    "area" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "description" TEXT,
    "lease_type" VARCHAR,
    "amenities" TEXT[],
    "requirements" TEXT,
    "house_rules" TEXT,
    "images" TEXT,
    "landlord_name" TEXT,
    "landlord_phone" VARCHAR,
    "coordinates" TEXT,
    "available" BOOLEAN,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "chat_id" UUID NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "image_url" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "tenant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_requests" (
    "id" SERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "listingId" BIGINT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "proofUrl" TEXT,

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlord_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_profiles"("id") ON DELETE SET DEFAULT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
