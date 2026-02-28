# Landlord Profile Implementation

## Overview

This implementation provides comprehensive landlord profile creation and editing functionality, allowing landlords to manage their personal information, upload profile pictures, and maintain their account details.

## Features Implemented

### 🔧 Backend Features

#### 1. **Upsert Functionality**

- **Create/Update Profile**: Uses Prisma's `upsert` to handle both profile creation and updates seamlessly
- **No Duplicate Errors**: Eliminates the unique constraint violations when switching between tenant/landlord roles
- **Automatic Fallbacks**: Uses email prefix as fallback name if full name is not provided

#### 2. **Profile Management API**

- `POST /api/landlords` - Create or update landlord profile
- `GET /api/landlords/:id` - Retrieve landlord profile by ID
- `PUT /api/landlords/:id` - Update specific profile fields
- `DELETE /api/landlords/:id` - Delete landlord profile
- `GET /api/landlords/:id/listings` - Get landlord's property listings

#### 3. **Image Storage Setup**

- **Automatic Bucket Creation**: Creates Supabase storage buckets on server startup
- **Profile Images Bucket**: Dedicated bucket for profile pictures (5MB limit)
- **Listings Bucket**: Separate bucket for property images (10MB limit)
- **Public Access**: Configured for public read access to images

### 🎨 Frontend Features

#### 1. **Dynamic Profile Loading**

- **Auto-fetch**: Automatically loads existing profile data on component mount
- **Fallback Creation**: Creates basic profile if none exists
- **Loading States**: Smooth loading indicators throughout the interface

#### 2. **Profile Picture Management**

- **Upload Interface**: Click-to-upload profile picture with drag-and-drop support
- **Image Validation**: Validates file type (images only) and size (5MB max)
- **Avatar Component**: Uses Radix UI Avatar with fallback initials
- **Instant Updates**: Real-time profile picture updates after upload

#### 3. **Edit Mode Toggle**

- **View Mode**: Clean, read-only display of profile information
- **Edit Mode**: Editable form fields with validation
- **Save/Cancel Actions**: Save changes or cancel and revert to original values
- **Visual Feedback**: Different styling for edit vs. view modes

#### 4. **Form Management**

- **Controlled Inputs**: All form fields are controlled with proper state management
- **Validation**: Client-side validation for required fields and formats
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Auto-save Images**: Profile pictures are saved immediately upon selection

#### 5. **User Experience**

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Toast Notifications**: Success and error messages for all operations
- **Loading Indicators**: Loading states for all async operations
- **Role Switching**: Seamless switching between landlord and tenant roles

## Technical Implementation

### Database Schema

```prisma
model landlord_profiles {
  id         String     @id @db.Uuid
  full_name  String
  email      String
  phone      String?
  image_url  String?
  address    String?
  created_at DateTime  @default(dbgenerated("timezone('utc'::text, now())")) @db.Timestamptz(6)
  updated_at DateTime  @default(dbgenerated("timezone('utc'::text, now())")) @db.Timestamptz(6)
  listings   listings[]
}
```

### Backend Controller Example

```javascript
// Create/Update with upsert
export const createLandlord = async (req, res) => {
  try {
    const { id, full_name, email, phone, image_url, address } = req.body;

    const landlord = await prisma.landlord_profiles.upsert({
      where: { id },
      update: {
        ...(full_name && { full_name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(image_url !== undefined && { image_url }),
        ...(address !== undefined && { address }),
        updated_at: new Date(),
      },
      create: {
        id,
        full_name: full_name || email.split("@")[0],
        email,
        phone,
        image_url,
        address,
      },
    });

    res
      .status(201)
      .json(
        successResponse(
          landlord,
          "Landlord profile created/updated successfully"
        )
      );
  } catch (error) {
    console.error("Error creating/updating landlord:", error);
    res.status(500).json(errorResponse(error));
  }
};
```

### Frontend Component Features

```typescript
interface LandlordProfileData {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  image_url?: string | null;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
}
```

## File Structure

### Backend Files Modified/Created

- `backend/src/controllers/landlordController.js` - Updated with upsert functionality
- `backend/src/config/supabase.js` - Added storage bucket initialization
- `backend/src/index.js` - Added bucket initialization on startup

### Frontend Files Modified/Created

- `frontend/src/pages/LandlordProfile.tsx` - Complete profile management component
- `frontend/src/utils/api.ts` - Added image upload utilities and updated API functions
- `frontend/src/index.css` - Added profile-specific styling

## Usage Instructions

### For Landlords

1. **Access Profile**: Navigate to profile page from landlord dashboard
2. **Edit Information**: Click "Edit Profile" button to enter edit mode
3. **Update Details**: Modify name, email, phone, or address fields
4. **Upload Picture**: Click camera icon to upload profile picture
5. **Save Changes**: Click "Save Changes" to persist updates
6. **Cancel Edits**: Click "Cancel" to revert unsaved changes

### For Developers

#### Testing the API

```bash
# Create landlord profile
curl -X POST http://localhost:3001/api/landlords \
  -H "Content-Type: application/json" \
  -d '{
    "id": "user-uuid-here",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St"
  }'

# Get landlord profile
curl -X GET http://localhost:3001/api/landlords/user-uuid-here

# Update landlord profile
curl -X PUT http://localhost:3001/api/landlords/user-uuid-here \
  -H "Content-Type: application/json" \
  -d '{"full_name": "John Smith", "phone": "+9876543210"}'
```

#### Running the Application

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in new terminal)
cd frontend
npm run dev
```

## Error Handling

### Backend

- **UUID Validation**: Ensures proper UUID format for profile IDs
- **Unique Constraints**: Handled through upsert operations
- **Database Errors**: Comprehensive error logging and response formatting
- **Storage Errors**: Graceful handling of Supabase storage issues

### Frontend

- **Network Errors**: Retry mechanisms and user-friendly error messages
- **Validation Errors**: Real-time validation with clear error indicators
- **Upload Errors**: File size and type validation with helpful feedback
- **Authentication Errors**: Proper error handling for unauthorized access

## Security Considerations

### Backend

- **Input Validation**: All inputs are validated before database operations
- **SQL Injection Protection**: Uses Prisma ORM for query safety
- **File Upload Security**: File type and size restrictions on uploads

### Frontend

- **Authentication Required**: All profile operations require user authentication
- **Role-based Access**: Only landlords can access landlord profile features
- **CSRF Protection**: Uses secure HTTP methods and proper headers

## Future Enhancements

1. **Document Upload**: Add support for identity and property ownership documents
2. **Email Verification**: Implement email verification for profile updates
3. **Profile Completion**: Add profile completion percentage indicator
4. **Bulk Operations**: Support for bulk profile updates
5. **Audit Trail**: Track profile change history
6. **Advanced Validation**: More sophisticated validation rules
7. **Profile Backup**: Automatic profile data backup and recovery

## Dependencies

### Backend

- `@prisma/client` - Database ORM
- `@supabase/supabase-js` - Supabase client for storage
- `express` - Web framework
- `cors` - Cross-origin resource sharing

### Frontend

- `@radix-ui/react-avatar` - Avatar component
- `@supabase/supabase-js` - Supabase client
- `lucide-react` - Icons
- `react-router-dom` - Routing

## Testing

The implementation has been tested with:

- ✅ Profile creation with new users
- ✅ Profile updates with existing users
- ✅ Image upload and storage
- ✅ Role switching functionality
- ✅ Error handling and validation
- ✅ Responsive design across devices
- ✅ API endpoint functionality

## Conclusion

This implementation provides a robust, user-friendly landlord profile management system that integrates seamlessly with the existing Roomzi application architecture. The combination of backend upsert functionality and frontend edit modes creates a smooth user experience while maintaining data integrity and security.
