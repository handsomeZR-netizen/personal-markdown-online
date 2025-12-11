import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SeedOptions {
  reset?: boolean;
  userCount?: number;
  noteCount?: number;
  folderCount?: number;
}

interface SeedResult {
  users: number;
  folders: number;
  notes: number;
  tags: number;
  categories: number;
  collaborators: number;
  templates: number;
}

// Sample data generators
const sampleTags = [
  'work', 'personal', 'ideas', 'todo', 'important',
  'project', 'meeting', 'research', 'draft', 'review'
];

const sampleCategories = [
  'Work', 'Personal', 'Projects', 'Ideas', 'Notes'
];

const sampleFolderNames = [
  'Work Projects', 'Personal Notes', 'Meeting Notes', 'Research',
  'Ideas & Brainstorming', 'Documentation', 'Archive', 'Drafts'
];

const sampleNoteTitles = [
  'Project Planning', 'Meeting Notes', 'Research Findings', 'Todo List',
  'Ideas for Next Quarter', 'Technical Documentation', 'Design Concepts',
  'Code Review Notes', 'Sprint Retrospective', 'Client Feedback'
];

const sampleNoteContents = [
  {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Project Overview' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'This is a comprehensive project plan with key milestones and deliverables.' }]
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 1: Research and Planning' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 2: Development' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase 3: Testing and Deployment' }] }] }
        ]
      }
    ]
  },
  {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Meeting Summary' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Key discussion points from today\'s meeting:' }]
      },
      {
        type: 'orderedList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Review current progress' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Discuss blockers and challenges' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Plan next steps' }] }] }
        ]
      }
    ]
  }
];

const sampleTemplates = [
  {
    name: 'Meeting Notes',
    description: 'Template for recording meeting notes',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Meeting Notes' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Date: ' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Attendees: ' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Agenda' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Discussion' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action Items' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] }
      ]
    })
  },
  {
    name: 'Project Plan',
    description: 'Template for project planning',
    content: JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Project Plan' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Goals' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Timeline' }] },
        { type: 'paragraph' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Resources' }] },
        { type: 'paragraph' }
      ]
    })
  }
];

// Color palette for user avatars
const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
];

/**
 * Reset the database by deleting all data
 */
async function resetDatabase(): Promise<void> {
  console.log('🗑️  Resetting database...');
  
  // Delete in correct order to respect foreign key constraints
  await prisma.noteVersion.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.note.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.noteTemplate.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Database reset complete');
}

/**
 * Create sample users
 */
async function createUsers(count: number): Promise<any[]> {
  console.log(`👥 Creating ${count} users...`);
  const users = [];
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  for (let i = 0; i < count; i++) {
    const userId = `user-${i + 1}-${Date.now()}`;
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: `user${i + 1}@example.com`,
        password: hashedPassword,
        name: `User ${i + 1}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
        color: colors[i % colors.length],
        updatedAt: new Date(),
        UserPreference: {
          create: {
            id: `pref-user${i + 1}-${Date.now()}`,
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            updatedAt: new Date()
          }
        }
      }
    });
    users.push(user);
  }
  
  console.log(`✅ Created ${users.length} users`);
  return users;
}

/**
 * Create sample tags
 */
async function createTags(): Promise<any[]> {
  console.log(`🏷️  Creating tags...`);
  const tags = [];
  
  for (let i = 0; i < sampleTags.length; i++) {
    const tag = await prisma.tag.create({
      data: { 
        id: `tag-${i + 1}-${Date.now()}`,
        name: sampleTags[i] 
      }
    });
    tags.push(tag);
  }
  
  console.log(`✅ Created ${tags.length} tags`);
  return tags;
}

/**
 * Create sample categories
 */
async function createCategories(): Promise<any[]> {
  console.log(`📁 Creating categories...`);
  const categories = [];
  
  for (let i = 0; i < sampleCategories.length; i++) {
    const category = await prisma.category.create({
      data: { 
        id: `cat-${i + 1}-${Date.now()}`,
        name: sampleCategories[i] 
      }
    });
    categories.push(category);
  }
  
  console.log(`✅ Created ${categories.length} categories`);
  return categories;
}

/**
 * Create sample folders with hierarchy
 */
async function createFolders(users: any[], count: number): Promise<any[]> {
  console.log(`📂 Creating ${count} folders...`);
  const folders = [];
  
  for (let i = 0; i < count; i++) {
    const user = users[i % users.length];
    const folderName = sampleFolderNames[i % sampleFolderNames.length];
    
    // Create root folder
    const folder = await prisma.folder.create({
      data: {
        id: `folder-${i + 1}-${Date.now()}`,
        name: `${folderName} ${Math.floor(i / sampleFolderNames.length) + 1}`,
        userId: user.id,
        sortOrder: i,
        updatedAt: new Date()
      }
    });
    folders.push(folder);
    
    // Create 1-2 subfolders for some folders
    if (i % 3 === 0 && folders.length < count) {
      const subfolder = await prisma.folder.create({
        data: {
          id: `subfolder-${i + 1}-${Date.now()}`,
          name: `${folderName} - Subfolder`,
          userId: user.id,
          parentId: folder.id,
          sortOrder: 0,
          updatedAt: new Date()
        }
      });
      folders.push(subfolder);
    }
  }
  
  console.log(`✅ Created ${folders.length} folders`);
  return folders;
}

/**
 * Create sample notes
 */
async function createNotes(
  users: any[],
  folders: any[],
  tags: any[],
  categories: any[],
  count: number
): Promise<any[]> {
  console.log(`📝 Creating ${count} notes...`);
  const notes = [];
  
  for (let i = 0; i < count; i++) {
    const user = users[i % users.length];
    const folder = folders.length > 0 ? folders[i % folders.length] : null;
    const category = categories[i % categories.length];
    const title = `${sampleNoteTitles[i % sampleNoteTitles.length]} ${Math.floor(i / sampleNoteTitles.length) + 1}`;
    const content = sampleNoteContents[i % sampleNoteContents.length];
    
    // Select 2-4 random tags
    const noteTags: typeof tags = [];
    const tagCount = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < tagCount; j++) {
      const tag = tags[(i + j) % tags.length];
      if (!noteTags.find(t => t.id === tag.id)) {
        noteTags.push(tag);
      }
    }
    
    const note = await prisma.note.create({
      data: {
        id: `note-${i + 1}-${Date.now()}`,
        title,
        content: JSON.stringify(content),
        contentType: 'tiptap-json',
        summary: `Summary of ${title}`,
        userId: user.id,
        ownerId: user.id,
        folderId: folder?.id,
        categoryId: category.id,
        sortOrder: i,
        isPublic: i % 5 === 0, // Make 20% of notes public
        publicSlug: i % 5 === 0 ? `note-${i}` : null,
        updatedAt: new Date(),
        tags: {
          connect: noteTags.map(tag => ({ id: tag.id }))
        }
      }
    });
    notes.push(note);
    
    // Create version history for some notes
    if (i % 4 === 0) {
      await prisma.noteVersion.create({
        data: {
          id: `version-${i + 1}-${Date.now()}`,
          noteId: note.id,
          title: `${title} (v1)`,
          content: JSON.stringify(content),
          userId: user.id
        }
      });
    }
  }
  
  console.log(`✅ Created ${notes.length} notes`);
  return notes;
}

/**
 * Create sample collaborators
 */
async function createCollaborators(users: any[], notes: any[]): Promise<number> {
  console.log(`🤝 Creating collaborators...`);
  let count = 0;
  
  // Add collaborators to some notes
  for (let i = 0; i < notes.length; i++) {
    if (i % 3 === 0 && users.length > 1) {
      const note = notes[i];
      const collaboratorUser = users[(i + 1) % users.length];
      
      // Don't add owner as collaborator
      if (collaboratorUser.id !== note.ownerId) {
        await prisma.collaborator.create({
          data: {
            id: `collab-${i + 1}-${Date.now()}`,
            noteId: note.id,
            userId: collaboratorUser.id,
            role: i % 2 === 0 ? 'editor' : 'viewer'
          }
        });
        count++;
      }
    }
  }
  
  console.log(`✅ Created ${count} collaborators`);
  return count;
}

/**
 * Create sample templates
 */
async function createTemplates(users: any[]): Promise<number> {
  console.log(`📋 Creating templates...`);
  let count = 0;
  
  for (const template of sampleTemplates) {
    const user = users[count % users.length];
    await prisma.noteTemplate.create({
      data: {
        id: `template-${count + 1}-${Date.now()}`,
        name: template.name,
        description: template.description,
        content: template.content,
        userId: user.id,
        usageCount: Math.floor(Math.random() * 10),
        updatedAt: new Date()
      }
    });
    count++;
  }
  
  console.log(`✅ Created ${count} templates`);
  return count;
}

/**
 * Main seed function
 */
async function seedDatabase(options: SeedOptions = {}): Promise<SeedResult> {
  const {
    reset = false,
    userCount = 3,
    noteCount = 20,
    folderCount = 8
  } = options;
  
  console.log('🌱 Starting database seed...');
  console.log(`Options: ${JSON.stringify(options, null, 2)}`);
  
  try {
    // Reset if requested
    if (reset) {
      await resetDatabase();
    }
    
    // Create data
    const users = await createUsers(userCount);
    const tags = await createTags();
    const categories = await createCategories();
    const folders = await createFolders(users, folderCount);
    const notes = await createNotes(users, folders, tags, categories, noteCount);
    const collaboratorCount = await createCollaborators(users, notes);
    const templateCount = await createTemplates(users);
    
    const result: SeedResult = {
      users: users.length,
      folders: folders.length,
      notes: notes.length,
      tags: tags.length,
      categories: categories.length,
      collaborators: collaboratorCount,
      templates: templateCount
    };
    
    console.log('\n✨ Seed completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Users: ${result.users}`);
    console.log(`   Folders: ${result.folders}`);
    console.log(`   Notes: ${result.notes}`);
    console.log(`   Tags: ${result.tags}`);
    console.log(`   Categories: ${result.categories}`);
    console.log(`   Collaborators: ${result.collaborators}`);
    console.log(`   Templates: ${result.templates}`);
    console.log('\n🔐 Test credentials:');
    console.log(`   Email: user1@example.com`);
    console.log(`   Password: password123`);
    
    return result;
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: SeedOptions = {
    reset: args.includes('--reset'),
    userCount: parseInt(args.find(arg => arg.startsWith('--users='))?.split('=')[1] || '3'),
    noteCount: parseInt(args.find(arg => arg.startsWith('--notes='))?.split('=')[1] || '20'),
    folderCount: parseInt(args.find(arg => arg.startsWith('--folders='))?.split('=')[1] || '8')
  };
  
  seedDatabase(options)
    .then(() => {
      console.log('✅ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}

export { seedDatabase, resetDatabase, type SeedOptions, type SeedResult };
