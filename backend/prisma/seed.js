import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create sample landlord profiles
  const landlord1Id = uuidv4();
  const landlord1 = await prisma.landlord_profiles.upsert({
    where: { id: landlord1Id },
    update: {},
    create: {
      id: landlord1Id,
      full_name: "John Smith",
      email: "john.smith@example.com",
      phone: "555-0123",
      image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      address: "123 Landlord St, San Francisco, CA 94102",
    },
  });

  const landlord2Id = uuidv4();
  const landlord2 = await prisma.landlord_profiles.upsert({
    where: { id: landlord2Id },
    update: {},
    create: {
      id: landlord2Id,
      full_name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "555-0456",
      image_url: "https://images.unsplash.com/photo-1494790108755-2616b612b647",
      address: "456 Property Ave, Berkeley, CA 94704",
    },
  });

  // Create sample tenant profiles
  const tenant1Id = uuidv4();
  const tenant1 = await prisma.tenant_profiles.upsert({
    where: { id: tenant1Id },
    update: {},
    create: {
      id: tenant1Id,
      full_name: "Emily Davis",
      email: "emily.davis@example.com",
      phone: "555-0789",
      image_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
      address: "789 Tenant Blvd, Oakland, CA 94602",
    },
  });

  const tenant2Id = uuidv4();
  const tenant2 = await prisma.tenant_profiles.upsert({
    where: { id: tenant2Id },
    update: {},
    create: {
      id: tenant2Id,
      full_name: "Michael Brown",
      email: "michael.brown@example.com",
      phone: "555-0321",
      image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
      address: "321 Renter Road, San Jose, CA 95112",
    },
  });

  // Create sample listings
  const listing1 = await prisma.listings.create({
    data: {
      landlord_id: landlord1.id,
      title: "Cozy 2BR Apartment in Downtown SF",
      type: "Apartment",
      address: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zip_code: "94102",
      bedrooms: 2,
      bathrooms: 1,
      area: 900.0,
      price: 2500.0,
      description:
        "Beautiful apartment with city views, walking distance to public transport. Recently renovated with modern amenities.",
      lease_type: "12 months",
      amenities: [
        "In-unit laundry",
        "Dishwasher",
        "Air conditioning",
        "Gym",
        "Roof deck",
      ],
      requirements: "Good credit score, stable income, no pets",
      house_rules: "No smoking, quiet hours after 10 PM",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
      ]),
      landlord_name: landlord1.full_name,
      landlord_phone: landlord1.phone,
      coordinates: "37.7749,-122.4194",
      available: true,
    },
  });

  const listing2 = await prisma.listings.create({
    data: {
      landlord_id: landlord2.id,
      title: "Spacious 3BR House with Garden",
      type: "House",
      address: "456 Oak Ave",
      city: "Berkeley",
      state: "CA",
      zip_code: "94704",
      bedrooms: 3,
      bathrooms: 2,
      area: 1400.0,
      price: 3200.0,
      description:
        "Family-friendly house with a beautiful garden and garage. Perfect for students or families.",
      lease_type: "12 months",
      amenities: [
        "Garden",
        "Garage",
        "Fireplace",
        "Hardwood floors",
        "Updated kitchen",
      ],
      requirements: "First month + security deposit, good references",
      house_rules: "Pets allowed with deposit, no parties",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
        "https://images.unsplash.com/photo-1605146769289-440113cc3d00",
        "https://images.unsplash.com/photo-1449844908441-8829872d2607",
      ]),
      landlord_name: landlord2.full_name,
      landlord_phone: landlord2.phone,
      coordinates: "37.8715,-122.2730",
      available: true,
    },
  });

  const listing3 = await prisma.listings.create({
    data: {
      landlord_id: landlord1.id,
      tenant_id: tenant1.id, // This listing is already rented
      title: "Studio Apartment - Mission District",
      type: "Studio",
      address: "789 Mission St",
      city: "San Francisco",
      state: "CA",
      zip_code: "94103",
      bedrooms: 1,
      bathrooms: 1,
      area: 500.0,
      price: 1800.0,
      description:
        "Compact studio in vibrant Mission District. Great for young professionals.",
      lease_type: "6 months",
      amenities: ["Kitchenette", "Murphy bed", "High-speed internet"],
      requirements: "Young professional preferred",
      house_rules: "No smoking, no pets",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1560184897-ae75f418493e",
      ]),
      landlord_name: landlord1.full_name,
      landlord_phone: landlord1.phone,
      coordinates: "37.7599,-122.4148",
      available: false, // This one is rented
    },
  });

  // Create sample chat
  const chat1 = await prisma.chats.create({
    data: {
      tenant_id: tenant2.id,
      landlord_id: landlord1.id,
      property_id: listing1.id.toString(),
    },
  });

  // Create sample messages
  await prisma.messages.createMany({
    data: [
      {
        chat_id: chat1.id,
        sender_id: tenant2.id,
        content:
          "Hi! I'm very interested in your 2BR apartment. Is it still available?",
        sender_type: "tenant",
      },
      {
        chat_id: chat1.id,
        sender_id: landlord1.id,
        content:
          "Hello! Yes, it's still available. Would you like to schedule a viewing?",
        sender_type: "landlord",
      },
      {
        chat_id: chat1.id,
        sender_id: tenant2.id,
        content:
          "That would be great! I'm available this weekend. What times work for you?",
        sender_type: "tenant",
      },
    ],
  });

  // Create sample lease for the rented listing
  const lease1 = await prisma.leases.create({
    data: {
      tenant_id: tenant1.id,
      listing_id: listing3.id,
      start_date: new Date("2024-01-01"),
      end_date: new Date("2024-12-31"),
      rent: 1800.0,
      signed: true,
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log(
    `👨‍💼 Created landlords: ${landlord1.full_name}, ${landlord2.full_name}`
  );
  console.log(`👨‍💻 Created tenants: ${tenant1.full_name}, ${tenant2.full_name}`);
  console.log(
    `🏠 Created listings: ${listing1.title}, ${listing2.title}, ${listing3.title}`
  );
  console.log(`📄 Created lease for ${tenant1.full_name}`);
  console.log(`💬 Created chat with ${await prisma.messages.count()} messages`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
