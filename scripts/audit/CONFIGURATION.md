# Audit System Configuration Guide

## Overview

The audit system is highly configurable to adapt to different project needs, environments, and testing requirements. This guide covers all configuration options and how to customize the audit behavior.

## Configuration File

### Location

The main configuration file is located at:
```
note-app/scripts/audit/config/audit-config.ts
```

### Basic Structure

```typescript
export const auditConfig = {
  testing: { /* test execution settings */ },
  performance: { /* performance thresholds */ },
  accessibility: { /* a11y standards */ },
  coverage: { /* coverage targets */ },
  reporting: { /* report generation */ },
  analysis: { /* code analysis */ },
  categories: { /* category weights */ }
}
```

## Configuration Sections

### 1. Testing Configuration

Controls test execution behavior.

```typescript
testing: {
  // Maximum time for a single test (milliseconds)
  timeout: 30000,
  
  // Number of retry attempts for flaky tests
  retries: 2,
  
  // Run tests in parallel
  parallel: true,
  
  // Maximum parallel workers
  maxWorkers: 4,
  
  // Browsers for E2E tests
  browsers: ['chromium', 'firefox', 'webkit'],
  
  // Test environment
  environment: 'jsdom',
  
  // Setup files
  setupFiles: ['./src/test/setup.ts'],
  
  // Global test timeout
  globalTimeout: 300000, // 5 minutes
  
  // Bail on first failure
  bail: false,
  
  // Verbose output
  verbose: false,
  
  // Test pattern matching
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.property.test.ts'
  ],
  
  // Files to ignore
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**'
  ]
}
```

**Customization Examples:**

```typescript
// Fast mode (for development)
testing: {
  timeout: 10000,
  retries: 0,
  parallel: true,
  maxWorkers: 8,
  browsers: ['chromium'], // Only Chrome
  bail: true // Stop on first failure
}

// Thorough mode (for CI)
testing: {
  timeout: 60000,
  retries: 3,
  parallel: true,
  maxWorkers: 2,
  browsers: ['chromium', 'firefox', 'webkit'],
  bail: false // Run all tests
}

// Debug mode
testing: {
  timeout: 0, // No timeout
  retries: 0,
  parallel: false, // Sequential
  verbose: true,
  bail: true
}
```

### 2. Performance Configuration

Defines performance thresholds and targets.

```typescript
performance: {
  // Page load time threshold (ms)
  pageLoad: {
    target: 3000,
    warning: 2000,
    critical: 5000
  },
  
  // API response time threshold (ms)
  apiResponse: {
    target: 2000,
    warning: 1500,
    critical: 3000
  },
  
  // Search response time (ms)
  searchResponse: {
    target: 2000,
    warning: 1500,
    critical: 3000
  },
  
  // Server startup time (ms)
  serverStartup: {
    target: 5000,
    warning: 3000,
    critical: 10000
  },
  
  // Page navigation time (ms)
  pageNavigation: {
    target: 1000,
    warning: 500,
    critical: 2000
  },
  
  // Bundle size limits (KB)
  bundleSize: {
    main: {
      target: 500,
      warning: 400,
      critical: 700
    },
    vendor: {
      target: 1000,
      warning: 800,
      critical: 1500
    }
  },
  
  // Memory usage limits (MB)
  memoryUsage: {
    target: 100,
    warning: 80,
    critical: 150
  },
  
  // Web Vitals thresholds
  webVitals: {
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    TTFB: { good: 800, needsImprovement: 1800 }
  }
}
```

**Customization Examples:**

```typescript
// Strict performance requirements
performance: {
  pageLoad: { target: 2000, warning: 1500, critical: 3000 },
  apiResponse: { target: 1000, warning: 800, critical: 1500 },
  searchResponse: { target: 1000, warning: 800, critical: 1500 }
}

// Relaxed for development
performance: {
  pageLoad: { target: 5000, warning: 4000, critical: 8000 },
  apiResponse: { target: 3000, warning: 2500, critical: 5000 },
  searchResponse: { target: 3000, warning: 2500, critical: 5000 }
}
```

### 3. Accessibility Configuration

Controls accessibility testing standards and rules.

```typescript
accessibility: {
  // WCAG standard to test against
  standard: 'WCAG21AA', // or 'WCAG21A', 'WCAG21AAA'
  
  // Rules to ignore (use sparingly)
  ignoreRules: [
    // Example: 'color-contrast' - only if you have a valid reason
  ],
  
  // Minimum accessibility score (0-100)
  minScore: 90,
  
  // Elements to exclude from testing
  exclude: [
    '.third-party-widget',
    '#external-iframe'
  ],
  
  // Severity levels to report
  reportLevels: ['critical', 'serious', 'moderate'],
  
  // Check specific ARIA attributes
  checkAria: true,
  
  // Check keyboard navigation
  checkKeyboard: true,
  
  // Check color contrast
  checkContrast: true,
  
  // Check focus indicators
  checkFocus: true,
  
  // Check semantic HTML
  checkSemantics: true,
  
  // Browser for a11y tests
  browser: 'chromium',
  
  // Viewport sizes to test
  viewports: [
    { width: 1920, height: 1080 }, // Desktop
    { width: 768, height: 1024 },  // Tablet
    { width: 375, height: 667 }    // Mobile
  ]
}
```

**Customization Examples:**

```typescript
// Strict WCAG AAA compliance
accessibility: {
  standard: 'WCAG21AAA',
  minScore: 95,
  ignoreRules: [],
  reportLevels: ['critical', 'serious', 'moderate', 'minor']
}

// Basic WCAG A compliance
accessibility: {
  standard: 'WCAG21A',
  minScore: 80,
  reportLevels: ['critical', 'serious']
}
```

### 4. Coverage Configuration

Defines code coverage targets.

```typescript
coverage: {
  // Coverage thresholds (percentage)
  statements: 80,
  branches: 75,
  functions: 80,
  lines: 80,
  
  // Per-category targets
  categories: {
    'core-features': { statements: 90, branches: 85 },
    'collaboration': { statements: 85, branches: 80 },
    'ai': { statements: 70, branches: 65 }
  },
  
  // Files to include in coverage
  include: [
    'src/**/*.ts',
    'src/**/*.tsx'
  ],
  
  // Files to exclude from coverage
  exclude: [
    'src/**/*.test.ts',
    'src/**/*.spec.ts',
    'src/test/**',
    'src/**/__tests__/**'
  ],
  
  // Coverage reporters
  reporters: ['text', 'html', 'json', 'lcov'],
  
  // Coverage directory
  directory: './coverage',
  
  // Fail if coverage is below threshold
  failOnLowCoverage: true,
  
  // Show uncovered lines
  showUncovered: true
}
```

**Customization Examples:**

```typescript
// High coverage requirements
coverage: {
  statements: 90,
  branches: 85,
  functions: 90,
  lines: 90,
  failOnLowCoverage: true
}

// Relaxed for early development
coverage: {
  statements: 60,
  branches: 50,
  functions: 60,
  lines: 60,
  failOnLowCoverage: false
}
```

### 5. Reporting Configuration

Controls report generation and output.

```typescript
reporting: {
  // Report formats to generate
  formats: ['html', 'json', 'console'],
  
  // Output directory
  outputDir: './audit-reports',
  
  // Include screenshots in reports
  includeScreenshots: true,
  
  // Screenshot quality (0-100)
  screenshotQuality: 80,
  
  // Include video recordings
  includeVideos: false,
  
  // Include detailed logs
  includeDetailedLogs: true,
  
  // Include source code snippets
  includeCodeSnippets: true,
  
  // Maximum snippet lines
  maxSnippetLines: 10,
  
  // Include dependency graph
  includeDependencyGraph: true,
  
  // Include coverage visualization
  includeCoverageViz: true,
  
  // Report title
  title: 'Comprehensive Feature Audit',
  
  // Report description
  description: 'Automated audit of note-taking application',
  
  // Include metadata
  metadata: {
    project: 'note-app',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  
  // Console output options
  console: {
    colors: true,
    verbose: false,
    showProgress: true,
    showTimings: true
  },
  
  // HTML report options
  html: {
    theme: 'light', // or 'dark', 'auto'
    interactive: true,
    includeCharts: true,
    includeFilters: true,
    includeSorting: true
  },
  
  // JSON report options
  json: {
    pretty: true,
    indent: 2,
    includeRawData: true
  }
}
```

**Customization Examples:**

```typescript
// Minimal reporting (CI)
reporting: {
  formats: ['json', 'console'],
  includeScreenshots: false,
  includeVideos: false,
  includeDetailedLogs: false,
  console: { colors: false, verbose: false }
}

// Comprehensive reporting (local)
reporting: {
  formats: ['html', 'json', 'console'],
  includeScreenshots: true,
  includeVideos: true,
  includeDetailedLogs: true,
  includeDependencyGraph: true,
  html: { theme: 'auto', interactive: true }
}
```

### 6. Analysis Configuration

Controls code analysis behavior.

```typescript
analysis: {
  // Component analysis
  components: {
    // Directories to scan
    scanDirs: ['src/components', 'src/app'],
    
    // File patterns to include
    include: ['**/*.tsx', '**/*.jsx'],
    
    // File patterns to exclude
    exclude: ['**/*.test.tsx', '**/*.stories.tsx'],
    
    // Check for unused components
    checkUnused: true,
    
    // Check for missing documentation
    checkDocs: true,
    
    // Check for missing tests
    checkTests: true,
    
    // Minimum component usage
    minUsageCount: 1
  },
  
  // Page analysis
  pages: {
    // App directory
    appDir: 'src/app',
    
    // Check for missing pages
    checkMissing: true,
    
    // Check for broken links
    checkLinks: true,
    
    // Check for SEO metadata
    checkSEO: true
  },
  
  // Dependency analysis
  dependencies: {
    // Check for unused dependencies
    checkUnused: true,
    
    // Check for outdated dependencies
    checkOutdated: true,
    
    // Check for security vulnerabilities
    checkSecurity: true,
    
    // Maximum dependency age (days)
    maxAge: 365
  },
  
  // Code quality
  quality: {
    // Run ESLint
    runLinter: true,
    
    // ESLint config
    lintConfig: '.eslintrc.json',
    
    // Run Prettier
    runFormatter: true,
    
    // Check TypeScript errors
    checkTypes: true,
    
    // Maximum file size (KB)
    maxFileSize: 500,
    
    // Maximum function complexity
    maxComplexity: 20
  }
}
```

### 7. Category Weights

Defines how each category contributes to the overall score.

```typescript
categories: {
  weights: {
    'core-features': 0.20,      // 20%
    'organization': 0.10,        // 10%
    'search': 0.10,              // 10%
    'collaboration': 0.08,       // 8%
    'offline': 0.08,             // 8%
    'ai': 0.05,                  // 5%
    'mobile': 0.08,              // 8%
    'export': 0.05,              // 5%
    'media': 0.05,               // 5%
    'settings': 0.03,            // 3%
    'templates': 0.03,           // 3%
    'versions': 0.03,            // 3%
    'performance': 0.15,         // 15%
    'accessibility': 0.10,       // 10%
    'database': 0.05,            // 5%
    'errors': 0.05,              // 5%
    'components': 0.05,          // 5%
    'pages': 0.03,               // 3%
    'i18n': 0.03,                // 3%
    'security': 0.10             // 10%
  },
  
  // Minimum score per category
  minimumScores: {
    'security': 90,
    'accessibility': 85,
    'core-features': 85,
    'performance': 80
  },
  
  // Categories required for passing
  requiredCategories: [
    'core-features',
    'security',
    'accessibility',
    'performance'
  ]
}
```

**Customization Examples:**

```typescript
// Focus on core functionality
categories: {
  weights: {
    'core-features': 0.30,
    'organization': 0.15,
    'search': 0.15,
    'performance': 0.20,
    'accessibility': 0.10,
    'security': 0.10
    // ... others reduced
  }
}

// Focus on user experience
categories: {
  weights: {
    'performance': 0.25,
    'accessibility': 0.20,
    'mobile': 0.15,
    'core-features': 0.15,
    'errors': 0.10,
    'i18n': 0.10,
    'security': 0.05
  }
}
```

## Environment-Specific Configuration

### Development Environment

```typescript
// audit.config.dev.ts
export const devConfig = {
  ...auditConfig,
  testing: {
    ...auditConfig.testing,
    timeout: 10000,
    retries: 0,
    browsers: ['chromium']
  },
  performance: {
    ...auditConfig.performance,
    pageLoad: { target: 5000, warning: 4000, critical: 8000 }
  },
  reporting: {
    ...auditConfig.reporting,
    formats: ['console'],
    includeScreenshots: false
  }
}
```

### CI/CD Environment

```typescript
// audit.config.ci.ts
export const ciConfig = {
  ...auditConfig,
  testing: {
    ...auditConfig.testing,
    timeout: 60000,
    retries: 3,
    parallel: true,
    maxWorkers: 2
  },
  reporting: {
    ...auditConfig.reporting,
    formats: ['json', 'html'],
    includeScreenshots: true,
    includeVideos: false
  },
  coverage: {
    ...auditConfig.coverage,
    failOnLowCoverage: true
  }
}
```

### Production Validation

```typescript
// audit.config.prod.ts
export const prodConfig = {
  ...auditConfig,
  performance: {
    ...auditConfig.performance,
    pageLoad: { target: 2000, warning: 1500, critical: 3000 },
    apiResponse: { target: 1000, warning: 800, critical: 1500 }
  },
  accessibility: {
    ...auditConfig.accessibility,
    standard: 'WCAG21AA',
    minScore: 95
  },
  categories: {
    ...auditConfig.categories,
    minimumScores: {
      'security': 95,
      'accessibility': 90,
      'performance': 85,
      'core-features': 90
    }
  }
}
```

## Using Custom Configuration

### Command Line

```bash
# Use custom config file
tsx scripts/audit/index.ts --config ./audit.config.custom.ts

# Override specific options
tsx scripts/audit/index.ts --timeout 60000 --retries 3

# Use environment-specific config
NODE_ENV=production tsx scripts/audit/index.ts --config ./audit.config.prod.ts
```

### Programmatic Usage

```typescript
import { runAudit } from './scripts/audit/manager'
import { customConfig } from './audit.config.custom'

async function main() {
  const results = await runAudit(customConfig)
  console.log('Audit complete:', results.summary)
}

main()
```

### Environment Variables

```bash
# Set via environment variables
export AUDIT_TIMEOUT=60000
export AUDIT_RETRIES=3
export AUDIT_PARALLEL=true
export AUDIT_OUTPUT_DIR=./custom-reports
export AUDIT_FORMATS=html,json

npm run audit
```

## Configuration Validation

The audit system validates configuration on startup:

```typescript
// Validation errors
✗ Invalid timeout: must be a positive number
✗ Invalid browser: 'ie11' is not supported
✗ Category weights must sum to 1.0 (currently: 0.95)
✗ Output directory does not exist: ./invalid-path

// Validation warnings
⚠ High timeout value (120000ms) may cause slow audits
⚠ Retries set to 0 - flaky tests may fail
⚠ Coverage threshold very low (40%) - consider increasing
```

## Best Practices

1. **Start with defaults**: Use the default configuration initially
2. **Adjust gradually**: Make incremental changes based on needs
3. **Document changes**: Comment why you changed specific values
4. **Environment-specific**: Use different configs for dev/CI/prod
5. **Version control**: Commit configuration files to git
6. **Review regularly**: Revisit thresholds as project matures
7. **Team consensus**: Discuss configuration changes with team

## Troubleshooting

### Configuration Not Loading

```bash
# Check file path
ls -la scripts/audit/config/audit-config.ts

# Check for syntax errors
npx tsc --noEmit scripts/audit/config/audit-config.ts

# Use absolute path
tsx scripts/audit/index.ts --config $(pwd)/audit.config.ts
```

### Invalid Configuration Values

```bash
# Validate configuration
tsx scripts/audit/validate-config.ts

# Use default configuration
tsx scripts/audit/index.ts --use-defaults
```

### Performance Issues

```bash
# Reduce parallelism
tsx scripts/audit/index.ts --max-workers 1

# Increase timeout
tsx scripts/audit/index.ts --timeout 120000

# Skip slow tests
tsx scripts/audit/index.ts --skip slow
```

## Additional Resources

- [Usage Guide](./USAGE_GUIDE.md) - How to run audits
- [Report Format](./REPORT_FORMAT.md) - Understanding reports
- [API Documentation](./API.md) - Programmatic usage
- [Contributing](./CONTRIBUTING.md) - Adding new tests
