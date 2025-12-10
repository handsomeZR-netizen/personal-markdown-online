/**
 * Audit Manager - Orchestrates the audit process
 * 
 * This class coordinates the entire audit workflow, managing:
 * - Category-based audits
 * - Result aggregation
 * - Report generation
 * - Error handling and recovery
 */

import { 
  AuditReport, 
  AuditCategory, 
  CategoryReport, 
  TestResult,
  Issue,
  Recommendation 
} from './types'
import { HtmlReporter } from './reporters/html-reporter'
import { JsonReporter } from './reporters/json-reporter'
import { ConsoleReporter } from './reporters/console-reporter'
import { ComponentAnalyzer } from './analyzers/component-analyzer'
import { auditConfig } from './config/audit-config'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Main audit orchestration class
 * Implements the AuditManager interface from the design document
 */
export class AuditManager {
  private results: CategoryReport[] = []
  private startTime: Date = new Date()
  private categoryHandlers: Map<AuditCategory, () => Promise<CategoryReport>>

  constructor() {
    // Initialize category handlers map
    this.categoryHandlers = new Map()
    this.registerCategoryHandlers()
  }

  /**
   * Register handlers for each audit category
   * These will be implemented in subsequent tasks
   */
  private registerCategoryHandlers(): void {
    const categories: AuditCategory[] = [
      'core-features',
      'organization',
      'search',
      'collaboration',
      'offline',
      'ai',
      'mobile',
      'export',
      'media',
      'settings',
      'templates',
      'versions',
      'performance',
      'accessibility',
      'database',
      'errors',
      'components',
      'pages',
      'i18n',
      'security',
    ]

    // Register placeholder handlers for all categories
    categories.forEach(category => {
      this.categoryHandlers.set(category, () => this.createPlaceholderReport(category))
    })
    
    // Register implemented handlers
    this.categoryHandlers.set('components', () => this.runComponentAnalysis())
  }

  /**
   * Execute a complete audit across all categories
   * @returns Complete audit report with all results
   */
  async runFullAudit(): Promise<AuditReport> {
    console.log('📊 Initializing full audit...\n')
    console.log(`⏰ Start time: ${this.startTime.toISOString()}\n`)
    
    this.results = []
    this.startTime = new Date()

    const categories = Array.from(this.categoryHandlers.keys())
    
    console.log(`📋 Auditing ${categories.length} categories:\n`)
    categories.forEach((cat, idx) => {
      console.log(`   ${idx + 1}. ${cat}`)
    })
    console.log()

    // Run audits sequentially to avoid resource contention
    for (const category of categories) {
      try {
        await this.runCategoryAudit(category)
      } catch (error) {
        console.error(`❌ Error auditing ${category}:`, error)
        // Continue with other categories even if one fails
        this.results.push(this.createErrorReport(category, error as Error))
      }
    }

    console.log('\n✅ All category audits completed')
    return this.generateReport()
  }

  /**
   * Execute audit for a specific category
   * @param category The audit category to test
   * @returns Category-specific audit report
   */
  async runCategoryAudit(category: AuditCategory): Promise<CategoryReport> {
    console.log(`\n🔍 Auditing category: ${category}`)
    const startTime = Date.now()
    
    try {
      // Get the handler for this category
      const handler = this.categoryHandlers.get(category)
      
      if (!handler) {
        throw new Error(`No handler registered for category: ${category}`)
      }

      // Execute the category-specific audit
      const categoryReport = await handler()
      
      const duration = Date.now() - startTime
      console.log(`✓ ${category} audit completed in ${duration}ms (Score: ${categoryReport.score}/100)`)
      
      this.results.push(categoryReport)
      return categoryReport
      
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ ${category} audit failed after ${duration}ms:`, error)
      
      const errorReport = this.createErrorReport(category, error as Error)
      this.results.push(errorReport)
      return errorReport
    }
  }

  /**
   * Create a placeholder report for categories not yet implemented
   */
  private async createPlaceholderReport(category: AuditCategory): Promise<CategoryReport> {
    return {
      category,
      status: 'warning',
      score: 0,
      tests: [],
      issues: [{
        severity: 'low',
        category,
        title: 'Category not yet implemented',
        description: `Audit tests for ${category} are pending implementation`,
        suggestion: 'Implement category-specific tests in subsequent tasks',
      }],
      recommendations: [`Implement ${category} audit tests`],
    }
  }

  /**
   * Create an error report when a category audit fails
   */
  private createErrorReport(category: AuditCategory, error: Error): CategoryReport {
    return {
      category,
      status: 'failed',
      score: 0,
      tests: [{
        passed: false,
        category,
        testName: 'Category Audit',
        duration: 0,
        errors: [error],
      }],
      issues: [{
        severity: 'critical',
        category,
        title: 'Audit execution failed',
        description: error.message,
        suggestion: 'Check audit configuration and system requirements',
      }],
      recommendations: [`Fix ${category} audit execution errors`],
    }
  }

  /**
   * Register a custom handler for a specific audit category
   * Allows extending the audit system with new category implementations
   * 
   * @param category The category to register
   * @param handler The async function that performs the audit
   */
  registerCategoryHandler(
    category: AuditCategory, 
    handler: () => Promise<CategoryReport>
  ): void {
    this.categoryHandlers.set(category, handler)
    console.log(`✓ Registered handler for category: ${category}`)
  }

  /**
   * Get list of all registered audit categories
   */
  getRegisteredCategories(): AuditCategory[] {
    return Array.from(this.categoryHandlers.keys())
  }

  /**
   * Check if a category has a handler registered
   */
  hasCategoryHandler(category: AuditCategory): boolean {
    return this.categoryHandlers.has(category)
  }

  /**
   * Run component analysis
   * Implements task 19: Component analyzer
   */
  async runComponentAnalysis(): Promise<CategoryReport> {
    console.log('\n🧩 Running component analysis...')
    const startTime = Date.now()
    
    try {
      // Determine base path - if we're in note-app already, use cwd, otherwise add note-app
      const basePath = process.cwd().endsWith('note-app') 
        ? process.cwd() 
        : path.join(process.cwd(), 'note-app')
      const analyzer = new ComponentAnalyzer(basePath)
      const { components, inventory } = await analyzer.analyze()
      
      const duration = Date.now() - startTime
      
      // Build test results
      const tests: TestResult[] = []
      const issues: Issue[] = []
      const recommendations: string[] = []
      
      // Test 1: All components should be used
      tests.push({
        passed: inventory.unusedComponents.length === 0,
        category: 'components',
        testName: 'All components are used',
        duration: 0,
        warnings: inventory.unusedComponents.length > 0 
          ? [`${inventory.unusedComponents.length} unused components found`]
          : undefined,
      })
      
      if (inventory.unusedComponents.length > 0) {
        issues.push({
          severity: 'medium',
          category: 'components',
          title: 'Unused components detected',
          description: `Found ${inventory.unusedComponents.length} components that are not used anywhere`,
          suggestion: 'Review and remove unused components or integrate them into the application',
        })
        recommendations.push('Remove or integrate unused components')
      }
      
      // Test 2: Components should have tests
      const testCoverage = ((components.length - inventory.componentsWithoutTests.length) / components.length) * 100
      tests.push({
        passed: testCoverage >= 80,
        category: 'components',
        testName: 'Components have tests',
        duration: 0,
        warnings: testCoverage < 80 
          ? [`Test coverage is ${testCoverage.toFixed(1)}%, target is 80%`]
          : undefined,
      })
      
      if (testCoverage < 80) {
        issues.push({
          severity: 'medium',
          category: 'components',
          title: 'Low test coverage for components',
          description: `${inventory.componentsWithoutTests.length} components lack tests (${testCoverage.toFixed(1)}% coverage)`,
          suggestion: 'Add unit tests for components to improve reliability',
        })
        recommendations.push('Increase component test coverage to 80%')
      }
      
      // Test 3: Components should have documentation
      const docCoverage = ((components.length - inventory.componentsWithoutDocs.length) / components.length) * 100
      tests.push({
        passed: docCoverage >= 70,
        category: 'components',
        testName: 'Components have documentation',
        duration: 0,
        warnings: docCoverage < 70 
          ? [`Documentation coverage is ${docCoverage.toFixed(1)}%, target is 70%`]
          : undefined,
      })
      
      if (docCoverage < 70) {
        issues.push({
          severity: 'low',
          category: 'components',
          title: 'Low documentation coverage',
          description: `${inventory.componentsWithoutDocs.length} components lack documentation (${docCoverage.toFixed(1)}% coverage)`,
          suggestion: 'Add JSDoc comments to components for better maintainability',
        })
        recommendations.push('Improve component documentation coverage')
      }
      
      // Calculate score
      const passedTests = tests.filter(t => t.passed).length
      const score = Math.round((passedTests / tests.length) * 100)
      
      const status: 'passed' | 'failed' | 'warning' = 
        score >= 80 ? 'passed' : score >= 60 ? 'warning' : 'failed'
      
      console.log(`✓ Component analysis completed in ${duration}ms (Score: ${score}/100)`)
      
      return {
        category: 'components',
        status,
        score,
        tests,
        issues,
        recommendations,
      }
    } catch (error) {
      console.error('❌ Component analysis failed:', error)
      throw error
    }
  }

  /**
   * Run performance tests (placeholder for task 15)
   */
  async runPerformanceTests(): Promise<void> {
    console.log('\n⚡ Running performance tests...')
    // Placeholder - will be implemented in task 15
    console.log('✓ Performance tests completed')
  }

  /**
   * Run accessibility tests (placeholder for task 16)
   */
  async runAccessibilityTests(): Promise<void> {
    console.log('\n♿ Running accessibility tests...')
    // Placeholder - will be implemented in task 16
    console.log('✓ Accessibility tests completed')
  }

  /**
   * Get current audit results
   */
  getResults(): CategoryReport[] {
    return [...this.results]
  }

  /**
   * Clear all audit results
   */
  clearResults(): void {
    this.results = []
    this.startTime = new Date()
  }

  /**
   * Generate comprehensive audit report
   * Aggregates all results, calculates scores, and generates recommendations
   * 
   * @returns Complete audit report with all analysis
   */
  async generateReport(): Promise<AuditReport> {
    console.log('\n📊 Generating audit report...')
    
    const endTime = new Date()
    const duration = endTime.getTime() - this.startTime.getTime()

    // Calculate summary statistics
    const summary = this.calculateSummary()
    
    // Generate prioritized recommendations
    const recommendations = this.generateRecommendations()

    // Build complete report
    const report: AuditReport = {
      id: `audit-${Date.now()}`,
      timestamp: this.startTime,
      version: '1.0.0',
      summary,
      categories: this.results,
      recommendations,
      metadata: {
        duration,
        environment: process.env.NODE_ENV || 'development',
        databaseMode: process.env.DATABASE_MODE || 'local',
        nodeVersion: process.version,
        platform: process.platform,
        totalCategories: this.results.length,
        passedCategories: this.results.filter(r => r.status === 'passed').length,
        failedCategories: this.results.filter(r => r.status === 'failed').length,
        warningCategories: this.results.filter(r => r.status === 'warning').length,
      },
    }

    // Log summary
    this.logReportSummary(report)

    // Save report in configured formats
    await this.saveReport(report)
    
    // Display report to console if configured
    await this.displayReport(report)

    return report
  }

  /**
   * Log a summary of the report to console
   */
  private logReportSummary(report: AuditReport): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 AUDIT REPORT SUMMARY')
    console.log('='.repeat(60))
    console.log(`\n⏱️  Duration: ${(report.metadata.duration / 1000).toFixed(2)}s`)
    console.log(`📅 Timestamp: ${report.timestamp.toISOString()}`)
    console.log(`🔢 Overall Score: ${report.summary.overallScore}/100`)
    console.log(`\n📋 Tests:`)
    console.log(`   ✅ Passed: ${report.summary.passedTests}`)
    console.log(`   ❌ Failed: ${report.summary.failedTests}`)
    console.log(`   📊 Total: ${report.summary.totalTests}`)
    console.log(`\n⚠️  Issues:`)
    console.log(`   🔴 Critical: ${report.summary.criticalIssues}`)
    console.log(`   🟡 Warnings: ${report.summary.warningCount}`)
    console.log(`\n📂 Categories:`)
    console.log(`   ✅ Passed: ${report.metadata.passedCategories}`)
    console.log(`   ❌ Failed: ${report.metadata.failedCategories}`)
    console.log(`   ⚠️  Warning: ${report.metadata.warningCategories}`)
    console.log(`\n💡 Recommendations: ${report.recommendations.length}`)
    
    if (report.recommendations.length > 0) {
      const highPriority = report.recommendations.filter((r: Recommendation) => r.priority === 'high').length
      console.log(`   🔴 High Priority: ${highPriority}`)
    }
    
    console.log('\n' + '='.repeat(60) + '\n')
  }

  /**
   * Generate report from previously saved audit results
   * Useful for re-generating reports in different formats
   */
  async generateReportOnly(): Promise<void> {
    console.log('📊 Loading previous audit results...')
    
    const report = await this.getLatestReport()
    
    if (!report) {
      throw new Error('No previous audit results found')
    }

    console.log(`✓ Loaded report from ${report.timestamp.toISOString()}`)
    await this.displayReport(report)
  }

  /**
   * Compare two audit reports to show trends
   * Useful for tracking improvements or regressions over time
   */
  compareReports(oldReport: AuditReport, newReport: AuditReport): {
    scoreDelta: number
    testsDelta: number
    issuesDelta: number
    improved: string[]
    regressed: string[]
  } {
    const scoreDelta = newReport.summary.overallScore - oldReport.summary.overallScore
    const testsDelta = newReport.summary.passedTests - oldReport.summary.passedTests
    const issuesDelta = newReport.summary.criticalIssues - oldReport.summary.criticalIssues

    const improved: string[] = []
    const regressed: string[] = []

    // Compare category scores
    newReport.categories.forEach((newCat: CategoryReport) => {
      const oldCat = oldReport.categories.find((c: CategoryReport) => c.category === newCat.category)
      if (oldCat) {
        if (newCat.score > oldCat.score) {
          improved.push(newCat.category)
        } else if (newCat.score < oldCat.score) {
          regressed.push(newCat.category)
        }
      }
    })

    return {
      scoreDelta,
      testsDelta,
      issuesDelta,
      improved,
      regressed,
    }
  }

  /**
   * Calculate summary statistics from all audit results
   * Implements scoring algorithm based on test results and issues
   */
  private calculateSummary() {
    const totalTests = this.results.reduce((sum, cat) => sum + cat.tests.length, 0)
    const passedTests = this.results.reduce(
      (sum, cat) => sum + cat.tests.filter((t: TestResult) => t.passed).length,
      0
    )
    const failedTests = totalTests - passedTests
    
    // Count warnings (medium and low severity issues)
    const warningCount = this.results.reduce(
      (sum, cat) => sum + (cat.issues?.filter((i: Issue) => i.severity === 'medium' || i.severity === 'low').length || 0),
      0
    )
    
    // Count critical issues (critical and high severity)
    const criticalIssues = this.results.reduce(
      (sum, cat) => sum + (cat.issues?.filter((i: Issue) => i.severity === 'critical' || i.severity === 'high').length || 0),
      0
    )

    // Calculate overall score
    // If no tests, use average of category scores
    let overallScore: number
    if (totalTests > 0) {
      // Base score on test pass rate
      const testScore = Math.round((passedTests / totalTests) * 100)
      
      // Apply penalties for issues
      const criticalPenalty = criticalIssues * 5
      const warningPenalty = warningCount * 2
      
      overallScore = Math.max(0, testScore - criticalPenalty - warningPenalty)
    } else {
      // Use average category score
      const avgCategoryScore = this.results.length > 0
        ? Math.round(this.results.reduce((sum, cat) => sum + cat.score, 0) / this.results.length)
        : 0
      overallScore = avgCategoryScore
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      warningCount,
      overallScore,
      criticalIssues,
    }
  }

  /**
   * Generate prioritized recommendations from audit results
   * Groups and prioritizes recommendations by impact and effort
   */
  private generateRecommendations(): Recommendation[] {
    const recommendations: Recommendation[] = []
    
    // Process each category's recommendations
    this.results.forEach(categoryReport => {
      if (!categoryReport.recommendations || categoryReport.recommendations.length === 0) {
        return
      }

      categoryReport.recommendations.forEach((recText: string) => {
        // Determine priority based on category status and issues
        let priority: 'high' | 'medium' | 'low' = 'medium'
        let effort: 'small' | 'medium' | 'large' = 'medium'
        let impact: 'high' | 'medium' | 'low' = 'medium'

        // High priority for failed categories with critical issues
        if (categoryReport.status === 'failed') {
          priority = 'high'
          impact = 'high'
        } else if (categoryReport.status === 'warning') {
          priority = 'medium'
          impact = 'medium'
        } else {
          priority = 'low'
          impact = 'low'
        }

        // Estimate effort based on category complexity
        const complexCategories = ['collaboration', 'offline', 'ai', 'components', 'security']
        if (complexCategories.includes(categoryReport.category)) {
          effort = 'large'
        } else if (categoryReport.score < 50) {
          effort = 'large'
        } else if (categoryReport.score < 80) {
          effort = 'medium'
        } else {
          effort = 'small'
        }

        recommendations.push({
          priority,
          category: categoryReport.category,
          title: recText,
          description: recText,
          effort,
          impact,
        })
      })
    })

    // Sort by priority (high -> medium -> low) and then by impact
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    
    recommendations.sort((a: Recommendation, b: Recommendation) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return impactOrder[a.impact] - impactOrder[b.impact]
    })

    return recommendations
  }

  /**
   * Save audit report in configured formats
   * Handles file system operations with error recovery
   */
  private async saveReport(report: AuditReport): Promise<void> {
    const outputDir = auditConfig.reporting.outputDir
    
    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true })
      console.log(`📁 Output directory: ${outputDir}`)

      const timestamp = report.timestamp.toISOString().replace(/[:.]/g, '-')
      
      // Save in configured formats
      const savedFiles: string[] = []
      
      for (const format of auditConfig.reporting.formats) {
        try {
          switch (format) {
            case 'json':
              await new JsonReporter().generate(report, outputDir, timestamp)
              savedFiles.push(`${outputDir}/audit-report-${timestamp}.json`)
              break
            case 'html':
              await new HtmlReporter().generate(report, outputDir, timestamp)
              savedFiles.push(`${outputDir}/audit-report-${timestamp}.html`)
              break
            case 'console':
              // Console output is handled separately
              break
          }
        } catch (error) {
          console.error(`❌ Failed to generate ${format} report:`, error)
          // Continue with other formats
        }
      }

      if (savedFiles.length > 0) {
        console.log('\n✅ Reports saved:')
        savedFiles.forEach(file => console.log(`   📄 ${file}`))
      }
      
    } catch (error) {
      console.error('❌ Failed to save reports:', error)
      throw error
    }
  }

  /**
   * Display report to console if configured
   */
  private async displayReport(report: AuditReport): Promise<void> {
    if (auditConfig.reporting.formats.includes('console')) {
      try {
        await new ConsoleReporter().generate(report)
      } catch (error) {
        console.error('❌ Failed to display console report:', error)
        // Don't throw - console display is not critical
      }
    }
  }

  /**
   * Load and aggregate results from multiple report files
   * Useful for trend analysis across multiple audit runs
   */
  async aggregateReports(reportPaths: string[]): Promise<AuditReport[]> {
    const reports: AuditReport[] = []
    
    for (const reportPath of reportPaths) {
      try {
        const data = await fs.readFile(reportPath, 'utf-8')
        const report = JSON.parse(data) as AuditReport
        reports.push(report)
      } catch (error) {
        console.error(`❌ Failed to load report ${reportPath}:`, error)
      }
    }
    
    return reports
  }

  /**
   * Get the most recent audit report from the output directory
   */
  async getLatestReport(): Promise<AuditReport | null> {
    try {
      const outputDir = auditConfig.reporting.outputDir
      const files = await fs.readdir(outputDir)
      const jsonFiles = files.filter(f => f.endsWith('.json') && f.startsWith('audit-report-'))
      
      if (jsonFiles.length === 0) {
        return null
      }

      // Sort by filename (which includes timestamp) and get the latest
      const latestFile = jsonFiles.sort().reverse()[0]
      const reportPath = path.join(outputDir, latestFile)
      
      const data = await fs.readFile(reportPath, 'utf-8')
      return JSON.parse(data) as AuditReport
      
    } catch (error) {
      console.error('❌ Failed to get latest report:', error)
      return null
    }
  }
}
