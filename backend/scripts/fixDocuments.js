import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function fixLandlordDocuments() {
  console.log("Fixing landlord documents...");
  const landlords = await prisma.landlord_profiles.findMany();
  console.log(`Found ${landlords.length} landlord profiles`);

  for (const landlord of landlords) {
    let changed = false;
    const fixedDocs = (landlord.documents || []).map((doc) => {
      if (typeof doc === "string") {
        changed = true;
        return {
          path: doc,
          displayName: doc.split("/").pop() || "Document",
        };
      }
      return doc;
    });

    if (changed) {
      try {
        await prisma.landlord_profiles.update({
          where: { id: landlord.id },
          data: { documents: { set: fixedDocs } },
        });
        console.log(`✅ Fixed documents for landlord ${landlord.id}`);
      } catch (error) {
        console.error(
          `❌ Failed to fix documents for landlord ${landlord.id}:`,
          error
        );
      }
    }
  }
}

async function main() {
  try {
    console.log("Starting document fix process...");
    console.log(
      "Note: Only fixing landlord documents (tenant_profiles table does not have documents column)"
    );
    await fixLandlordDocuments();
    console.log("✅ Document fix process completed!");
  } catch (error) {
    console.error("❌ Error in document fix process:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
