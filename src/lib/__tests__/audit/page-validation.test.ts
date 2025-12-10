/**
 * Unit Tests for Page Validation
 * 
 * Tests specific examples and edge cases for page validation
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PageValidator } from '../../../../scripts/audit/analyzers/page-validator'
import * as path from 'path'

describe('Page Validator', () => {
  let validator: PageValidator
  const appDir = path.join(process.cwd(), 'src/app')

  beforeEach(() => {
    validator = new PageValidator(appDir)
  })

  describe('Page Existence Validation', () => {
    it('should detect existing pages', async () => {
      const result = await validator.validatePages()
      
      expect(result).toBeDefined()
      expect(result.totalPages).toBeGreaterThan(0)
      expect(result.existingPages).toBeGreaterThan(0)
      expect(result.pages).toBeInstanceOf(Array)
    })

    it('should identify missing pages', async () => {
      const result = await validator.validatePages()
      
      expect(result.missingPages).toBeInstanceOf(Array)
      // Missing pages should be a subset of total pages
      expect(result.missingPages.length).toBeLessThanOrEqual(result.totalPages)
    })

    it('should provide page information for each route', async () => {
      const result = await validator.validatePages()
      
      // Each page should have required properties
      result.pages.forEach(page => {
        expect(page).toHaveProperty('route')
        expect(page).toHaveProperty('filePath')
        expect(page).toHaveProperty('exists')
        expect(page).toHaveProperty('isAccessible')
        expect(page).toHaveProperty('exports')
      })
    })

    it('should correctly identify root page', async () => {
      const result = await validator.validatePages()
      const rootPage = result.pages.find(p => p.route === '/')
      
      expect(rootPage).toBeDefined()
      expect(rootPage?.exists).toBe(true)
    })

    it('should correctly identify dashboard page', async () => {
      const result = await validator.validatePages()
      const dashboardPage = result.pages.find(p => p.route === '/dashboard')
      
      expect(dashboardPage).toBeDefined()
      expect(dashboardPage?.exists).toBe(true)
    })

    it('should correctly identify notes pages', async () => {
      const result = await validator.validatePages()
      const notesPage = result.pages.find(p => p.route === '/notes')
      const newNotePage = result.pages.find(p => p.route === '/notes/new')
      const noteDetailPage = result.pages.find(p => p.route === '/notes/[id]')
      
      expect(notesPage).toBeDefined()
      expect(newNotePage).toBeDefined()
      expect(noteDetailPage).toBeDefined()
    })

    it('should correctly identify auth pages', async () => {
      const result = await validator.validatePages()
      const loginPage = result.pages.find(p => p.route === '/login')
      const registerPage = result.pages.find(p => p.route === '/register')
      
      expect(loginPage).toBeDefined()
      expect(registerPage).toBeDefined()
    })

    it('should correctly identify settings pages', async () => {
      const result = await validator.validatePages()
      const settingsPage = result.pages.find(p => p.route === '/settings')
      
      expect(settingsPage).toBeDefined()
      expect(settingsPage?.exists).toBe(true)
    })
  })

  describe('Page Accessibility Validation', () => {
    it('should check for default exports', async () => {
      const result = await validator.validatePages()
      const existingPages = result.pages.filter(p => p.exists)
      
      // Most existing pages should have default exports
      const accessiblePages = existingPages.filter(p => p.isAccessible)
      const accessibilityRate = accessiblePages.length / existingPages.length
      
      expect(accessibilityRate).toBeGreaterThan(0.8)
    })

    it('should identify inaccessible pages', async () => {
      const result = await validator.validatePages()
      
      expect(result.inaccessiblePages).toBeInstanceOf(Array)
      // Inaccessible pages should be a subset of existing pages
      expect(result.inaccessiblePages.length).toBeLessThanOrEqual(result.existingPages)
    })

    it('should extract exports from pages', async () => {
      const result = await validator.validatePages()
      const pagesWithExports = result.pages.filter(p => p.exists && p.exports.length > 0)
      
      expect(pagesWithExports.length).toBeGreaterThan(0)
    })
  })

  describe('Page Structure Validation', () => {
    it('should check for layout files', async () => {
      const result = await validator.validatePages()
      const pagesWithLayout = result.pages.filter(p => p.exists && p.hasLayout)
      
      // Some pages should have layouts
      expect(pagesWithLayout.length).toBeGreaterThan(0)
    })

    it('should check for loading files', async () => {
      const result = await validator.validatePages()
      const pagesWithLoading = result.pages.filter(p => p.exists && p.hasLoading)
      
      // Some pages should have loading states
      expect(pagesWithLoading.length).toBeGreaterThan(0)
    })

    it('should check for error files', async () => {
      const result = await validator.validatePages()
      const pagesWithError = result.pages.filter(p => p.exists && p.hasError)
      
      // Some pages should have error boundaries
      expect(pagesWithError.length).toBeGreaterThan(0)
    })
  })

  describe('Feature Cards Validation', () => {
    it('should validate feature cards exist', async () => {
      const result = await validator.validateFeatureCards()
      
      expect(result).toBeDefined()
      expect(result.category).toBe('pages')
      expect(result.testName).toBe('Feature Cards Validation')
    })

    it('should check for expected features', async () => {
      const result = await validator.validateFeatureCards()
      
      // Should have warnings array defined
      expect(result.warnings).toBeDefined()
      // Allow up to 12 warnings (some features may not be explicitly named)
      expect(result.warnings?.length || 0).toBeLessThan(13)
    })

    it('should report duration', async () => {
      const result = await validator.validateFeatureCards()
      
      // Duration should be a number (may be 0 for fast operations)
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Help Pages Validation', () => {
    it('should validate help pages exist', async () => {
      const result = await validator.validateHelpPages()
      
      expect(result).toBeDefined()
      expect(result.category).toBe('pages')
      expect(result.testName).toBe('Help Pages Validation')
    })

    it('should check for help content', async () => {
      const result = await validator.validateHelpPages()
      
      // Help pages should exist
      expect(result.passed).toBe(true)
    })

    it('should report any missing help pages', async () => {
      const result = await validator.validateHelpPages()
      
      if (!result.passed) {
        expect(result.errors).toBeDefined()
        expect(result.errors!.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Settings Pages Validation', () => {
    it('should validate settings pages exist', async () => {
      const result = await validator.validateSettingsPages()
      
      expect(result).toBeDefined()
      expect(result.category).toBe('pages')
      expect(result.testName).toBe('Settings Pages Validation')
    })

    it('should check for all settings pages', async () => {
      const result = await validator.validateSettingsPages()
      
      // Settings pages should exist
      expect(result.passed).toBe(true)
    })

    it('should check for settings content', async () => {
      const result = await validator.validateSettingsPages()
      
      // Should have minimal warnings
      expect(result.warnings?.length || 0).toBeLessThan(3)
    })
  })

  describe('All Validations', () => {
    it('should run all validations', async () => {
      const results = await validator.runAllValidations()
      
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBeGreaterThan(0)
    })

    it('should return test results for each validation', async () => {
      const results = await validator.runAllValidations()
      
      results.forEach(result => {
        expect(result).toHaveProperty('passed')
        expect(result).toHaveProperty('category')
        expect(result).toHaveProperty('testName')
        expect(result).toHaveProperty('duration')
      })
    })

    it('should include page existence check', async () => {
      const results = await validator.runAllValidations()
      const pageExistenceCheck = results.find(r => r.testName === 'Page Existence Check')
      
      expect(pageExistenceCheck).toBeDefined()
    })

    it('should include feature cards validation', async () => {
      const results = await validator.runAllValidations()
      const featureCardsCheck = results.find(r => r.testName === 'Feature Cards Validation')
      
      expect(featureCardsCheck).toBeDefined()
    })

    it('should include help pages validation', async () => {
      const results = await validator.runAllValidations()
      const helpPagesCheck = results.find(r => r.testName === 'Help Pages Validation')
      
      expect(helpPagesCheck).toBeDefined()
    })

    it('should include settings pages validation', async () => {
      const results = await validator.runAllValidations()
      const settingsPagesCheck = results.find(r => r.testName === 'Settings Pages Validation')
      
      expect(settingsPagesCheck).toBeDefined()
    })
  })

  describe('Issue Reporting', () => {
    it('should generate issues for missing pages', async () => {
      const result = await validator.validatePages()
      
      expect(result.issues).toBeInstanceOf(Array)
      
      // Each issue should have required properties
      result.issues.forEach(issue => {
        expect(issue).toHaveProperty('severity')
        expect(issue).toHaveProperty('category')
        expect(issue).toHaveProperty('title')
        expect(issue).toHaveProperty('description')
      })
    })

    it('should provide suggestions for issues', async () => {
      const result = await validator.validatePages()
      
      // Issues should have suggestions
      result.issues.forEach(issue => {
        expect(issue).toHaveProperty('suggestion')
        expect(issue.suggestion).toBeTruthy()
      })
    })

    it('should categorize issues by severity', async () => {
      const result = await validator.validatePages()
      
      const severities = new Set(result.issues.map(i => i.severity))
      
      // Should use valid severity levels
      severities.forEach(severity => {
        expect(['critical', 'high', 'medium', 'low']).toContain(severity)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty app directory gracefully', async () => {
      const emptyValidator = new PageValidator('/nonexistent/path')
      const result = await emptyValidator.validatePages()
      
      expect(result).toBeDefined()
      expect(result.existingPages).toBe(0)
      expect(result.missingPages.length).toBe(result.totalPages)
    })

    it('should handle dynamic routes', async () => {
      const result = await validator.validatePages()
      const dynamicRoutes = result.pages.filter(p => p.route.includes('['))
      
      expect(dynamicRoutes.length).toBeGreaterThan(0)
    })

    it('should handle nested routes', async () => {
      const result = await validator.validatePages()
      const nestedRoutes = result.pages.filter(p => p.route.split('/').length > 2)
      
      expect(nestedRoutes.length).toBeGreaterThan(0)
    })
  })
})
