# Database Seeding Guide

This guide explains how to use the database seeding functionality to populate your local database with test data.

## Overview

The seed script (`prisma/seed.ts`) provides a comprehensive way to populate your database with realistic test data including:

- **Users**: Sample user accounts with authentication
- **Folders**: Hierarchical folder structure
- **Notes**: Rich-text notes with TipTap JSON content
- **Tags**: Categorization tags
- **Categories**: Note categories
- **Collaborators**: Shared note permissions
- **Templates**: Reusable note templates
- **Version History**: Note version tracking

## Quick Start

### Basic Seeding

```bash
# Seed with default values (3 users, 20 notes, 8 folders)
npm run db:seed
```

### Reset and Seed

```bash
# Clear all data and seed fresh
npm run db:seed:reset
```

### Custom Seeding

```bash
# Seed with custom counts
npx tsx prisma/seed.ts --users=5 --notes=50 --folders=15

# Reset and seed with custom counts
npx tsx prisma/seed.ts --reset --users=10 --notes=100 --folders=20
```

## Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--reset` | Clear all existing data before seeding | `false` |
| `--users=N` | Number of users to create | `3` |
| `--notes=N` | Number of notes to create | `20` |
| `--folders=N` | Number of folders to create | `8` |

## Test Credentials

After seeding, you can log in with any of these accounts:

- **Email**: `user1@example.com`, `user2@example.com`, `user3@example.com`, etc.
- **Password**: `password123`

## What Gets Created

### Users
- Each user has a unique email, name, avatar, and color
- All users have the same password for easy testing: `password123`
- User preferences are automatically created
- Avatar URLs use DiceBear API for consistent avatars

### Folders
- Hierarchical folder structure with parent-child relationships
- Distributed across users
- Some folders have subfolders for testing nested navigation
- Includes folders like "Work Projects", "Personal Notes", "Meeting Notes", etc.

### Notes
- Rich-text content in TipTap JSON format
- Assigned to folders and categories
- Tagged with 2-4 relevant tags
- 20% of notes are public with shareable slugs
- Some notes have version history
- Includes realistic content like project plans, meeting notes, etc.

### Tags
- 10 common tags: work, personal, ideas, todo, important, project, meeting, research, draft, review
- Automatically connected to notes

### Categories
- 5 categories: Work, Personal, Projects, Ideas, Notes
- Each note is assigned to a category

### Collaborators
- Some notes have collaborators with editor or viewer roles
- Demonstrates the sharing functionality
- Collaborators are different from note owners

### Templates
- 2 reusable templates: "Meeting Notes" and "Project Plan"
- Include structured TipTap JSON content
- Track usage count

## Seed Output

The seed script provides detailed progress output:

```
🌱 Starting database seed...
Options: {
  "reset": false,
  "userCount": 3,
  "noteCount": 20,
  "folderCount": 8
}
👥 Creating 3 users...
✅ Created 3 users
🏷️  Creating tags...
✅ Created 10 tags
📁 Creating categories...
✅ Created 5 categories
📂 Creating 8 folders...
✅ Created 10 folders
📝 Creating 20 notes...
✅ Created 20 notes
🤝 Creating collaborators...
✅ Created 6 collaborators
📋 Creating templates...
✅ Created 2 templates

✨ Seed completed successfully!
📊 Summary:
   Users: 3
   Folders: 10
   Notes: 20
   Tags: 10
   Categories: 5
   Collaborators: 6
   Templates: 2

🔐 Test credentials:
   Email: user1@example.com
   Password: password123
```

## Use Cases

### Development Testing
```bash
# Quick seed for daily development
npm run db:seed
```

### Feature Testing
```bash
# Create more data to test pagination, search, etc.
npx tsx prisma/seed.ts --users=10 --notes=100 --folders=30
```

### Demo Preparation
```bash
# Reset and create clean demo data
npm run db:seed:reset
```

### Performance Testing
```bash
# Create large dataset for performance testing
npx tsx prisma/seed.ts --reset --users=50 --notes=1000 --folders=100
```

## Integration with Prisma

The seed script is configured in `package.json` to run automatically after migrations:

```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

This means you can also run:

```bash
# Run migrations and seed
npx prisma migrate dev

# Reset database and seed
npx prisma migrate reset
```

## Troubleshooting

### Database Connection Error

If you see connection errors:

1. Make sure your database is running:
   ```bash
   docker-compose up -d
   ```

2. Check your `.env` file has the correct `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp
   ```

3. Verify the database is healthy:
   ```bash
   npm run db:health
   ```

### Foreign Key Constraint Errors

If you see foreign key errors during reset:

1. The script handles deletion order automatically
2. If issues persist, manually reset:
   ```bash
   npx prisma migrate reset
   ```

### Out of Memory

If seeding large datasets causes memory issues:

1. Reduce the counts:
   ```bash
   npx tsx prisma/seed.ts --users=5 --notes=50
   ```

2. Seed in batches by running multiple times without `--reset`

## Programmatic Usage

You can also import and use the seed functions in your own scripts:

```typescript
import { seedDatabase, resetDatabase } from './prisma/seed';

// Seed with custom options
await seedDatabase({
  reset: true,
  userCount: 5,
  noteCount: 30,
  folderCount: 10
});

// Just reset
await resetDatabase();
```

## Data Characteristics

### Realistic Content
- Notes contain structured TipTap JSON with headings, lists, and paragraphs
- Folder names reflect common organizational patterns
- Tags are relevant to typical note-taking scenarios

### Relationships
- Notes are distributed across users and folders
- Collaborators demonstrate sharing functionality
- Version history shows change tracking
- Public notes demonstrate public sharing

### Variety
- Mix of public and private notes
- Different collaboration roles (editor/viewer)
- Nested folder structures
- Multiple tags per note

## Best Practices

1. **Always use `--reset` for clean state**: When preparing demos or testing from scratch
2. **Use default counts for quick testing**: The defaults provide good coverage without being overwhelming
3. **Increase counts for stress testing**: Test pagination, search, and performance with larger datasets
4. **Check credentials**: Remember all users have password `password123`
5. **Verify seed success**: Check the summary output to ensure all data was created

## Related Commands

```bash
# View database in Prisma Studio
npm run db:studio

# Check database health
npm run db:health

# Run migrations
npm run db:migrate

# Validate database
npm run db:validate
```

## Next Steps

After seeding:

1. Start the development server: `npm run dev`
2. Log in with test credentials
3. Explore the seeded data
4. Test features with realistic data
5. Reset and re-seed as needed

## Support

For issues or questions:
- Check the main README.md
- Review the database setup guide: `docs/LOCAL_DATABASE_SETUP.md`
- Check database modes: `docs/DATABASE_MODES.md`
