import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize storage buckets if they don't exist
export const initializeStorageBuckets = async () => {
  try {
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return;
    }

    // Check for profile-images bucket
    const profileImagesBucket = buckets.find(
      (b) => b.name === "profile-images"
    );
    if (!profileImagesBucket) {
      const { error: createBucketError } = await supabase.storage.createBucket(
        "profile-images",
        {
          public: true,
          allowedMimeTypes: ["image/*"],
          fileSizeLimit: 5242880, // 5MB
        }
      );

      if (createBucketError) {
        console.error(
          "Error creating profile-images bucket:",
          createBucketError
        );
      } else {
        console.log("✅ Created profile-images storage bucket");
      }
    }

    // Check for listings bucket (for property images)
    const listingsBucket = buckets.find((b) => b.name === "listings");
    if (!listingsBucket) {
      const { error: createBucketError } = await supabase.storage.createBucket(
        "listings",
        {
          public: true,
          allowedMimeTypes: ["image/*"],
          fileSizeLimit: 10485760, // 10MB
        }
      );

      if (createBucketError) {
        console.error("Error creating listings bucket:", createBucketError);
      } else {
        console.log("✅ Created listings storage bucket");
      }
    }

    // Check for documents bucket (for verification documents)
    const documentsBucket = buckets.find((b) => b.name === "documents");
    if (!documentsBucket) {
      const { error: createBucketError } = await supabase.storage.createBucket(
        "documents",
        {
          public: false, // Documents should be private
          allowedMimeTypes: [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ],
          fileSizeLimit: 10485760, // 10MB
        }
      );

      if (createBucketError) {
        console.error("Error creating documents bucket:", createBucketError);
      } else {
        console.log("✅ Created documents storage bucket");
      }
    }
  } catch (error) {
    console.error("Error initializing storage buckets:", error);
  }
};
