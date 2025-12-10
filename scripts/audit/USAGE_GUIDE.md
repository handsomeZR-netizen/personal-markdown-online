# Audit System Usage Guide

## Overview

The Comprehensive Feature Audit system is a powerful tool for systematically validating all features, components, and functionality of the note-taking application. It combines automated testing, code analysis, and reporting to provide a complete picture of the application's health.

## Quick Start

### Running a Full Audit

```bash
npm run audit
```

This command runs the complete audit suite including:
- All automated tests (unit, integration, property-based)
- Component analysis
- Page validation
- Performance checks
- Accessibility validation
- Security checks

### Running Specific Audit Categories

```bash
# Run only component analysis
npm run audit:components

# Run only performance tests
npm run audit:performance

# Run only accessibility tests
npm run audit:a11y

# Generate report from existing results
npm run audit:report
```

## Audit Categories

### 1. Core Features Audit
Tests fundamental note management functionality:
- Note CRUD operations
- Markdown editor functionality
- Real-time preview
- Auto-save capabilities

**Command:**
```bash
tsx scripts/audit/index.ts --category core-features
```

### 2. Organization & Classification
Tests folder hierarchy, tags, and categories:
- Folder creation and nesting
- Note movement between folders
- Tag management
- Category filtering
- Breadcrumb navigation

**Command:**
```bash
tsx scripts/audit/index.ts --category organization
```

### 3. Search & Filtering
Tests search functionality and filter combinations:
- Keyword search
- Advanced search
- Tag filtering
- Combined filters
- Search performance (< 2s requirement)

**Command:**
```bash
tsx scripts/audit/index.ts --category search
```

### 4. Collaboration Features
Tests real-time collaboration (Supabase mode):
- Real-time editing
- Presence indicators
- Cursor sharing
- Permission management
- Public sharing links

**Command:**
```bash
tsx scripts/audit/index.ts --category collaboration
```

### 5. Offline & Sync
Tests offline capabilities and synchronization:
- Offline note creation
- Offline editing
- Auto-sync on reconnection
- Conflict detection
- Draft recovery

**Command:**
```bash
tsx scripts/audit/index.ts --category offline
```

### 6. AI Features
Tests AI-powered enhancements:
- Auto-summary generation
- Tag suggestions
- AI formatting
- Q&A interface
- API configuration

**Command:**
```bash
tsx scripts/audit/index.ts --category ai
```

### 7. Mobile Experience
Tests mobile-specific functionality:
- Responsive layout
- Touch gestures
- Bottom navigation
- Keyboard adaptation
- PWA installation

**Command:**
```bash
tsx scripts/audit/index.ts --category mobile
```

### 8. Export Functionality
Tests export capabilities:
- Markdown export
- PDF generation
- HTML export
- Image handling
- Batch export

**Command:**
```bash
tsx scripts/audit/index.ts --category export
```

### 9. Media Management
Tests image and media handling:
- Paste upload
- Drag-and-drop upload
- Lightbox preview
- Storage management
- Cleanup on deletion

**Command:**
```bash
tsx scripts/audit/index.ts --category media
```

### 10. Settings & Configuration
Tests settings pages and options:
- Settings accessibility
- Theme switching
- Webhook configuration
- Storage management
- Offline preferences

**Command:**
```bash
tsx scripts/audit/index.ts --category settings
```

### 11. Template System
Tests note template functionality:
- Template listing
- Create from template
- Custom template creation
- Template editing
- Template deletion

**Command:**
```bash
tsx scripts/audit/index.ts --category templates
```

### 12. Version History
Tests version control features:
- Auto-versioning
- Version history viewing
- Version comparison
- Version restoration
- Version metadata

**Command:**
```bash
tsx scripts/audit/index.ts --category versions
```

### 13. Performance
Tests performance metrics:
- Server startup time (< 5s)
- Page navigation speed (< 1s)
- Loading animations
- Search response time (< 2s)
- Upload progress indicators

**Command:**
```bash
tsx scripts/audit/index.ts --category performance
```

### 14. Accessibility
Tests WCAG 2.1 AA compliance:
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus indicators
- Keyboard shortcuts

**Command:**
```bash
tsx scripts/audit/index.ts --category accessibility
```

### 15. Database Modes
Tests dual-mode database support:
- Local PostgreSQL connection
- Supabase connection
- Mode switching
- Data migration tools
- Startup validation

**Command:**
```bash
tsx scripts/audit/index.ts --category database
```

### 16. Error Handling
Tests error handling and recovery:
- Network errors
- Database errors
- Upload failures
- Permission errors
- Error boundaries

**Command:**
```bash
tsx scripts/audit/index.ts --category errors
```

### 17. Component Integration
Analyzes component usage and integration:
- Component inventory
- Usage detection
- Unused component identification
- Dependency graph generation
- Documentation status

**Command:**
```bash
tsx scripts/audit/index.ts --category components
```

### 18. Page Validation
Validates page existence and functionality:
- Route scanning
- Page accessibility
- Feature cards
- Help pages
- Settings pages

**Command:**
```bash
tsx scripts/audit/index.ts --category pages
```

### 19. Internationalization
Tests i18n support:
- Translation completeness
- Language switching
- Date formatting
- Number formatting
- RTL support

**Command:**
```bash
tsx scripts/audit/index.ts --category i18n
```

### 20. Security
Tests security measures:
- Authentication requirements
- Authorization checks
- API key security
- Input validation
- HTTPS enforcement

**Command:**
```bash
tsx scripts/audit/index.ts --category security
```

## Command-Line Options

### Basic Options

```bash
# Run full audit
tsx scripts/audit/index.ts

# Run specific category
tsx scripts/audit/index.ts --category <category-name>

# Run multiple categories
tsx scripts/audit/index.ts --category core-features,search,performance

# Generate report only (from cached results)
tsx scripts/audit/index.ts --report-only

# Specify output directory
tsx scripts/audit/index.ts --output ./custom-reports

# Specify report format
tsx scripts/audit/index.ts --format html,json,console
```

### Advanced Options

```bash
# Run with custom configuration
tsx scripts/audit/index.ts --config ./custom-audit.config.ts

# Run in CI mode (no interactive prompts)
tsx scripts/audit/index.ts --ci

# Run with verbose logging
tsx scripts/audit/index.ts --verbose

# Run with specific test pattern
tsx scripts/audit/index.ts --pattern "*.property.test.ts"

# Skip specific tests
tsx scripts/audit/index.ts --skip "slow-tests"

# Set custom timeout
tsx scripts/audit/index.ts --timeout 60000

# Run in parallel
tsx scripts/audit/index.ts --parallel

# Run in specific database mode
tsx scripts/audit/index.ts --db-mode local
tsx scripts/audit/index.ts --db-mode supabase
```

## Understanding Audit Reports

### Report Formats

The audit system generates reports in three formats:

#### 1. HTML Report (Interactive)

Located at: `audit-reports/audit-report-[timestamp].html`

Features:
- Interactive dashboard with charts
- Expandable sections for each category
- Filterable issue list
- Sortable tables
- Screenshots and visual evidence
- Downloadable raw data

**Opening the report:**
```bash
# Windows
start audit-reports/audit-report-latest.html

# macOS
open audit-reports/audit-report-latest.html

# Linux
xdg-open audit-reports/audit-report-latest.html
```

#### 2. JSON Report (Machine-Readable)

Located at: `audit-reports/audit-report-[timestamp].json`

Structure:
```json
{
  "id": "audit-20231209-123456",
  "timestamp": "2023-12-09T12:34:56.789Z",
  "version": "1.0.0",
  "summary": {
    "totalTests": 150,
    "passedTests": 142,
    "failedTests": 8,
    "warningCount": 15,
    "overallScore": 94.7,
    "criticalIssues": 2
  },
  "categories": [...],
  "recommendations": [...],
  "metadata": {...}
}
```

**Using the JSON report:**
```bash
# Parse with jq
cat audit-reports/audit-report-latest.json | jq '.summary'

# Extract failed tests
cat audit-reports/audit-report-latest.json | jq '.categories[].tests[] | select(.passed == false)'

# Get critical issues
cat audit-reports/audit-report-latest.json | jq '.categories[].issues[] | select(.severity == "critical")'
```

#### 3. Console Report (Quick Overview)

Displayed in terminal during execution.

Features:
- Color-coded status indicators
- Progress bars
- Summary statistics
- Quick issue overview
- Execution time

### Report Sections

#### Executive Summary
- Overall score (0-100)
- Total tests run
- Pass/fail/warning counts
- Critical issue count
- Execution time

#### Category Scores
Visual representation of each audit category:
- ✅ Passed (90-100%)
- ⚠️ Warning (70-89%)
- ❌ Failed (< 70%)

#### Detailed Results
For each category:
- Test results with pass/fail status
- Execution time per test
- Error messages and stack traces
- Screenshots (for UI tests)
- Performance metrics

#### Issues List
All identified issues sorted by severity:
- **Critical**: Must fix immediately
- **High**: Should fix soon
- **Medium**: Should address
- **Low**: Nice to fix

Each issue includes:
- Title and description
- Location (file/line)
- Suggested fix
- Related requirements

#### Recommendations
Prioritized improvement suggestions:
- Priority (high/medium/low)
- Effort estimate (small/medium/large)
- Impact assessment (high/medium/low)
- Implementation guidance

#### Component Inventory
- Total components count
- Used vs unused components
- Missing components
- Dependency graph
- Documentation status

#### Coverage Report
- Test coverage by category
- Code coverage metrics
- Untested areas
- Coverage trends

## Interpreting Results

### Overall Score

The overall score is calculated as a weighted average:

```
Overall Score = (
  Core Features × 0.20 +
  Organization × 0.10 +
  Search × 0.10 +
  Collaboration × 0.08 +
  Offline × 0.08 +
  AI Features × 0.05 +
  Mobile × 0.08 +
  Export × 0.05 +
  Media × 0.05 +
  Settings × 0.03 +
  Templates × 0.03 +
  Versions × 0.03 +
  Performance × 0.15 +
  Accessibility × 0.10 +
  Database × 0.05 +
  Errors × 0.05 +
  Components × 0.05 +
  Pages × 0.03 +
  I18n × 0.03 +
  Security × 0.10
) × 100
```

### Score Interpretation

- **90-100**: Excellent - Production ready
- **80-89**: Good - Minor improvements needed
- **70-79**: Fair - Several issues to address
- **60-69**: Poor - Significant work required
- **< 60**: Critical - Major issues present

### Issue Severity

**Critical Issues** (🔴)
- Security vulnerabilities
- Data loss risks
- Complete feature failures
- Accessibility blockers
- Performance degradation > 50%

**High Priority** (🟠)
- Partial feature failures
- Significant UX issues
- Performance issues 25-50%
- Important accessibility issues
- Error handling gaps

**Medium Priority** (🟡)
- Minor feature issues
- Moderate UX improvements
- Performance issues 10-25%
- Documentation gaps
- Code quality issues

**Low Priority** (🟢)
- Nice-to-have improvements
- Minor UX enhancements
- Performance optimizations < 10%
- Code style issues
- Minor documentation updates

## Best Practices

### Running Audits

1. **Run regularly**: Schedule weekly audits in CI/CD
2. **Before releases**: Always run full audit before deploying
3. **After major changes**: Run relevant category audits
4. **Track trends**: Compare reports over time
5. **Fix critical issues first**: Prioritize by severity

### Interpreting Results

1. **Don't panic**: Some failures are expected during development
2. **Focus on trends**: Improving scores matter more than absolute values
3. **Context matters**: Consider project phase and priorities
4. **Validate manually**: Automated tests can have false positives
5. **Document exceptions**: Some "failures" may be intentional

### Improving Scores

1. **Start with critical issues**: Fix security and data loss risks first
2. **Address patterns**: If multiple tests fail similarly, fix the root cause
3. **Improve coverage**: Add tests for untested areas
4. **Document components**: Add usage examples and docs
5. **Optimize performance**: Focus on user-facing operations
6. **Enhance accessibility**: Ensure keyboard navigation and ARIA labels

## Troubleshooting

### Common Issues

#### Tests Timing Out

```bash
# Increase timeout
tsx scripts/audit/index.ts --timeout 60000
```

#### Database Connection Errors

```bash
# Check database mode
echo $DATABASE_MODE

# Validate database connection
npm run db:health

# Run startup validation
npm run startup:validate
```

#### Missing Dependencies

```bash
# Reinstall dependencies
npm ci

# Check for peer dependency issues
npm ls
```

#### Report Generation Fails

```bash
# Check output directory permissions
ls -la audit-reports/

# Generate report only
tsx scripts/audit/index.ts --report-only

# Use alternative format
tsx scripts/audit/index.ts --format json
```

### Getting Help

1. Check the [README](./README.md) for setup instructions
2. Review the [configuration guide](./CONFIGURATION.md)
3. Examine test logs in `audit-reports/logs/`
4. Run with `--verbose` flag for detailed output
5. Check GitHub issues for known problems

## Integration with CI/CD

### GitHub Actions

```yaml
name: Weekly Audit

on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run audit
      - uses: actions/upload-artifact@v3
        with:
          name: audit-report
          path: audit-reports/
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
npm run audit:quick || echo "Audit warnings detected"
```

### Pre-release Check

```bash
# Before releasing
npm run audit
npm run audit:report

# Review report
open audit-reports/audit-report-latest.html

# If score < 90, consider delaying release
```

## Next Steps

After running an audit:

1. **Review the report**: Start with executive summary
2. **Prioritize issues**: Focus on critical and high priority
3. **Create tasks**: Convert issues to actionable tasks
4. **Fix and retest**: Address issues and run category audits
5. **Track progress**: Compare with previous reports
6. **Document decisions**: Record why some issues are deferred

## Additional Resources

- [Configuration Guide](./CONFIGURATION.md) - Detailed configuration options
- [Report Format Specification](./REPORT_FORMAT.md) - JSON schema and structure
- [Contributing Guide](./CONTRIBUTING.md) - How to add new audit tests
- [API Documentation](./API.md) - Programmatic usage
