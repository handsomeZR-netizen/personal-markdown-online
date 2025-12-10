# Audit System Examples

## Overview

This document provides practical examples and common use cases for the comprehensive feature audit system.

## Quick Start Examples

### Run Complete Audit

```bash
# Run all tests and generate reports
npm run audit

# Or using tsx directly
tsx scripts/audit/index.ts
```

**Expected output:**
```
✅ All categories tested
📊 Overall score: 94.7/100
📄 Reports generated in audit-reports/
```

### Run Specific Category

```bash
# Test only core features
npm run audit -- --category core-features

# Test multiple categories
npm run audit -- --category core-features,search,performance
```

### Generate Report Only

```bash
# Generate reports from cached test results
npm run audit:report

# Or specify format
npm run audit:report -- --format html,json
```

## Common Workflows

### 1. Pre-Commit Check

Quick validation before committing code:

```bash
# Fast audit focusing on changed areas
npm run audit -- \
  --category core-features,security \
  --timeout 10000 \
  --format console

# Exit code 0 if passed, 1 if failed
if [ $? -eq 0 ]; then
  echo "✅ Audit passed, safe to commit"
  git commit -m "Your commit message"
else
  echo "❌ Audit failed, please fix issues"
fi
```

### 2. Pre-Release Validation

Comprehensive check before releasing:

```bash
# Full audit with strict thresholds
npm run audit -- \
  --config audit.config.prod.ts \
  --format html,json \
  --output ./release-audit

# Check critical categories
npm run audit -- \
  --category security,accessibility,performance,core-features \
  --fail-on-warning

# Review report
open release-audit/audit-report-latest.html
```

### 3. CI/CD Integration

Automated testing in continuous integration:

```bash
# GitHub Actions
npm run audit -- \
  --ci \
  --format json,html \
  --output ./ci-reports \
  --parallel \
  --max-workers 2

# Upload artifacts
# (handled by CI configuration)
```

### 4. Performance Monitoring

Track performance over time:

```bash
# Run performance-focused audit
npm run audit -- \
  --category performance \
  --format json \
  --output ./perf-reports

# Compare with baseline
node scripts/compare-performance.js \
  ./perf-reports/audit-report-latest.json \
  ./perf-reports/baseline.json
```

### 5. Accessibility Audit

Focus on accessibility compliance:

```bash
# Run a11y tests
npm run audit:a11y

# Or with custom config
npm run audit -- \
  --category accessibility \
  --config audit.config.a11y.ts \
  --format html

# Generate detailed a11y report
open audit-reports/audit-report-latest.html#accessibility
```

### 6. Component Analysis

Analyze component usage and integration:

```bash
# Run component analysis
npm run audit:components

# Find unused components
npm run audit -- \
  --category components \
  --format json | \
  jq '.componentInventory.unusedComponents[]'

# Generate dependency graph
npm run audit:components -- --graph
```

### 7. Security Audit

Security-focused validation:

```bash
# Run security tests
npm run audit -- \
  --category security \
  --fail-on-critical

# Check for vulnerabilities
npm run audit -- \
  --category security \
  --check-dependencies \
  --format html
```

## Advanced Examples

### Custom Configuration

```bash
# Use custom config file
tsx scripts/audit/index.ts \
  --config ./custom-audit.config.ts

# Override specific options
tsx scripts/audit/index.ts \
  --timeout 60000 \
  --retries 3 \
  --parallel false
```

### Filtering Tests

```bash
# Run only property tests
tsx scripts/audit/index.ts \
  --pattern "*.property.test.ts"

# Skip slow tests
tsx scripts/audit/index.ts \
  --skip slow

# Run specific test file
tsx scripts/audit/index.ts \
  --test-file "src/lib/__tests__/audit/core-features.test.ts"
```

### Database Mode Testing

```bash
# Test in local mode
DATABASE_MODE=local npm run audit

# Test in Supabase mode
DATABASE_MODE=supabase npm run audit

# Test both modes
npm run audit -- --db-mode both
```

### Parallel Execution

```bash
# Run with maximum parallelism
npm run audit -- \
  --parallel \
  --max-workers 8

# Run sequentially for debugging
npm run audit -- \
  --parallel false \
  --verbose
```

### Custom Output

```bash
# Specify output directory
npm run audit -- \
  --output ./custom-reports

# Custom report name
npm run audit -- \
  --output ./reports \
  --name "sprint-23-audit"

# Multiple formats
npm run audit -- \
  --format html,json,console \
  --output ./reports
```

## Scripting Examples

### Bash Script

```bash
#!/bin/bash
# run-audit.sh

set -e

echo "🔍 Running comprehensive audit..."

# Run audit
npm run audit -- \
  --format json,html \
  --output ./audit-reports

# Check score
SCORE=$(jq '.summary.overallScore' audit-reports/audit-report-latest.json)
echo "📊 Overall Score: $SCORE"

# Check for critical issues
CRITICAL=$(jq '.summary.criticalIssues' audit-reports/audit-report-latest.json)

if [ "$CRITICAL" -gt 0 ]; then
  echo "🔴 Found $CRITICAL critical issues!"
  jq '.categories[].issues[] | select(.severity == "critical")' \
    audit-reports/audit-report-latest.json
  exit 1
fi

# Check minimum score
if (( $(echo "$SCORE < 90" | bc -l) )); then
  echo "⚠️  Score below threshold (90)"
  exit 1
fi

echo "✅ Audit passed!"
```

### Node.js Script

```javascript
// run-audit.js
const { execSync } = require('child_process')
const fs = require('fs')

async function runAudit() {
  console.log('🔍 Running audit...')
  
  // Run audit
  execSync('npm run audit -- --format json', { stdio: 'inherit' })
  
  // Read report
  const report = JSON.parse(
    fs.readFileSync('audit-reports/audit-report-latest.json', 'utf8')
  )
  
  // Check results
  console.log(`📊 Overall Score: ${report.summary.overallScore}`)
  console.log(`✅ Passed: ${report.summary.passedTests}`)
  console.log(`❌ Failed: ${report.summary.failedTests}`)
  
  // Check critical issues
  const criticalIssues = report.categories
    .flatMap(cat => cat.issues)
    .filter(issue => issue.severity === 'critical')
  
  if (criticalIssues.length > 0) {
    console.error('🔴 Critical issues found:')
    criticalIssues.forEach(issue => {
      console.error(`  - ${issue.title}`)
      console.error(`    ${issue.location}`)
    })
    process.exit(1)
  }
  
  // Check score threshold
  if (report.summary.overallScore < 90) {
    console.error('⚠️  Score below threshold')
    process.exit(1)
  }
  
  console.log('✅ Audit passed!')
}

runAudit().catch(err => {
  console.error('❌ Audit failed:', err)
  process.exit(1)
})
```

### Python Script

```python
#!/usr/bin/env python3
# run_audit.py

import subprocess
import json
import sys

def run_audit():
    print("🔍 Running audit...")
    
    # Run audit
    subprocess.run([
        "npm", "run", "audit", "--",
        "--format", "json"
    ], check=True)
    
    # Read report
    with open("audit-reports/audit-report-latest.json") as f:
        report = json.load(f)
    
    # Check results
    summary = report["summary"]
    print(f"📊 Overall Score: {summary['overallScore']}")
    print(f"✅ Passed: {summary['passedTests']}")
    print(f"❌ Failed: {summary['failedTests']}")
    
    # Check critical issues
    critical_issues = [
        issue
        for category in report["categories"]
        for issue in category["issues"]
        if issue["severity"] == "critical"
    ]
    
    if critical_issues:
        print("🔴 Critical issues found:")
        for issue in critical_issues:
            print(f"  - {issue['title']}")
            print(f"    {issue['location']}")
        sys.exit(1)
    
    # Check score threshold
    if summary["overallScore"] < 90:
        print("⚠️  Score below threshold")
        sys.exit(1)
    
    print("✅ Audit passed!")

if __name__ == "__main__":
    try:
        run_audit()
    except Exception as e:
        print(f"❌ Audit failed: {e}")
        sys.exit(1)
```

## Report Analysis Examples

### Extract Failed Tests

```bash
# Using jq
jq '.categories[].tests[] | select(.passed == false) | {name, file, error}' \
  audit-reports/audit-report-latest.json

# Using Node.js
node -e "
const report = require('./audit-reports/audit-report-latest.json');
const failed = report.categories
  .flatMap(c => c.tests)
  .filter(t => !t.passed);
console.log(JSON.stringify(failed, null, 2));
"
```

### Compare Reports

```bash
# Compare two reports
node scripts/compare-reports.js \
  audit-reports/audit-report-old.json \
  audit-reports/audit-report-new.json

# Show score trend
jq -r '.summary.overallScore' audit-reports/*.json | \
  awk '{sum+=$1; count++} END {print "Average:", sum/count}'
```

### Generate Summary

```bash
# Create summary report
jq '{
  score: .summary.overallScore,
  passed: .summary.passedTests,
  failed: .summary.failedTests,
  critical: .summary.criticalIssues,
  categories: [.categories[] | {
    name: .category,
    score: .score,
    status: .status
  }]
}' audit-reports/audit-report-latest.json > summary.json
```

### Export to CSV

```bash
# Export category scores
jq -r '.categories[] | [.category, .score, .status] | @csv' \
  audit-reports/audit-report-latest.json > categories.csv

# Export issues
jq -r '.categories[].issues[] | 
  [.severity, .category, .title, .location] | @csv' \
  audit-reports/audit-report-latest.json > issues.csv
```

## Integration Examples

### GitHub Actions

```yaml
# .github/workflows/audit.yml
name: Audit

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run audit
        run: |
          npm run audit -- \
            --ci \
            --format json,html \
            --output ./audit-reports
      
      - name: Check score
        run: |
          SCORE=$(jq '.summary.overallScore' audit-reports/audit-report-latest.json)
          echo "Score: $SCORE"
          if (( $(echo "$SCORE < 85" | bc -l) )); then
            echo "Score below threshold"
            exit 1
          fi
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: audit-report
          path: audit-reports/
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs')
            const report = JSON.parse(
              fs.readFileSync('audit-reports/audit-report-latest.json', 'utf8')
            )
            
            const body = `
            ## Audit Results
            
            **Score:** ${report.summary.overallScore}/100
            **Passed:** ${report.summary.passedTests}
            **Failed:** ${report.summary.failedTests}
            **Critical Issues:** ${report.summary.criticalIssues}
            
            [View Full Report](../actions/runs/${context.runId})
            `
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            })
```

### GitLab CI

```yaml
# .gitlab-ci.yml
audit:
  stage: test
  image: node:18
  
  script:
    - npm ci
    - npm run audit -- --ci --format json,html
    
  after_script:
    - |
      SCORE=$(jq '.summary.overallScore' audit-reports/audit-report-latest.json)
      echo "Audit Score: $SCORE"
  
  artifacts:
    when: always
    paths:
      - audit-reports/
    reports:
      junit: audit-reports/junit.xml
  
  rules:
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
    - if: '$CI_COMMIT_BRANCH == "main"'
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running quick audit..."

npm run audit -- \
  --category core-features,security \
  --timeout 10000 \
  --format console \
  --no-report

if [ $? -ne 0 ]; then
  echo "❌ Audit failed. Commit aborted."
  echo "Run 'npm run audit' for details."
  exit 1
fi

echo "✅ Audit passed"
```

### VS Code Task

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Audit",
      "type": "npm",
      "script": "audit",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Run Quick Audit",
      "type": "shell",
      "command": "npm run audit -- --category core-features --format console",
      "problemMatcher": []
    },
    {
      "label": "View Audit Report",
      "type": "shell",
      "command": "open audit-reports/audit-report-latest.html",
      "problemMatcher": []
    }
  ]
}
```

## Troubleshooting Examples

### Debug Failing Test

```bash
# Run single test with verbose output
tsx scripts/audit/index.ts \
  --test-file "src/lib/__tests__/audit/core-features.test.ts" \
  --verbose \
  --timeout 0

# Run with debugger
node --inspect-brk \
  node_modules/.bin/tsx \
  scripts/audit/index.ts \
  --category core-features
```

### Check Configuration

```bash
# Validate configuration
tsx scripts/audit/validate-config.ts

# Show effective configuration
tsx scripts/audit/index.ts --show-config

# Test with default config
tsx scripts/audit/index.ts --use-defaults
```

### Performance Issues

```bash
# Run with profiling
node --prof \
  node_modules/.bin/tsx \
  scripts/audit/index.ts

# Analyze profile
node --prof-process isolate-*.log > profile.txt

# Reduce parallelism
npm run audit -- --max-workers 1

# Increase timeout
npm run audit -- --timeout 120000
```

## Best Practices

### Regular Audits

```bash
# Daily quick check
0 9 * * * cd /path/to/project && npm run audit -- --quick

# Weekly full audit
0 0 * * 0 cd /path/to/project && npm run audit

# Monthly comprehensive audit
0 0 1 * * cd /path/to/project && npm run audit -- --comprehensive
```

### Score Tracking

```bash
# Track scores over time
echo "$(date),$(jq '.summary.overallScore' audit-reports/audit-report-latest.json)" \
  >> audit-scores.csv

# Plot trend
gnuplot -e "
  set datafile separator ',';
  set xdata time;
  set timefmt '%Y-%m-%d';
  plot 'audit-scores.csv' using 1:2 with lines;
  pause -1
"
```

### Automated Fixes

```bash
# Fix auto-fixable issues
npm run audit -- --fix

# Fix specific category
npm run audit -- --category accessibility --fix

# Dry run
npm run audit -- --fix --dry-run
```

## Additional Resources

- [Usage Guide](./USAGE_GUIDE.md) - Complete usage documentation
- [Configuration Guide](./CONFIGURATION.md) - Configuration options
- [Report Format](./REPORT_FORMAT.md) - Report structure
- [API Documentation](./API.md) - Programmatic usage
