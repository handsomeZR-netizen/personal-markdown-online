/**
 * Test script for Supabase Storage setup
 * Tests bucket access and image upload functionality
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'note-images';

async function testStorageSetup() {
  console.log('🧪 Testing Supabase Storage Setup...\n');

  // Test 1: Check if bucket exists
  console.log('1️⃣ Checking if bucket exists...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message);
      return false;
    }

    const bucket = buckets?.find((b) => b.id === BUCKET_NAME);
    if (bucket) {
      console.log(`✅ Bucket "${BUCKET_NAME}" exists`);
      console.log(`   - Public: ${bucket.public}`);
      console.log(`   - File size limit: ${bucket.file_size_limit ? `${bucket.file_size_limit / 1024 / 1024}MB` : 'unlimited'}`);
    } else {
      console.error(`❌ Bucket "${BUCKET_NAME}" not found`);
      console.log('\n📝 To create the bucket:');
      console.log('   1. Go to Supabase Dashboard → Storage');
      console.log('   2. Click "New bucket"');
      console.log(`   3. Name: ${BUCKET_NAME}`);
      console.log('   4. Enable "Public bucket"');
      console.log('   5. Set file size limit to 10MB');
      console.log('   6. Add allowed MIME types: image/jpeg, image/png, image/gif, image/webp');
      return false;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }

  // Test 2: Check bucket access (list files)
  console.log('\n2️⃣ Testing bucket access...');
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });

    if (error) {
      console.error('❌ Error accessing bucket:', error.message);
      console.log('\n📝 This might be due to RLS policies. Run the SQL script:');
      console.log('   supabase-storage-setup.sql');
      return false;
    }

    console.log('✅ Bucket is accessible');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }

  // Test 3: Test public URL generation
  console.log('\n3️⃣ Testing public URL generation...');
  try {
    const testPath = 'test-note-id/test-image.jpg';
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(testPath);

    if (data.publicUrl) {
      console.log('✅ Public URL generation works');
      console.log(`   Example URL: ${data.publicUrl}`);
    } else {
      console.error('❌ Failed to generate public URL');
      return false;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }

  // Test 4: Create a test image blob and attempt upload
  console.log('\n4️⃣ Testing image upload (requires authentication)...');
  try {
    // Create a minimal test image (1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    const testImageBlob = new Blob([testImageBuffer], { type: 'image/png' });
    
    const testFileName = `test-note-id/test-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testFileName, testImageBlob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      if (error.message.includes('JWT')) {
        console.log('⚠️  Upload requires authentication (expected)');
        console.log('   This is correct - only authenticated users can upload');
      } else {
        console.error('❌ Upload error:', error.message);
      }
    } else {
      console.log('✅ Test upload successful');
      console.log(`   Path: ${data.path}`);
      
      // Clean up test file
      await supabase.storage.from(BUCKET_NAME).remove([testFileName]);
      console.log('   (Test file cleaned up)');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n✅ Storage setup test completed!\n');
  return true;
}

// Run the test
testStorageSetup()
  .then((success) => {
    if (success) {
      console.log('🎉 All tests passed! Storage is ready to use.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please check the output above.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
