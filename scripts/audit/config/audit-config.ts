/**
 * Audit Configuration
 * 
 * Defines thresholds, timeouts, and settings for the audit process
 * 
 * This configuration covers:
 * - Test execution settings
 * - Performance thresholds
 * - Accessibility standards
 * - Coverage targets
 * - Reporting options
 * - Component analysis
 * - Error handling strategies
 * - Audit categories and priorities
 */

export const auditConfig = {
  // Testing configuration
  testing: {
    timeout: 30000, // 30 seconds
    retries: 2,
    parallel: true,
    browsers: ['chromium', 'firefox'] as const,
    viewport: {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 667 },
    },
  },

  // Performance thresholds (in milliseconds)
  performance: {
    pageLoad: 3000, // 3 seconds - Requirement 13.1
    apiResponse: 2000, // 2 seconds - Requirement 13.4
    searchResponse: 2000, // 2 seconds - Requirement 3.1
    renderTime: 1000, // 1 second - Requirement 13.2
    navigationTime: 1000, // 1 second - Requirement 13.2
    uploadProgress: 100, // Show progress for uploads > 100ms - Requirement 13.5
    // Web Vitals thresholds
    webVitals: {
      FCP: 1800, // First Contentful Paint
      LCP: 2500, // Largest Contentful Paint
      FID: 100, // First Input Delay
      CLS: 0.1, // Cumulative Layout Shift
      TTFB: 800, // Time to First Byte
    },
  },

  // Accessibility configuration
  accessibility: {
    standard: 'WCAG21AA' as const, // Requirement 14.3
    ignoreRules: [] as string[],
    minScore: 90,
    checkKeyboardNavigation: true, // Requirement 14.1
    checkScreenReaderSupport: true, // Requirement 14.2
    checkColorContrast: true, // Requirement 14.3
    checkFocusIndicators: true, // Requirement 14.4
    checkAriaLabels: true,
  },

  // Coverage thresholds (percentage)
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
    // Category-specific targets
    byCategory: {
      'core-features': 90, // Higher coverage for core features
      'ui-components': 80,
      'business-logic': 85,
      'api-endpoints': 90,
      'utilities': 80,
      'configuration': 60,
    },
  },

  // Reporting configuration
  reporting: {
    formats: ['html', 'json', 'console'] as const,
    outputDir: './audit-reports',
    includeScreenshots: true,
    includeVideos: false, // Can be enabled for detailed debugging
    generateTimestamp: true,
    includeMetadata: true,
    // Report sections to include
    sections: {
      executiveSummary: true,
      scoreDashboard: true,
      categoryDetails: true,
      issuesList: true,
      recommendations: true,
      componentInventory: true,
      coverageReport: true,
      performanceMetrics: true,
      accessibilityReport: true,
      appendix: true,
    },
  },

  // Component analysis settings
  components: {
    scanPaths: [
      'src/components',
      'src/app',
      'src/lib',
      'src/hooks',
    ],
    excludePatterns: [
      '**/__tests__/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/node_modules/**',
      '**/*.d.ts',
      '**/dist/**',
      '**/.next/**',
    ],
    // Component validation rules
    validation: {
      requireTests: true, // Requirement 17.4
      requireDocs: false, // Optional for now
      checkUnusedComponents: true, // Requirement 17.2
      checkMissingComponents: true,
      generateDependencyGraph: true,
    },
  },

  // Audit categories and their priorities
  categories: {
    'core-features': { priority: 'high', weight: 1.5 },
    'organization': { priority: 'high', weight: 1.3 },
    'search': { priority: 'high', weight: 1.2 },
    'collaboration': { priority: 'medium', weight: 1.0 },
    'offline': { priority: 'high', weight: 1.2 },
    'ai': { priority: 'medium', weight: 0.8 },
    'mobile': { priority: 'high', weight: 1.1 },
    'export': { priority: 'medium', weight: 0.9 },
    'media': { priority: 'medium', weight: 0.9 },
    'settings': { priority: 'medium', weight: 0.8 },
    'templates': { priority: 'low', weight: 0.7 },
    'versions': { priority: 'medium', weight: 0.9 },
    'performance': { priority: 'high', weight: 1.4 },
    'accessibility': { priority: 'high', weight: 1.3 },
    'database': { priority: 'high', weight: 1.2 },
    'errors': { priority: 'high', weight: 1.3 },
    'components': { priority: 'medium', weight: 1.0 },
    'pages': { priority: 'high', weight: 1.1 },
    'i18n': { priority: 'low', weight: 0.6 },
    'security': { priority: 'high', weight: 1.5 },
  },

  // Security audit settings
  security: {
    checkAuthentication: true, // Requirement 20.1
    checkAuthorization: true, // Requirement 20.2
    checkApiKeySecurity: true, // Requirement 20.3
    checkInputValidation: true, // Requirement 20.4
    checkHttps: true, // Requirement 20.5
    scanForVulnerabilities: true,
  },

  // Database mode testing
  database: {
    testLocalMode: true, // Requirement 15.1
    testSupabaseMode: true, // Requirement 15.2
    testModeSwitch: true, // Requirement 15.3
    testMigrationTools: true, // Requirement 15.4
    testStartupValidation: true, // Requirement 15.5
  },

  // Error handling
  errorHandling: {
    retry: {
      maxAttempts: 3,
      backoff: 'exponential' as const,
      delay: 1000,
    },
    fallback: {
      enabled: true,
      strategy: 'partial' as const, // Continue with partial results
    },
    notification: {
      level: 'error' as const,
      channels: ['console', 'file'] as const,
    },
    // Error severity thresholds
    severity: {
      critical: 0, // No critical errors allowed
      high: 5, // Max 5 high severity issues
      medium: 20, // Max 20 medium severity issues
      low: 50, // Max 50 low severity issues
    },
  },

  // Scoring configuration
  scoring: {
    // Overall score calculation weights
    weights: {
      functionality: 0.30, // 30% - Core features working
      integration: 0.15, // 15% - Components properly integrated
      performance: 0.15, // 15% - Performance standards met
      accessibility: 0.15, // 15% - Accessibility compliance
      security: 0.10, // 10% - Security measures in place
      testing: 0.10, // 10% - Test coverage
      documentation: 0.05, // 5% - Documentation completeness
    },
    // Pass/fail thresholds
    thresholds: {
      excellent: 90,
      good: 75,
      acceptable: 60,
      needsImprovement: 40,
      failing: 0,
    },
  },

  // Execution settings
  execution: {
    // Run specific audit categories
    runCategories: 'all' as 'all' | string[],
    // Skip certain categories
    skipCategories: [] as string[],
    // Fail fast on critical errors
    failFast: false,
    // Generate report even on failures
    alwaysGenerateReport: true,
    // Verbose output
    verbose: false,
  },
} as const

export type AuditConfig = typeof auditConfig

// Helper type for audit categories
export type AuditCategory = keyof typeof auditConfig.categories

// Helper type for priority levels
export type PriorityLevel = 'high' | 'medium' | 'low'

// Helper type for severity levels
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'
