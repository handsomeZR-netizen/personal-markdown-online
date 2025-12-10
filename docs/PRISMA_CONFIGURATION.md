# Prisma Configuration Guide

This guide explains how the Prisma configuration works with both local PostgreSQL and Supabase databases.

## Overview

The application uses a single Prisma schema (`prisma/schema.prisma`) that dynamically adapts to either local or Supabase mode based on environment variables. This approach provides:

- **Single source of truth**: One schema file for all environments
- **Dynamic configuration**: Automatically adapts based on `DATABASE_MODE`
- **Migration compatibility**: Migrations work seamlessly in both modes
- **Easy switching**: Change modes by updating environment variables

## Schema Configuration

### Datasource Configuration

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Key Points:**
- `provider`: Always set to `"postgresql"` (compatible with both local and Supabase)
- `url`: Main connection string from `DATABASE_URL` environment variable
- `directUrl`: Direct connection for migrations from `DIRECT_URL` environment variable

### Environment Variables

#### Local Mode

```env
DATABASE_MODE=local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/noteapp
```

#### Supabase Mode

```env
DATABASE_MODE=supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

**Important Differences:**
- **Local**: Uses port 5432 for both connections
- **Supabase**: Uses port 6543 (pooled) for `DATABASE_URL` and port 5432 (direct) for `DIRECT_URL`

## Database Scripts

### Migration Scripts

#### `npm run db:migrate`
Runs database migrations with automatic environment validation.

```bash
# Run migrations (interactive)
npm run db:migrate

# Create a new migration
npm run db:migrate -- --name add_user_avatar

# Create migration without applying
npm run db:migrate:create -- --name add_new_feature
```

**Features:**
- Validates environment configuration before running
- Shows warnings for missing optional variables
- Displays mode-specific information after completion
- Works in both local and Supabase modes

#### `npm run db:push`
Pushes schema changes directly to the database without creating migrations.

```bash
# Push schema (with confirmation)
npm run db:push

# Push schema accepting data loss
npm run db:push -- --accept-data-loss

# Push and skip client generation
npm run db:push -- --skip-generate
```

**Use Cases:**
- Rapid prototyping
- Development environments
- When you don't need migration history

**Warning:** Can be destructive. Not recommended for production.

#### `npm run db:reset`
Resets the database by dropping all tables and re-running migrations.

```bash
# Reset database (with confirmation)
npm run db:reset

# Reset without seeding
npm run db:reset -- --skip-seed

# Force reset without confirmation
npm run db:reset:force
```

**Features:**
- Prompts for confirmation (unless `--force` is used)
- Automatically runs seed script after reset
- Shows clear warnings about data loss

### Other Database Scripts

#### `npm run db:generate`
Generates Prisma Client based on the schema.

```bash
npm run db:generate
```

#### `npm run db:studio`
Opens Prisma Studio for visual database management.

```bash
npm run db:studio
```

#### `npm run db:seed`
Seeds the database with sample data.

```bash
# Seed database
npm run db:seed

# Reset and seed
npm run db:seed:reset
```

#### `npm run db:validate`
Validates database connection and configuration.

```bash
npm run db:validate
```

## Migration Workflow

### Creating a New Migration

1. **Update the schema** in `prisma/schema.prisma`
2. **Create the migration**:
   ```bash
   npm run db:migrate -- --name descriptive_name
   ```
3. **Review the generated SQL** in `prisma/migrations/`
4. **Test the migration** in your local environment
5. **Commit the migration** to version control

### Applying Migrations

#### Local Development
```bash
# Ensure local database is running
docker-compose up -d

# Run migrations
npm run db:migrate
```

#### Supabase Production
```bash
# Set environment to Supabase mode
export DATABASE_MODE=supabase

# Run migrations
npm run db:migrate
```

### Migration Best Practices

1. **Always test locally first**: Run migrations in local mode before applying to Supabase
2. **Use descriptive names**: Name migrations clearly (e.g., `add_user_avatar_field`)
3. **Review generated SQL**: Check the migration SQL before applying
4. **Backup production data**: Always backup before running migrations in production
5. **Use transactions**: Prisma migrations are transactional by default

## Switching Between Modes

### From Local to Supabase

1. **Export data** (if needed):
   ```bash
   # TODO: Add data export script
   ```

2. **Update environment variables**:
   ```env
   DATABASE_MODE=supabase
   DATABASE_URL=<supabase-connection-string>
   DIRECT_URL=<supabase-direct-connection>
   ```

3. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Import data** (if needed):
   ```bash
   # TODO: Add data import script
   ```

### From Supabase to Local

1. **Export data** (if needed)

2. **Start local database**:
   ```bash
   docker-compose up -d
   ```

3. **Update environment variables**:
   ```env
   DATABASE_MODE=local
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp
   DIRECT_URL=postgresql://postgres:postgres@localhost:5432/noteapp
   ```

4. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

5. **Import data** (if needed)

## Troubleshooting

### Migration Fails

**Problem**: Migration fails with connection error

**Solution**:
1. Check database is running (local) or accessible (Supabase)
2. Verify environment variables are correct
3. Run `npm run db:validate` to check configuration
4. Check database logs for specific errors

### Schema Out of Sync

**Problem**: Schema doesn't match database

**Solution**:
```bash
# Option 1: Push schema (development only)
npm run db:push -- --accept-data-loss

# Option 2: Reset and re-migrate
npm run db:reset
```

### Migration Conflicts

**Problem**: Multiple developers created migrations

**Solution**:
1. Pull latest changes from version control
2. Resolve migration conflicts manually
3. Create a new migration if needed
4. Test thoroughly before pushing

### Connection Pooling Issues (Supabase)

**Problem**: "Too many connections" error

**Solution**:
- Ensure `DATABASE_URL` uses port 6543 (pooled connection)
- Use `DIRECT_URL` with port 5432 only for migrations
- Check Supabase connection limits in dashboard

## Advanced Topics

### Custom Migration SQL

You can create custom migrations with specific SQL:

```bash
# Create empty migration
npm run db:migrate:create -- --name custom_indexes

# Edit the generated SQL file
# Add your custom SQL

# Apply the migration
npm run db:migrate
```

### Prisma Studio with Different Modes

```bash
# Local mode
DATABASE_MODE=local npm run db:studio

# Supabase mode
DATABASE_MODE=supabase npm run db:studio
```

### Checking Migration Status

```bash
# View migration status
npx prisma migrate status
```

## Related Documentation

- [Local Database Setup](./LOCAL_DATABASE_SETUP.md)
- [Database Modes](./DATABASE_MODES.md)
- [Database Validation](./DATABASE_VALIDATION.md)
- [Prisma Documentation](https://www.prisma.io/docs)

## Summary

The Prisma configuration is designed to be flexible and work seamlessly with both local PostgreSQL and Supabase. Key takeaways:

- ✅ Single schema file for all environments
- ✅ Dynamic configuration via environment variables
- ✅ Migration scripts that validate configuration
- ✅ Easy mode switching
- ✅ Compatible with both local and cloud databases

For questions or issues, refer to the troubleshooting section or check the related documentation.
