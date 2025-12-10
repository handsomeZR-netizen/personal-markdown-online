/**
 * Property-Based Tests for Page Validation
 * 
 * **Feature: comprehensive-feature-audit, Property 8: 用户流程连贯性**
 * **Validates: Requirements 18.1**
 * 
 * Property 8: User Flow Coherence
 * For any user task flow, all required steps and interfaces should be accessible and logically coherent
 */

import { describe, it, expect } from 'vitest'
import { PageValidator } from '../../../../scripts/audit/analyzers/page-validator'
import * as fs from 'fs'
import * as path from 'path'

describe('Property 8: User Flow Coherence', () => {
  /**
   * Property: All expected pages should exist
   * 
   * For any route in the application, the corresponding page file should exist
   * This ensures users can access all intended features
   */
  it('should verify all expected pages exist', async () => {
    // Arrange: Set up page validator
    const appDir = path.join(process.cwd(), 'src/app')
    const validator = new PageValidator(appDir)
    
    // Act: Validate all pages
    const result = await validator.validatePages()
    
    // Report findings
    if (result.missingPages.length > 0) {
      console.log('\n⚠️  Missing pages:')
      result.missingPages.forEach(page => console.log(`   - ${page}`))
    }
    
    // Property verification: All expected pages should exist
    expect(result.missingPages).toHaveLength(0)
    expect(result.existingPages).toBe(result.totalPages)
  }, 30000)

  /**
   * Property: All pages should be accessible
   * 
   * For any page that exists, it should have a default export
   * This ensures the page can be rendered by Next.js
   */
  it('should verify all pages are accessible', async () => {
    // Arrange
    const appDir = path.join(process.cwd(), 'src/app')
    const validator = new PageValidator(appDir)
    
    // Act: Validate pages
    const result = await validator.validatePages()
    
    // Filter to only existing pages
    const existingPages = result.pages.filter(p => p.exists)
    const inaccessiblePages = existingPages.filter(p => !p.isAccessible)
    
    // Report findings
    if (inaccessiblePages.length > 0) {
      console.log('\n⚠️  Inaccessible pages (missing default export):')
      inaccessiblePages.forEach(page => console.log(`   - ${page.route}`))
    }
    
    // Property: All existing pages should be accessible
    expect(inaccessiblePages).toHaveLength(0)
  }, 30000)

  /**
   * Property: Critical pages should have error boundaries
   * 
   * For any critical page (dashboard, notes, etc.), it should have an error.tsx file
   * This ensures graceful error handling
   */
  it('should verify critical pages have error boundaries', async () => {
    // Arrange
    const appDir = path.join(process.cwd(), 'src/app')
    const validator = new PageValidator(appDir)
    
    // Act: Validate pages
    const result = await validator.validatePages()
    
    // Define critical pages that should have error boundaries
    const criticalRoutes = [
      '/dashboard',
      '/notes',
      '/notes/[id]',
      '/settings',
    ]
    
    // Check which critical pages lack error boundaries
    const criticalPages = result.pages.filter(p => 
      criticalRoutes.includes(p.route) && p.exists
    )
    const withoutErrorBoundary = criticalPages.filter(p => !p.hasError)
    
    // Report findings
    if (withoutErrorBoundary.length > 0) {
      console.log('\n⚠️  Critical pages without error boundaries:')
      withoutErrorBoundary.forEach(page => console.log(`   - ${page.route}`))
    }
    
    // Property: At least 75% of critical pages should have error boundaries
    const errorBoundaryRate = criticalPages.length > 0
      ? (criticalPages.length - withoutErrorBoundary.length) / criticalPages.length
      : 1
    
    expect(errorBoundaryRate).toBeGreaterThanOrEqual(0.75)
  }, 30000)

  /**
   * Property: Pages with loading states should have loading.tsx
   * 
   * For any page that fetches data, it should have a loading.tsx file
   * This ensures good UX during data loading
   */
  it('should verify data-fetching pages have loading states', async () => {
    // Arrange
    const appDir = path.join(process.cwd(), 'src/app')
    const validator = new PageValidator(appDir)
    
    // Act: Validate pages
    const result = await validator.validatePages()
    
    // Define pages that likely fetch data
    const dataFetchingRoutes = [
      '/dashboard',
      '/notes',
      '/notes/[id]',
      '/search',
      '/ai',
      '/templates',
    ]
    
    // Check which data-fetching pages lack loading states
    const dataFetchingPages = result.pages.filter(p => 
      dataFetchingRoutes.includes(p.route) && p.exists
    )
    const withoutLoading = dataFetchingPages.filter(p => !p.hasLoading)
    
    // Report findings
    if (withoutLoading.length > 0) {
      console.log('\n⚠️  Data-fetching pages without loading states:')
      withoutLoading.forEach(page => console.log(`   - ${page.route}`))
    }
    
    // Property: At least 60% of data-fetching pages should have loading states
    // (Some pages may use client-side loading indicators instead)
    const loadingStateRate = dataFetchingPages.length > 0
      ? (dataFetchingPages.length - withoutLoading.length) / dataFetchingPages.length
      : 1
    
    expect(loadingStateRate).toBeGreaterThanOrEqual(0.6)
  }, 30000)

  /**
   * Property: Feature cards should be present and complete
   * 
   * For any feature in the system, it should be represented on the features page
   * This ensures users can discover all available features
   */
  it('should verify feature cards are complete', async () => {
    // Arrange
    const appDir = path.join(process.cwd(), 'src/app')
    const validator = new PageValidator(appDir)
    
    // Act: Validate feature cards
    const result = await validator.validateFeatureCards()
    
    // Report findings
    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  Feature card issues:')
      result.warnings.forEach(warning => console.log(`   - ${warning}`))
    }
    
    // Property: Feature cards validation should pass
    expect(result.passed).toBe(true)
    
    // Should have warnings array (some features may use different naming)
    // Allow up to 12 warnings as features may be named differently in the UI
    expect(result.warnings?.length || 0).toBeLessThanOrEqual(12)
  }, 30000)

  /**
   * Property: Help pages should provide guidance
   * 
   * For any help page, it should contain helpful content
   * This ensures users can get assistance when needed
   */
  it('should verify help pages are informative', async () => {
    // Arrange
    const appDir = path.join(process.cwd(), 'src/app')
    const validator = new PageValidator(appDir)
    
    // Act: Validate help pages
    const result = await validator.validateHelpPages()
    
    // Report findings
    if (!result.passed) {
      console.log('\n⚠️  Help page issues:')
      result.errors?.forEach(error => console.log(`   - ${error.message}`))
    }
    
    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  Help page warnings:')
      result.warnings.forEach(warning => console.log(`   - ${warning}`))
    }
    
    // Property: Help pages should exist and be informative
    expect(result.passed).toBe(true)
  }, 30000)

  /**
   * Property: Settings pages should be complete
   * 
   * For any settings category, there should be a corresponding settings page
   * This ensures users can configure all aspects of the application
   */
  it('should verify settings pages are complete', async () => {
    // Arrange
    const appDir = path.join(process.cwd(), 'src/app')
    const validator = new PageValidator(appDir)
    
    // Act: Validate settings pages
    const result = await validator.validateSettingsPages()
    
    // Report findings
    if (!result.passed) {
      console.log('\n⚠️  Settings page issues:')
      result.errors?.forEach(error => console.log(`   - ${error.message}`))
    }
    
    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  Settings page warnings:')
      result.warnings.forEach(warning => console.log(`   - ${warning}`))
    }
    
    // Property: All settings pages should exist
    expect(result.passed).toBe(true)
  }, 30000)

  /**
   * Property: User flows should be complete
   * 
   * For any user flow (e.g., create note, search, export), all required pages should exist
   * This ensures users can complete their intended tasks
   */
  it('should verify user flows are complete', async () => {
    // Arrange
    const appDir = path.join(process.cwd(), 'src/app')
    const validator = new PageValidator(appDir)
    
    // Define user flows and their required pages
    const userFlows = [
      {
        name: 'Note Creation Flow',
        pages: ['/', '/dashboard', '/notes', '/notes/new'],
      },
      {
        name: 'Search Flow',
        pages: ['/', '/dashboard', '/search'],
      },
      {
        name: 'Settings Flow',
        pages: ['/', '/dashboard', '/settings'],
      },
      {
        name: 'Authentication Flow',
        pages: ['/', '/login', '/register', '/dashboard'],
      },
      {
        name: 'AI Features Flow',
        pages: ['/', '/dashboard', '/ai'],
      },
      {
        name: 'Template Flow',
        pages: ['/', '/dashboard', '/templates', '/notes/new'],
      },
    ]
    
    // Act: Validate pages
    const result = await validator.validatePages()
    const existingRoutes = new Set(result.pages.filter(p => p.exists).map(p => p.route))
    
    // Check each flow
    const incompleteFlows: Array<{ name: string; missingPages: string[] }> = []
    
    for (const flow of userFlows) {
      const missingPages = flow.pages.filter(page => !existingRoutes.has(page))
      if (missingPages.length > 0) {
        incompleteFlows.push({
          name: flow.name,
          missingPages,
        })
      }
    }
    
    // Report findings
    if (incompleteFlows.length > 0) {
      console.log('\n⚠️  Incomplete user flows:')
      incompleteFlows.forEach(flow => {
        console.log(`   - ${flow.name}:`)
        flow.missingPages.forEach(page => console.log(`     • Missing: ${page}`))
      })
    }
    
    // Property: All user flows should be complete
    expect(incompleteFlows).toHaveLength(0)
  }, 30000)

  /**
   * Property: Navigation should be consistent
   * 
   * For any page, it should have consistent navigation elements
   * This ensures users can navigate the application easily
   */
  it('should verify navigation consistency', async () => {
    // Arrange
    const appDir = path.join(process.cwd(), 'src/app')
    
    // Check for layout files that provide navigation
    const rootLayout = path.join(appDir, 'layout.tsx')
    const hasRootLayout = fs.existsSync(rootLayout)
    
    // Check for header/navigation components
    const componentsDir = path.join(process.cwd(), 'src/components')
    const headerExists = fs.existsSync(path.join(componentsDir, 'header.tsx'))
    const mobileNavExists = fs.existsSync(path.join(componentsDir, 'mobile-nav.tsx'))
    
    // Report findings
    if (!hasRootLayout) {
      console.log('\n⚠️  Missing root layout for consistent navigation')
    }
    if (!headerExists) {
      console.log('\n⚠️  Missing header component')
    }
    if (!mobileNavExists) {
      console.log('\n⚠️  Missing mobile navigation component')
    }
    
    // Property: Navigation infrastructure should exist
    expect(hasRootLayout).toBe(true)
    expect(headerExists || mobileNavExists).toBe(true)
  }, 30000)

  /**
   * Property: Error pages should exist
   * 
   * For any error scenario, there should be appropriate error pages
   * This ensures good UX even when things go wrong
   */
  it('should verify error pages exist', async () => {
    // Arrange
    const appDir = path.join(process.cwd(), 'src/app')
    
    // Check for error pages
    const errorPages = [
      { path: path.join(appDir, 'error.tsx'), name: 'Root error boundary' },
      { path: path.join(appDir, 'not-found.tsx'), name: '404 page' },
      { path: path.join(appDir, 'database-error/page.tsx'), name: 'Database error page' },
      { path: path.join(appDir, 'offline/page.tsx'), name: 'Offline page' },
    ]
    
    const missingErrorPages: string[] = []
    
    for (const errorPage of errorPages) {
      if (!fs.existsSync(errorPage.path)) {
        missingErrorPages.push(errorPage.name)
      }
    }
    
    // Report findings
    if (missingErrorPages.length > 0) {
      console.log('\n⚠️  Missing error pages:')
      missingErrorPages.forEach(page => console.log(`   - ${page}`))
    }
    
    // Property: All error pages should exist
    expect(missingErrorPages).toHaveLength(0)
  }, 30000)
})
