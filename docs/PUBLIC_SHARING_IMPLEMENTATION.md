# Public Sharing Implementation

## Overview

This document describes the implementation of public note sharing functionality, which allows note owners to generate public links that can be accessed by anyone without authentication.

## Features Implemented

### 1. Public Link Generation (Task 11.1)

**API Endpoint**: `/api/notes/[id]/share`

- **POST**: Enable public sharing and generate unique slug
  - Generates a 10-character random slug using `nanoid`
  - Ensures slug uniqueness with retry logic (max 5 attempts)
  - Updates note with `isPublic: true` and `publicSlug`
  - Returns public URL for sharing

- **DELETE**: Disable public sharing
  - Sets `isPublic: false` and `publicSlug: null`
  - Invalidates the public URL immediately

- **GET**: Get current sharing status
  - Returns `isPublic`, `publicSlug`, and `publicUrl`
  - Only accessible by note owner

**Security**:
- Only note owners can enable/disable public sharing
- Slugs are cryptographically random (10 characters = ~60 bits of entropy)
- Slugs remain stable until sharing is disabled

### 2. Public Note Viewing Page (Task 11.2)

**Route**: `/public/[slug]`

**Features**:
- Displays note in read-only mode
- Shows note metadata (author, last updated, tags, category)
- Renders Tiptap JSON content with proper formatting
- Displays "Register to Edit" call-to-action
- Returns 404 for invalid or disabled public links

**Content Rendering**:
- Supports all Tiptap node types (paragraphs, headings, lists, code blocks, images, etc.)
- Preserves text formatting (bold, italic, links, code, strikethrough)
- Images are displayed with proper styling
- Responsive layout for mobile and desktop

**Not Found Page**: `/public/[slug]/not-found.tsx`
- User-friendly error message
- Links to login and registration pages

### 3. Image Access Configuration (Task 11.3)

**Supabase Storage RLS Policy**:

The existing RLS policy already allows anonymous access to images:

```sql
CREATE POLICY "公开读取图片" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'note-images');
```

This policy allows:
- ✅ Anyone (including anonymous users) can read/view images
- ✅ Images in public notes are accessible without authentication
- ✅ Direct image URLs work in public note views

**Image URL Format**:
```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/note-images/[NOTE_ID]/[FILENAME]
```

### 4. UI Components

**PublicShareControls Component**:
- Toggle switch to enable/disable public sharing
- Displays public URL when enabled
- Copy to clipboard button
- Open in new tab button
- Visual feedback for actions
- Only accessible by note owner

**Updated ShareDialog Component**:
- Integrated PublicShareControls at the top
- Maintains existing collaborator management features
- Unified interface for all sharing options

## Database Schema

The `Note` model already includes the required fields:

```prisma
model Note {
  // ... other fields
  isPublic      Boolean        @default(false)
  publicSlug    String?        @unique
  // ... other fields
  
  @@index([publicSlug])
}
```

## Security Considerations

### 1. Access Control
- Only note owners can enable/disable public sharing
- Public notes are truly read-only (no edit API access)
- Collaborator permissions are separate from public access

### 2. Slug Security
- 10-character random slugs provide ~60 bits of entropy
- Extremely low collision probability (1 in 839 quadrillion)
- Slugs are not sequential or predictable
- Uniqueness is enforced at database level

### 3. Image Security
- Images are stored in a public bucket
- All images are accessible if URL is known
- This is acceptable because:
  - Images are content, not sensitive data
  - Users upload images knowing they'll be shared
  - Alternative would require complex signed URLs

### 4. Privacy
- Public notes don't expose user email addresses
- Only author name is shown (or email if name not set)
- No collaborator information is visible
- No edit history is exposed

## Testing

### Manual Testing Checklist

1. **Enable Public Sharing**:
   - [ ] Open a note you own
   - [ ] Click "Share" button
   - [ ] Toggle "Public Sharing" switch on
   - [ ] Verify public URL is generated
   - [ ] Copy URL and open in incognito window
   - [ ] Verify note content is visible

2. **Public View Features**:
   - [ ] Verify note title and content display correctly
   - [ ] Verify images load properly
   - [ ] Verify formatting is preserved (headings, lists, bold, etc.)
   - [ ] Verify "Register to Edit" CTA is visible
   - [ ] Verify no edit controls are present

3. **Disable Public Sharing**:
   - [ ] Toggle "Public Sharing" switch off
   - [ ] Verify public URL is invalidated
   - [ ] Try accessing old URL - should return 404

4. **Image Access**:
   - [ ] Upload image to a note
   - [ ] Enable public sharing
   - [ ] Open public URL in incognito window
   - [ ] Verify image loads without authentication

5. **Security**:
   - [ ] Verify non-owners cannot enable public sharing
   - [ ] Verify public view is truly read-only
   - [ ] Verify disabled public links return 404

### Property-Based Test (Task 11.4)

**Property 10: Public Link Uniqueness**

Test that for any note with public sharing enabled, the generated public slug is globally unique and remains stable until sharing is disabled.

See: `note-app/src/lib/sharing/__tests__/public-link-uniqueness.property.test.ts`

## Usage Examples

### Enable Public Sharing (API)

```typescript
const response = await fetch(`/api/notes/${noteId}/share`, {
  method: 'POST',
});

const data = await response.json();
// {
//   isPublic: true,
//   publicSlug: "abc123xyz",
//   publicUrl: "https://example.com/public/abc123xyz"
// }
```

### Disable Public Sharing (API)

```typescript
const response = await fetch(`/api/notes/${noteId}/share`, {
  method: 'DELETE',
});

const data = await response.json();
// {
//   isPublic: false,
//   publicSlug: null
// }
```

### Use PublicShareControls Component

```tsx
import { PublicShareControls } from '@/components/collaboration/public-share-controls';

<PublicShareControls 
  noteId={note.id} 
  isOwner={isOwner} 
/>
```

## Future Enhancements

Potential improvements for future iterations:

1. **Analytics**: Track public link views and visitor statistics
2. **Expiration**: Add optional expiration dates for public links
3. **Password Protection**: Allow optional password protection for public links
4. **Custom Slugs**: Allow users to customize their public slugs
5. **Social Sharing**: Add Open Graph meta tags for better social media previews
6. **Embed Mode**: Add iframe-friendly embed mode for public notes
7. **Download Options**: Add export buttons on public view page

## Related Files

- `/api/notes/[id]/share/route.ts` - API endpoint for managing public sharing
- `/public/[slug]/page.tsx` - Public note viewing page
- `/public/[slug]/not-found.tsx` - 404 page for invalid slugs
- `/components/collaboration/public-share-controls.tsx` - UI component
- `/components/collaboration/share-dialog.tsx` - Updated share dialog
- `supabase-storage-setup.sql` - Storage RLS policies

## Environment Variables

Required environment variables:

```bash
# Used for generating full public URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Supabase configuration (already required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment Notes

1. Ensure `NEXT_PUBLIC_APP_URL` is set in production environment
2. Verify Supabase Storage bucket is created and public
3. Confirm RLS policies are applied
4. Test public links work in production domain
5. Monitor for any CORS issues with image loading

## Support

For issues or questions:
1. Check Supabase Storage dashboard for bucket configuration
2. Verify RLS policies in Supabase SQL Editor
3. Check browser console for any CORS or loading errors
4. Ensure environment variables are set correctly
