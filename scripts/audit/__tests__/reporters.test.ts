/**
 * Tests for audit reporters
 * Validates that all three reporters can generate reports correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { HtmlReporter } from '../reporters/html-reporter'
import { JsonReporter } from '../reporters/json-reporter'
import { ConsoleReporter } from '../reporters/console-reporter'
import { AuditReport } from '../types'
import * as fs from 'fs/promises'
import * as path from 'path'

describe('Audit Reporters', () => {
  const testOutputDir = './test-audit-reports'
  const testTimestamp = '2025-12-09T00-00-00-000Z'
  
  // Sample audit report for testing
  const sampleReport: AuditReport = {
    id: 'test-audit-123',
    timestamp: new Date('2025-12-09T00:00:00.000Z'),
    version: '1.0.0',
    summary: {
      totalTests: 100,
      passedTests: 85,
      failedTests: 10,
      warningCount: 5,
      overallScore: 85,
      criticalIssues: 2,
    },
    categories: [
      {
        category: 'core-features',
        status: 'passed',
        score: 90,
        tests: [
          {
            passed: true,
            category: 'core-features',
            testName: 'Note CRUD operations',
            duration: 150,
          },
        ],
        issues: [],
        recommendations: [],
      },
      {
        category: 'components',
        status: 'warning',
        score: 75,
        tests: [
          {
            passed: false,
            category: 'components',
            testName: 'All components used',
            duration: 200,
            warnings: ['3 unused components found'],
          },
        ],
        issues: [
          {
            severity: 'medium',
            category: 'components',
            title: 'Unused components',
            description: 'Found 3 components not used anywhere',
            suggestion: 'Review and remove or integrate',
          },
        ],
        recommendations: ['Remove unused components'],
      },
    ],
    recommendations: [
      {
        priority: 'high',
        category: 'security',
        title: 'Fix authentication issues',
        description: 'Authentication needs improvement',
        effort: 'medium',
        impact: 'high',
      },
      {
        priority: 'medium',
        category: 'components',
        title: 'Remove unused components',
        description: 'Clean up unused components',
        effort: 'small',
        impact: 'medium',
      },
    ],
    metadata: {
      duration: 5000,
      environment: 'test',
      databaseMode: 'local',
      nodeVersion: 'v18.0.0',
      platform: 'win32',
      totalCategories: 2,
      passedCategories: 1,
      failedCategories: 0,
      warningCategories: 1,
    },
  }

  beforeEach(async () => {
    // Create test output directory
    await fs.mkdir(testOutputDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test output directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('HtmlReporter', () => {
    it('should generate HTML report file', async () => {
      const reporter = new HtmlReporter()
      await reporter.generate(sampleReport, testOutputDir, testTimestamp)

      const expectedPath = path.join(testOutputDir, `audit-report-${testTimestamp}.html`)
      const fileExists = await fs.access(expectedPath).then(() => true).catch(() => false)
      
      expect(fileExists).toBe(true)
    })

    it('should generate valid HTML content', async () => {
      const reporter = new HtmlReporter()
      await reporter.generate(sampleReport, testOutputDir, testTimestamp)

      const expectedPath = path.join(testOutputDir, `audit-report-${testTimestamp}.html`)
      const content = await fs.readFile(expectedPath, 'utf-8')

      // Check for essential HTML elements
      expect(content).toContain('<!DOCTYPE html>')
      expect(content).toContain('<html')
      expect(content).toContain('Comprehensive Feature Audit')
      expect(content).toContain('Overall Score')
      expect(content).toContain('85%') // Overall score
      expect(content).toContain('Categories')
      expect(content).toContain('Recommendations')
    })

    it('should include all summary statistics', async () => {
      const reporter = new HtmlReporter()
      await reporter.generate(sampleReport, testOutputDir, testTimestamp)

      const expectedPath = path.join(testOutputDir, `audit-report-${testTimestamp}.html`)
      const content = await fs.readFile(expectedPath, 'utf-8')

      expect(content).toContain('100') // Total tests
      expect(content).toContain('85') // Passed tests
      expect(content).toContain('10') // Failed tests
      expect(content).toContain('5') // Warnings
      expect(content).toContain('2') // Critical issues
    })

    it('should include all categories', async () => {
      const reporter = new HtmlReporter()
      await reporter.generate(sampleReport, testOutputDir, testTimestamp)

      const expectedPath = path.join(testOutputDir, `audit-report-${testTimestamp}.html`)
      const content = await fs.readFile(expectedPath, 'utf-8')

      // HTML reporter converts hyphens to spaces in category names
      expect(content).toContain('core features')
      expect(content).toContain('components')
    })

    it('should include recommendations', async () => {
      const reporter = new HtmlReporter()
      await reporter.generate(sampleReport, testOutputDir, testTimestamp)

      const expectedPath = path.join(testOutputDir, `audit-report-${testTimestamp}.html`)
      const content = await fs.readFile(expectedPath, 'utf-8')

      expect(content).toContain('Fix authentication issues')
      expect(content).toContain('Remove unused components')
    })
  })

  describe('JsonReporter', () => {
    it('should generate JSON report file', async () => {
      const reporter = new JsonReporter()
      await reporter.generate(sampleReport, testOutputDir, testTimestamp)

      const expectedPath = path.join(testOutputDir, `audit-report-${testTimestamp}.json`)
      const fileExists = await fs.access(expectedPath).then(() => true).catch(() => false)
      
      expect(fileExists).toBe(true)
    })

    it('should generate valid JSON content', async () => {
      const reporter = new JsonReporter()
      await reporter.generate(sampleReport, testOutputDir, testTimestamp)

      const expectedPath = path.join(testOutputDir, `audit-report-${testTimestamp}.json`)
      const content = await fs.readFile(expectedPath, 'utf-8')
      
      // Should be valid JSON
      const parsed = JSON.parse(content)
      expect(parsed).toBeDefined()
    })

    it('should preserve all report data', async () => {
      const reporter = new JsonReporter()
      await reporter.generate(sampleReport, testOutputDir, testTimestamp)

      const expectedPath = path.join(testOutputDir, `audit-report-${testTimestamp}.json`)
      const content = await fs.readFile(expectedPath, 'utf-8')
      const parsed = JSON.parse(content) as AuditReport

      expect(parsed.id).toBe(sampleReport.id)
      expect(parsed.version).toBe(sampleReport.version)
      expect(parsed.summary.totalTests).toBe(sampleReport.summary.totalTests)
      expect(parsed.summary.overallScore).toBe(sampleReport.summary.overallScore)
      expect(parsed.categories.length).toBe(sampleReport.categories.length)
      expect(parsed.recommendations.length).toBe(sampleReport.recommendations.length)
    })

    it('should format JSON with proper indentation', async () => {
      const reporter = new JsonReporter()
      await reporter.generate(sampleReport, testOutputDir, testTimestamp)

      const expectedPath = path.join(testOutputDir, `audit-report-${testTimestamp}.json`)
      const content = await fs.readFile(expectedPath, 'utf-8')

      // Check for indentation (2 spaces)
      expect(content).toContain('  "id"')
      expect(content).toContain('  "summary"')
    })
  })

  describe('ConsoleReporter', () => {
    it('should generate console output without errors', async () => {
      const reporter = new ConsoleReporter()
      
      // Should not throw
      await expect(reporter.generate(sampleReport)).resolves.toBeUndefined()
    })

    it('should handle empty recommendations', async () => {
      const reportWithoutRecs: AuditReport = {
        ...sampleReport,
        recommendations: [],
      }

      const reporter = new ConsoleReporter()
      
      // Should not throw
      await expect(reporter.generate(reportWithoutRecs)).resolves.toBeUndefined()
    })

    it('should handle empty categories', async () => {
      const reportWithoutCats: AuditReport = {
        ...sampleReport,
        categories: [],
      }

      const reporter = new ConsoleReporter()
      
      // Should not throw
      await expect(reporter.generate(reportWithoutCats)).resolves.toBeUndefined()
    })
  })

  describe('Reporter Integration', () => {
    it('should generate all three report formats', async () => {
      const htmlReporter = new HtmlReporter()
      const jsonReporter = new JsonReporter()
      const consoleReporter = new ConsoleReporter()

      // Generate all reports
      await htmlReporter.generate(sampleReport, testOutputDir, testTimestamp)
      await jsonReporter.generate(sampleReport, testOutputDir, testTimestamp)
      await consoleReporter.generate(sampleReport)

      // Verify files exist
      const htmlPath = path.join(testOutputDir, `audit-report-${testTimestamp}.html`)
      const jsonPath = path.join(testOutputDir, `audit-report-${testTimestamp}.json`)

      const htmlExists = await fs.access(htmlPath).then(() => true).catch(() => false)
      const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false)

      expect(htmlExists).toBe(true)
      expect(jsonExists).toBe(true)
    })
  })
})
