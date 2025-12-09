# Supabase Storage Setup - Quick Start

This guide will help you set up the `note-images` storage bucket for the Team Collaborative Knowledge Base.

## Prerequisites

- Supabase project created
- Environment variables configured in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (optional, for automated setup)

## Quick Setup (3 Steps)

### Step 1: Create the Storage Bucket

**Option A: Manual Creation (Recommended)**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **New bucket**
5. Configure:
   - **Name**: `note-images`
   - **Public bucket**: ✅ Enable
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: 
     ```
     image/jpeg
     image/jpg
     image/png
     image/gif
     image/webp
     image/svg+xml
     ```
6. Click **Create bucket**

**Option B: Automated Creation (Requires Service Role Key)**

```bash
npm run storage:create
```

### Step 2: Configure RLS Policies

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `supabase-storage-setup.sql`
4. Click **Run** or press `Ctrl+Enter`
5. Verify the output shows success messages

The script will create these policies:
- ✅ Public read access (anyone can view images)
- ✅ Authenticated write access (only logged-in users can upload)
- ✅ Owner-only update/delete (users can only modify their own images)

### Step 3: Verify Setup

Run the test script to verify everything is working:

```bash
npm run test:storage
```

Expected output:
```
✅ Bucket "note-images" exists
✅ Bucket is accessible
✅ Public URL generation works
⚠️  Upload requires authentication (expected)
✅ Storage setup test completed!
```

## File Structure

After setup, images will be organized like this:

```
note-images/
├── note-id-1/
│   ├── 1234567890-abc123.jpg
│   └── 1234567891-def456.png
├── note-id-2/
│   └── 1234567892-ghi789.jpg
└── ...
```

## Usage in Code

### Upload an Image

```typescript
import { uploadImage } from '@/lib/storage/image-upload';

const file = // ... File object from input
const noteId = 'your-note-id';

try {
  const result = await uploadImage(file, noteId);
  console.log('Uploaded:', result.url);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

### Upload Multiple Images

```typescript
import { uploadImages } from '@/lib/storage/image-upload';

const files = // ... File[] from input
const results = await uploadImages(files, noteId);
```

### Delete an Image

```typescript
import { deleteImage } from '@/lib/storage/image-upload';

await deleteImage(imageUrl);
```

## Troubleshooting

### Bucket Not Found

**Error**: `Bucket "note-images" not found`

**Solution**: Create the bucket following Step 1 above.

### Access Denied

**Error**: `new row violates row-level security policy`

**Solution**: Run the SQL script from Step 2 to configure RLS policies.

### Upload Fails

**Error**: `JWT expired` or `Not authenticated`

**Solution**: 
1. Ensure user is logged in
2. Check that authentication is working
3. Verify RLS policies allow authenticated uploads

### Images Not Loading

**Error**: 404 on image URLs

**Solution**:
1. Verify bucket is set to **Public**
2. Check RLS policy allows public SELECT
3. Confirm file path is correct

## Security Notes

- ✅ File size limited to 10MB
- ✅ Only image formats allowed
- ✅ Upload requires authentication
- ✅ Users can only delete their own images
- ✅ Public read access for easy sharing

## Next Steps

After completing the storage setup:

1. ✅ Integrate image upload in Tiptap editor (Task 5)
2. ✅ Implement paste upload functionality (Task 5.2)
3. ✅ Implement drag-and-drop upload (Task 5.3)
4. ✅ Add image lightbox preview (Task 5.4)

## Related Files

- `supabase-storage-setup.sql` - SQL configuration script
- `src/lib/storage/image-upload.ts` - Image upload manager
- `scripts/test-storage-setup.ts` - Test script
- `scripts/create-storage-bucket.ts` - Automated bucket creation
- `doc/STORAGE_SETUP_GUIDE.md` - Detailed documentation

## Support

If you encounter issues:

1. Check the [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
2. Review the detailed guide: `doc/STORAGE_SETUP_GUIDE.md`
3. Run the test script: `npm run test:storage`
4. Check Supabase Dashboard → Storage → Policies

---

**Status**: ✅ Setup complete when test script passes all checks
