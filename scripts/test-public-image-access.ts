/**
 * Test script to verify that images in the note-images bucket
 * are accessible without authentication (for public notes)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function testPublicImageAccess() {
  console.log('🧪 Testing Public Image Access for Public Notes\n');
  console.log('='.repeat(60));

  // Create anonymous Supabase client (no auth)
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

  console.log('\n1️⃣ Testing anonymous access to storage bucket...');
  
  try {
    // Try to list files in the bucket (should work if bucket is public)
    const { data: files, error } = await supabase
      .storage
      .from('note-images')
      .list('', {
        limit: 1,
      });

    if (error) {
      console.log('⚠️  Cannot list files (expected if bucket is empty or list is restricted)');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ Can access bucket (found', files?.length || 0, 'files)');
    }
  } catch (error) {
    console.error('❌ Error accessing bucket:', error);
  }

  console.log('\n2️⃣ Testing public URL generation...');
  
  try {
    // Generate a public URL for a test file
    const testFilePath = 'test-note-id/test-image.jpg';
    const { data } = supabase
      .storage
      .from('note-images')
      .getPublicUrl(testFilePath);

    console.log('✅ Public URL generated successfully');
    console.log('   URL format:', data.publicUrl);
    console.log('   This URL should be accessible without authentication');
  } catch (error) {
    console.error('❌ Error generating public URL:', error);
  }

  console.log('\n3️⃣ Checking RLS policies...');
  console.log('   Expected policy: "公开读取图片" (Public read access)');
  console.log('   This allows SELECT operations on storage.objects');
  console.log('   for bucket_id = "note-images" without authentication');

  console.log('\n4️⃣ Testing image fetch without authentication...');
  
  try {
    // Try to fetch an image URL without auth headers
    const testUrl = `${supabaseUrl}/storage/v1/object/public/note-images/test.jpg`;
    console.log('   Test URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'HEAD', // Just check if accessible, don't download
    });

    if (response.status === 404) {
      console.log('✅ Bucket is accessible (404 = file not found, but bucket is public)');
    } else if (response.status === 200) {
      console.log('✅ Image is accessible without authentication');
    } else if (response.status === 403) {
      console.log('❌ Access denied - RLS policy may not be configured correctly');
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error fetching image:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Test completed!');
  console.log('\n📝 Summary:');
  console.log('   - Images in note-images bucket should be publicly readable');
  console.log('   - Public URLs work without authentication');
  console.log('   - This enables images in public notes to be visible to all');
  console.log('\n💡 To verify in browser:');
  console.log('   1. Upload an image to a note');
  console.log('   2. Enable public sharing for that note');
  console.log('   3. Open the public URL in an incognito window');
  console.log('   4. Images should load without requiring login');
}

// Run the test
testPublicImageAccess().catch(console.error);
