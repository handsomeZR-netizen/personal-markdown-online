# Data Migration Guide

This guide explains how to export and import data between local and Supabase databases using the migration tools.

## Overview

The data migration tools allow you to:
- Export all data from your current database to a JSON file
- Import data from a JSON file into another database
- Migrate data between local PostgreSQL and Supabase
- Backup and restore your database

## Export Data

### Basic Export

Export all data from the current database:

```bash
npm run db:export
```

This creates a file named `data-export-{timestamp}.json` in your project root.

### Export Options

#### Specify Output File

```bash
npm run db:export -- --output my-backup.json
```

#### Pretty Print JSON

Make the JSON file human-readable:

```bash
npm run db:export -- --pretty
```

#### Validate Before Export

Check data integrity before exporting:

```bash
npm run db:export -- --validate
```

#### Selective Export

Export only specific data types:

```bash
# Export only users and notes
npm run db:export -- --include users,notes

# Export everything except templates
npm run db:export -- --exclude templates
```

Available data types:
- `users` - User accounts
- `notes` - Notes and their content
- `folders` - Folder hierarchy
- `tags` - Tags
- `categories` - Categories
- `collaborators` - Note collaborators
- `versions` - Note version history
- `templates` - Note templates
- `preferences` - User preferences

### Complete Export Example

```bash
npm run db:export -- --output backup-2024-12-09.json --pretty --validate
```

## Import Data

### Basic Import

Import data from a JSON file:

```bash
npm run db:import -- --input data-export.json
```

### Import Modes

#### Merge Mode (Default)

Add new records, skip existing ones:

```bash
npm run db:import -- --input backup.json --mode merge
```

#### Replace Mode

Delete all existing data and import:

```bash
npm run db:import -- --input backup.json --mode replace
```

⚠️ **Warning**: This will delete all existing data!

#### Skip Mode

Only import records that don't already exist:

```bash
npm run db:import -- --input backup.json --mode skip
```

### Import Options

#### Validate Before Import

Check data integrity before importing:

```bash
npm run db:import -- --input backup.json --validate
```

#### Dry Run

See what would be imported without making changes:

```bash
npm run db:import -- --input backup.json --dry-run
```

#### Selective Import

Import only specific data types:

```bash
# Import only users and notes
npm run db:import -- --input backup.json --include users,notes

# Import everything except templates
npm run db:import -- --input backup.json --exclude templates
```

### Complete Import Example

```bash
npm run db:import -- --input backup.json --mode merge --validate --dry-run
```

## Migration Scenarios

### Scenario 1: Migrate from Local to Supabase

1. **Export from local database**:
   ```bash
   # Make sure DATABASE_MODE=local in .env.local
   npm run db:export -- --output local-backup.json --pretty --validate
   ```

2. **Switch to Supabase mode**:
   ```bash
   # Update .env.local to set DATABASE_MODE=supabase
   # Add Supabase credentials
   ```

3. **Import to Supabase**:
   ```bash
   npm run db:import -- --input local-backup.json --mode replace --validate
   ```

### Scenario 2: Migrate from Supabase to Local

1. **Export from Supabase**:
   ```bash
   # Make sure DATABASE_MODE=supabase in .env.local
   npm run db:export -- --output supabase-backup.json --pretty --validate
   ```

2. **Switch to local mode**:
   ```bash
   # Update .env.local to set DATABASE_MODE=local
   # Start local PostgreSQL: docker-compose up -d
   # Run migrations: npm run db:migrate
   ```

3. **Import to local database**:
   ```bash
   npm run db:import -- --input supabase-backup.json --mode replace --validate
   ```

### Scenario 3: Backup and Restore

**Create a backup**:
```bash
npm run db:export -- --output backup-$(date +%Y%m%d).json --pretty --validate
```

**Restore from backup**:
```bash
npm run db:import -- --input backup-20241209.json --mode replace --validate
```

### Scenario 4: Merge Data from Multiple Sources

1. **Export from first source**:
   ```bash
   npm run db:export -- --output source1.json
   ```

2. **Export from second source**:
   ```bash
   # Switch database configuration
   npm run db:export -- --output source2.json
   ```

3. **Import both with merge mode**:
   ```bash
   npm run db:import -- --input source1.json --mode merge
   npm run db:import -- --input source2.json --mode merge
   ```

## Data Validation

Both export and import scripts include data validation to ensure integrity:

### Export Validation

Checks for:
- Orphaned notes (notes without valid users)
- Orphaned folders (folders without valid users)
- Circular folder references
- Invalid collaborator references
- Duplicate public slugs

### Import Validation

Checks for:
- Missing user references in notes and folders
- Circular folder references
- Invalid collaborator references
- Duplicate emails

## Troubleshooting

### Export Fails with Validation Errors

If validation fails during export:

1. **Review the errors**: The script will list specific issues
2. **Fix the data**: Manually correct the issues in your database
3. **Export without validation**: Use `--validate` flag to skip validation (not recommended)

```bash
# Export without validation (use with caution)
npm run db:export -- --output backup.json
```

### Import Fails with Validation Errors

If validation fails during import:

1. **Check the export file**: Ensure the JSON file is valid
2. **Review the errors**: The script will list specific issues
3. **Fix the data**: Edit the JSON file to correct issues
4. **Import without validation**: Skip validation if you're confident (not recommended)

```bash
# Import without validation (use with caution)
npm run db:import -- --input backup.json
```

### Database Connection Errors

If you get connection errors:

1. **Check database mode**: Ensure `DATABASE_MODE` is set correctly in `.env.local`
2. **Verify credentials**: Check that database credentials are correct
3. **Test connection**: Run `npm run db:test` to verify connection

### Large Export Files

For large databases:

1. **Use selective export**: Export only what you need
2. **Don't use pretty print**: Omit `--pretty` flag to reduce file size
3. **Compress the file**: Use gzip or zip to compress the JSON file

```bash
# Export without pretty print
npm run db:export -- --output large-backup.json

# Compress the file (PowerShell)
Compress-Archive -Path large-backup.json -DestinationPath large-backup.zip
```

## Best Practices

1. **Always validate**: Use `--validate` flag for both export and import
2. **Use dry run**: Test imports with `--dry-run` before actual import
3. **Backup before replace**: Always create a backup before using `--mode replace`
4. **Version your backups**: Include dates in backup filenames
5. **Test migrations**: Test the migration process in a development environment first
6. **Keep backups**: Store backups in a safe location (not just in the project directory)

## Export File Format

The export file is a JSON file with the following structure:

```json
{
  "metadata": {
    "exportDate": "2024-12-09T12:00:00.000Z",
    "databaseMode": "local",
    "version": "1.0.0",
    "recordCounts": {
      "users": 10,
      "notes": 100,
      "folders": 20,
      ...
    }
  },
  "users": [...],
  "folders": [...],
  "notes": [...],
  "tags": [...],
  "categories": [...],
  "collaborators": [...],
  "noteVersions": [...],
  "noteTemplates": [...],
  "userPreferences": [...]
}
```

## Security Considerations

⚠️ **Important**: Export files contain sensitive data including:
- User passwords (hashed)
- Email addresses
- Note content
- Personal information

**Security recommendations**:
1. **Never commit export files to version control**
2. **Encrypt export files** if storing them long-term
3. **Use secure transfer methods** when moving files between systems
4. **Delete export files** after successful migration
5. **Restrict file permissions** on export files

## Related Documentation

- [Local Database Setup](./LOCAL_DATABASE_SETUP.md)
- [Database Modes](./DATABASE_MODES.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
