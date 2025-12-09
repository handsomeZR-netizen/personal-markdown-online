/**
 * Script to create the note-images storage bucket via Supabase Management API
 * This is an alternative to manual creation through the dashboard
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const BUCKET_NAME = 'note-images';
const BUCKET_CONFIG = {
  id: BUCKET_NAME,
  name: BUCKET_NAME,
  public: true,
  file_size_limit: 10485760, // 10MB
  allowed_mime_types: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
};

async function createStorageBucket() {
  console.log('🚀 Creating Supabase Storage bucket...\n');

  // Use service role key if available, otherwise use anon key
  const apiKey = supabaseServiceKey || supabaseAnonKey;
  const supabase = createClient(supabaseUrl, apiKey);

  // Check if bucket already exists
  console.log('1️⃣ Checking if bucket already exists...');
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    console.log('\n📝 You may need to create the bucket manually:');
    console.log('   1. Go to Supabase Dashboard → Storage');
    console.log('   2. Click "New bucket"');
    console.log(`   3. Name: ${BUCKET_NAME}`);
    console.log('   4. Enable "Public bucket"');
    console.log('   5. Set file size limit to 10MB');
    process.exit(1);
  }

  const existingBucket = existingBuckets?.find((b) => b.id === BUCKET_NAME);
  if (existingBucket) {
    console.log(`✅ Bucket "${BUCKET_NAME}" already exists`);
    console.log(`   - Public: ${existingBucket.public}`);
    console.log(`   - File size limit: ${existingBucket.file_size_limit ? `${existingBucket.file_size_limit / 1024 / 1024}MB` : 'unlimited'}`);
    console.log('\n✨ No action needed. Bucket is ready to use!');
    return;
  }

  // Create the bucket
  console.log(`2️⃣ Creating bucket "${BUCKET_NAME}"...`);
  
  if (!supabaseServiceKey) {
    console.log('\n⚠️  Service role key not found.');
    console.log('Creating a bucket requires admin privileges.');
    console.log('\nPlease create the bucket manually:');
    console.log('   1. Go to Supabase Dashboard → Storage');
    console.log('   2. Click "New bucket"');
    console.log(`   3. Name: ${BUCKET_NAME}`);
    console.log('   4. Enable "Public bucket"');
    console.log('   5. Set file size limit to 10MB');
    console.log('   6. Add allowed MIME types:');
    BUCKET_CONFIG.allowed_mime_types.forEach((type) => {
      console.log(`      - ${type}`);
    });
    console.log('\nOr add SUPABASE_SERVICE_ROLE_KEY to .env.local and run this script again.');
    process.exit(1);
  }

  const { data: newBucket, error: createError } = await supabase.storage.createBucket(
    BUCKET_NAME,
    {
      public: BUCKET_CONFIG.public,
      fileSizeLimit: BUCKET_CONFIG.file_size_limit,
      allowedMimeTypes: BUCKET_CONFIG.allowed_mime_types,
    }
  );

  if (createError) {
    console.error('❌ Error creating bucket:', createError.message);
    console.log('\n📝 Please create the bucket manually through the Supabase Dashboard.');
    process.exit(1);
  }

  console.log(`✅ Bucket "${BUCKET_NAME}" created successfully!`);
  console.log(`   - ID: ${newBucket.name}`);
  console.log(`   - Public: ${BUCKET_CONFIG.public}`);
  console.log(`   - File size limit: ${BUCKET_CONFIG.file_size_limit / 1024 / 1024}MB`);

  console.log('\n3️⃣ Next steps:');
  console.log('   1. Run the SQL script to configure RLS policies:');
  console.log('      supabase-storage-setup.sql');
  console.log('   2. Test the setup:');
  console.log('      npm run test:storage');

  console.log('\n✨ Bucket creation completed!');
}

// Run the script
createStorageBucket()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
