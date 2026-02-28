# Database Update Scripts

## Chat Names Update

### Overview
This script updates existing chats in the database to use current names from their related tables instead of potentially outdated cached names.

### What It Does
1. **Fetches all chats** with their related tenant, landlord, and property information
2. **Compares current names** from the related tables with stored names
3. **Updates chats** that have outdated or missing name information
4. **Provides detailed logging** of the update process

### Why This Is Needed
- Chats created before the name population logic may have `null` values
- Names in profiles/properties may have been updated after chat creation
- Ensures consistency between chat data and current profile information

### Running the Update

```bash
# From the backend directory
npm run update:chat-names
```

### Expected Output
```
🔄 Starting chat names update...
📊 Found 15 chats to process
✅ Updated chat chat-123: { tenant: 'John Doe', landlord: 'Jane Smith', property: 'Downtown Apartment' }
⏭️  Skipped chat chat-124 - already up to date
❌ Error updating chat chat-125: Related profile not found

📈 Update Summary:
✅ Updated: 8 chats
⏭️  Skipped: 6 chats
📊 Total processed: 15 chats
🎉 Chat names update completed!
```

### Safety Features
- **Non-destructive**: Only updates chats that need changes
- **Error handling**: Continues processing even if individual chats fail
- **Detailed logging**: Shows exactly what was updated and why
- **Summary report**: Provides overview of the entire process

### After Running
- All existing chats will have current names from their related tables
- New chats will be created without storing names (they'll be fetched dynamically)
- The API will now use proper joins to get current information

### Troubleshooting
If you encounter errors:
1. Check that your database connection is working
2. Verify that the related tables (tenant_profiles, landlord_profiles, listings) exist
3. Ensure the foreign key relationships are properly set up
4. Check the console output for specific error messages 