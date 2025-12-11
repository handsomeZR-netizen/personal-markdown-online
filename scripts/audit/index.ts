#!/usr/bin/env tsx
/**
 * Comprehensive Feature Audit - Main Entry Point
 * 
 * This script orchestrates the complete audit process for the note management system.
 * It provides a command-line interface for running audits, generating reports, and
 * analyzing system health across all feature categories.
 * 
 * Usage:
 *   npm run audit                    # Run full audit
 *   npm run audit -- --category=core-features  # Run specific category
 *   npm run audit -- --report-only   # Generate report from previous results
 *   npm run audit -- --help          # Show help
 * 
 * Features:
 * - Command-line argument parsing
 * - Progress indication
 * - Error handling and recovery
 * - Multiple output formats (HTML, JSON, Console)
 * - Category-specific audits
 * - Report regeneration
 * 
 * Requirements: All requirements (comprehensive system audit)
 */

import { AuditManager } from './manager'
import { AuditCategory } from './types'
import { auditConfig } from './config/audit-config'
import * as process from 'process'

/**
 * Command-line arguments interface
 */
interface CliArgs {
  help: boolean
  full: boolean
  category?: AuditCategory
  reportOnly: boolean
  verbose: boolean
  skipCategories: string[]
  outputDir?: string
  formats: string[]
}

/**
 * Parse command-line arguments
 */
function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  
  const parsed: CliArgs = {
    help: false,
    full: false,
    reportOnly: false,
    verbose: false,
    skipCategories: [],
    formats: [],
  }

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      parsed.help = true
    } else if (arg === '--full') {
      parsed.full = true
    } else if (arg === '--report-only') {
      parsed.reportOnly = true
    } else if (arg === '--verbose' || arg === '-v') {
      parsed.verbose = true
    } else if (arg.startsWith('--category=')) {
      parsed.category = arg.split('=')[1] as AuditCategory
    } else if (arg.startsWith('--skip=')) {
      parsed.skipCategories = arg.split('=')[1].split(',')
    } else if (arg.startsWith('--output=')) {
      parsed.outputDir = arg.split('=')[1]
    } else if (arg.startsWith('--formats=')) {
      parsed.formats = arg.split('=')[1].split(',')
    }
  }

  return parsed
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║         Comprehensive Feature Audit - Help                            ║
╚═══════════════════════════════════════════════════════════════════════╝

USAGE:
  npm run audit [options]

OPTIONS:
  --help, -h              Show this help message
  --full                  Run complete audit across all categories
  --category=<name>       Run audit for specific category
  --report-only           Generate report from previous audit results
  --verbose, -v           Enable verbose output
  --skip=<cat1,cat2>      Skip specific categories
  --output=<dir>          Custom output directory
  --formats=<f1,f2>       Output formats (html,json,console)

CATEGORIES:
  core-features          Core note CRUD operations
  organization           Folders, tags, and categories
  search                 Search and filtering functionality
  collaboration          Real-time collaboration features
  offline                Offline editing and sync
  ai                     AI-powered features
  mobile                 Mobile responsiveness and PWA
  export                 Export functionality
  media                  Image and media handling
  settings               Settings and configuration
  templates              Note templates
  versions               Version history
  performance            Performance metrics
  accessibility          Accessibility compliance
  database               Database mode testing
  errors                 Error handling
  components             Component integration
  pages                  Page validation
  i18n                   Internationalization
  security               Security measures

EXAMPLES:
  # Run full audit
  npm run audit -- --full

  # Audit specific category
  npm run audit -- --category=core-features

  # Audit with custom output
  npm run audit -- --output=./my-reports

  # Skip certain categories
  npm run audit -- --skip=i18n,templates

  # Generate report only
  npm run audit -- --report-only

  # Verbose mode
  npm run audit -- --verbose

CONFIGURATION:
  Edit scripts/audit/config/audit-config.ts to customize:
  - Performance thresholds
  - Accessibility standards
  - Coverage targets
  - Reporting options

OUTPUT:
  Reports are saved to: ${auditConfig.reporting.outputDir}
  Default formats: ${auditConfig.reporting.formats.join(', ')}

For more information, see: scripts/audit/README.md
`)
}

/**
 * Display audit banner
 */
function displayBanner(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║         📊 Comprehensive Feature Audit System                        ║
║                                                                       ║
║         Systematic validation of all system features                 ║
║         and components for completeness and quality                  ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
`)
}

/**
 * Validate category name
 */
function isValidCategory(category: string): category is AuditCategory {
  return category in auditConfig.categories
}

/**
 * Display progress indicator
 */
class ProgressIndicator {
  private interval: NodeJS.Timeout | null = null
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  private currentFrame = 0
  private message = ''

  start(message: string): void {
    this.message = message
    this.currentFrame = 0
    
    // Clear any existing interval
    if (this.interval) {
      clearInterval(this.interval)
    }

    // Start spinner
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}`)
      this.currentFrame = (this.currentFrame + 1) % this.frames.length
    }, 80)
  }

  stop(finalMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    
    // Clear the line and show final message
    process.stdout.write('\r\x1b[K') // Clear line
    if (finalMessage) {
      console.log(finalMessage)
    }
  }

  update(message: string): void {
    this.message = message
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = parseArgs()

  // Show help if requested
  if (args.help) {
    displayHelp()
    process.exit(0)
  }

  // Display banner
  displayBanner()

  // Apply custom configuration from args
  if (args.outputDir) {
    (auditConfig.reporting as any).outputDir = args.outputDir
  }
  if (args.formats.length > 0) {
    (auditConfig.reporting as any).formats = args.formats
  }
  if (args.verbose) {
    (auditConfig.execution as any).verbose = true
  }

  // Create audit manager
  const manager = new AuditManager()
  const progress = new ProgressIndicator()

  try {
    // Handle report-only mode
    if (args.reportOnly) {
      console.log('📊 Report generation mode\n')
      progress.start('Loading previous audit results...')
      
      await manager.generateReportOnly()
      
      progress.stop('✅ Report generated successfully')
      process.exit(0)
    }

    // Handle category-specific audit
    if (args.category) {
      if (!isValidCategory(args.category)) {
        console.error(`❌ Error: Invalid category "${args.category}"`)
        console.error(`\nValid categories: ${Object.keys(auditConfig.categories).join(', ')}`)
        process.exit(1)
      }

      console.log(`🔍 Running audit for category: ${args.category}\n`)
      progress.start(`Auditing ${args.category}...`)
      
      const categoryReport = await manager.runCategoryAudit(args.category)
      
      progress.stop()
      
      // Generate report with just this category
      const report = await manager.generateReport()
      
      console.log(`\n✅ Category audit completed`)
      console.log(`   Score: ${categoryReport.score}/100`)
      console.log(`   Status: ${categoryReport.status}`)
      
      // Exit with error code if audit failed
      if (categoryReport.status === 'failed') {
        process.exit(1)
      }
      
      process.exit(0)
    }

    // Handle full audit (default)
    console.log('🚀 Starting full system audit\n')
    console.log(`📁 Output directory: ${auditConfig.reporting.outputDir}`)
    console.log(`📄 Report formats: ${auditConfig.reporting.formats.join(', ')}`)
    console.log(`🗂️  Categories: ${Object.keys(auditConfig.categories).length}`)
    
    if (args.skipCategories.length > 0) {
      console.log(`⏭️  Skipping: ${args.skipCategories.join(', ')}`)
    }
    
    console.log()

    progress.start('Running comprehensive audit...')
    
    // Run full audit
    const report = await manager.runFullAudit()
    
    progress.stop()

    // Display completion message
    console.log('\n' + '═'.repeat(70))
    console.log('✅ AUDIT COMPLETED SUCCESSFULLY')
    console.log('═'.repeat(70))
    console.log(`\n📊 Overall Score: ${report.summary.overallScore}/100`)
    console.log(`⏱️  Duration: ${(report.metadata.duration / 1000).toFixed(2)}s`)
    console.log(`📋 Tests: ${report.summary.passedTests}/${report.summary.totalTests} passed`)
    
    if (report.summary.criticalIssues > 0) {
      console.log(`\n⚠️  Critical Issues: ${report.summary.criticalIssues}`)
    }
    
    if (report.recommendations.length > 0) {
      const highPriority = report.recommendations.filter(r => r.priority === 'high').length
      console.log(`\n💡 Recommendations: ${report.recommendations.length} (${highPriority} high priority)`)
    }

    console.log(`\n📄 Reports saved to: ${auditConfig.reporting.outputDir}`)
    console.log()

    // Exit with error code if overall score is below threshold
    if (report.summary.overallScore < auditConfig.scoring.thresholds.acceptable) {
      console.error('❌ Audit score below acceptable threshold')
      process.exit(1)
    }

    // Exit with warning code if there are critical issues
    if (report.summary.criticalIssues > 0) {
      console.warn('⚠️  Critical issues detected')
      process.exit(1)
    }

    process.exit(0)

  } catch (error) {
    progress.stop()
    
    console.error('\n' + '═'.repeat(70))
    console.error('❌ AUDIT FAILED')
    console.error('═'.repeat(70))
    console.error()
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
      
      if (args.verbose && error.stack) {
        console.error('\nStack trace:')
        console.error(error.stack)
      }
    } else {
      console.error('Unknown error occurred')
      console.error(error)
    }
    
    console.error()
    console.error('💡 Troubleshooting:')
    console.error('   1. Check that all dependencies are installed: npm install')
    console.error('   2. Ensure the application builds successfully: npm run build')
    console.error('   3. Verify database configuration in .env.local')
    console.error('   4. Run with --verbose flag for detailed error information')
    console.error('   5. Check scripts/audit/README.md for more information')
    console.error()
    
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Promise Rejection:')
  console.error(reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:')
  console.error(error)
  process.exit(1)
})

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Audit interrupted by user')
  console.log('Cleaning up...')
  process.exit(130)
})

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Audit terminated')
  console.log('Cleaning up...')
  process.exit(143)
})

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { main }
