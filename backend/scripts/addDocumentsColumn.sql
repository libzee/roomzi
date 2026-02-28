-- Add documents column to tenant_profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tenant_profiles' 
        AND column_name = 'documents'
    ) THEN
        ALTER TABLE tenant_profiles ADD COLUMN documents JSON[] DEFAULT '{}';
        RAISE NOTICE 'Added documents column to tenant_profiles table';
    ELSE
        RAISE NOTICE 'documents column already exists in tenant_profiles table';
    END IF;
END $$; 