# Public Sharing Property-Based Tests

## Overview

This directory contains property-based tests for the public sharing functionality using `fast-check`.

## Test File

- `public-link-uniqueness.property.test.ts` - Tests for Property 10: Public Link Uniqueness

## Running the Tests

### Prerequisites

The tests require a database connection. Ensure you have the following environment variables set:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DIRECT_URL=postgresql://user:password@localhost:5432/dbname
```

### Run Tests

```bash
# Run all sharing tests
npm test -- src/lib/sharing/__tests__/public-link-uniqueness.property.test.ts --run

# Run with environment variables from .env.local
# (Windows PowerShell)
$env:DATABASE_URL="your-database-url"; npm test -- src/lib/sharing/__tests__/public-link-uniqueness.property.test.ts --run
```

## Test Coverage

### Property 10: Public Link Uniqueness

**Validates Requirements**: 10.1, 10.4

**Property Statement**: For any note with public sharing enabled, the generated public slug should be globally unique and remain stable until sharing is disabled.

**Test Cases**:

1. **Unique Slug Generation**
   - Generates 3-10 notes and enables public sharing
   - Verifies all slugs are unique (no collisions)
   - Verifies all slugs are non-empty strings
   - Verifies all notes have `isPublic = true`

2. **Slug Stability**
   - Enables public sharing for a note
   - Verifies slug remains stable across multiple reads
   - Disables public sharing
   - Verifies slug is set to null
   - Re-enables public sharing
   - Verifies a new slug is generated

3. **Database-Level Uniqueness**
   - Creates two notes
   - Enables public sharing for first note
   - Attempts to manually set the same slug for second note
   - Verifies database rejects duplicate slugs (unique constraint)

4. **Sufficient Entropy**
   - Generates 10-50 slugs
   - Verifies no collisions occur
   - Verifies slugs are 10 characters long
   - Verifies slugs contain only alphanumeric characters and URL-safe chars
   - Verifies slugs don't require URL encoding

5. **Slug Lookup**
   - Enables public sharing for a note
   - Verifies note can be found by public slug
   - Verifies note cannot be found with wrong slug

## Test Configuration

- **Iterations per test**: 20 (10 for entropy test due to higher note count)
- **Slug length**: 10 characters
- **Slug format**: Alphanumeric + URL-safe characters (using nanoid)
- **Entropy**: ~60 bits (10 characters from nanoid's alphabet)

## Expected Behavior

All tests should pass when:
- Database connection is properly configured
- Prisma schema is up to date
- Database has the required tables and indexes
- `publicSlug` field has a unique constraint

## Troubleshooting

### "Environment variable not found: DATABASE_URL"

**Solution**: Set the DATABASE_URL environment variable before running tests.

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
npm test -- src/lib/sharing/__tests__/public-link-uniqueness.property.test.ts --run

# Or use .env.local file
# Create .env.local with DATABASE_URL and run:
npm test -- src/lib/sharing/__tests__/public-link-uniqueness.property.test.ts --run
```

### "Unique constraint violation"

**Solution**: This is expected behavior for test case 3 (Database-Level Uniqueness). The test verifies that the database properly rejects duplicate slugs.

### Tests are slow

**Solution**: Property-based tests run multiple iterations (20 per test). This is normal. You can reduce iterations by modifying the `numRuns` parameter in the test file, but this will reduce test coverage.

## Implementation Details

The tests use the same slug generation logic as the production code:

```typescript
import { nanoid } from 'nanoid';

let publicSlug = nanoid(10); // 10 character random string
```

This ensures:
- Cryptographically random slugs
- URL-safe characters only
- ~60 bits of entropy (extremely low collision probability)
- No sequential or predictable patterns

## Related Files

- `/api/notes/[id]/share/route.ts` - API endpoint that uses this logic
- `/public/[slug]/page.tsx` - Public viewing page that looks up notes by slug
- `prisma/schema.prisma` - Database schema with unique constraint on publicSlug
