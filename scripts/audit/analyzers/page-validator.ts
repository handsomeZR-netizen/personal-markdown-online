/**
 * Page Validator
 * 
 * Validates page existence, accessibility, and functionality
 * Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5
 */

import * as fs from 'fs'
import * as path from 'path'
import type { TestResult, Issue } from '../types'

export interface PageInfo {
  route: string
  filePath: string
  exists: boolean
  isAccessible: boolean
  hasLayout: boolean
  hasLoading: boolean
  hasError: boolean
  exports: string[]
}

export interface PageValidationResult {
  totalPages: number
  existingPages: number
  missingPages: string[]
  inaccessiblePages: string[]
  pages: PageInfo[]
  issues: Issue[]
}

export class PageValidator {
  private appDir: string
  private expectedRoutes: string[]

  constructor(appDir: string = 'note-app/src/app') {
    this.appDir = appDir
    this.expectedRoutes = [
      '/',
      '/dashboard',
      '/notes',
      '/notes/new',
      '/notes/[id]',
      '/login',
      '/register',
      '/search',
      '/settings',
      '/settings/storage',
      '/settings/webhooks',
      '/settings/offline',
      '/settings/cache',
      '/settings/pwa',
      '/ai',
      '/features',
      '/help',
      '/help/offline',
      '/templates',
      '/public/[slug]',
      '/offline',
      '/database-error',
    ]
  }

  /**
   * Validate all pages
   */
  async validatePages(): Promise<PageValidationResult> {
    const pages: PageInfo[] = []
    const missingPages: string[] = []
    const inaccessiblePages: string[] = []
    const issues: Issue[] = []

    for (const route of this.expectedRoutes) {
      const pageInfo = await this.validatePage(route)
      pages.push(pageInfo)

      if (!pageInfo.exists) {
        missingPages.push(route)
        issues.push({
          severity: 'high',
          category: 'pages',
          title: `Missing page: ${route}`,
          description: `Expected page file not found for route ${route}`,
          location: this.getPagePath(route),
          suggestion: `Create page.tsx file at ${this.getPagePath(route)}`,
        })
      }

      if (!pageInfo.isAccessible) {
        inaccessiblePages.push(route)
        issues.push({
          severity: 'medium',
          category: 'pages',
          title: `Inaccessible page: ${route}`,
          description: `Page ${route} may not be accessible to users`,
          location: pageInfo.filePath,
          suggestion: 'Ensure page is properly exported and has no blocking errors',
        })
      }
    }

    return {
      totalPages: this.expectedRoutes.length,
      existingPages: pages.filter(p => p.exists).length,
      missingPages,
      inaccessiblePages,
      pages,
      issues,
    }
  }

  /**
   * Validate a single page
   */
  private async validatePage(route: string): Promise<PageInfo> {
    const pagePath = this.getPagePath(route)
    const exists = fs.existsSync(pagePath)

    if (!exists) {
      return {
        route,
        filePath: pagePath,
        exists: false,
        isAccessible: false,
        hasLayout: false,
        hasLoading: false,
        hasError: false,
        exports: [],
      }
    }

    const content = fs.readFileSync(pagePath, 'utf-8')
    const exports = this.extractExports(content)
    const hasDefaultExport = exports.includes('default')

    // Check for related files
    const dir = path.dirname(pagePath)
    const hasLayout = fs.existsSync(path.join(dir, 'layout.tsx'))
    const hasLoading = fs.existsSync(path.join(dir, 'loading.tsx'))
    const hasError = fs.existsSync(path.join(dir, 'error.tsx'))

    return {
      route,
      filePath: pagePath,
      exists: true,
      isAccessible: hasDefaultExport,
      hasLayout,
      hasLoading,
      hasError,
      exports,
    }
  }

  /**
   * Get the file path for a route
   */
  private getPagePath(route: string): string {
    // Convert route to file path
    let filePath = route === '/' ? '/page.tsx' : `${route}/page.tsx`
    return path.join(this.appDir, filePath)
  }

  /**
   * Extract exports from file content
   */
  private extractExports(content: string): string[] {
    const exports: string[] = []
    
    // Match default export
    if (/export\s+default/.test(content)) {
      exports.push('default')
    }

    // Match named exports
    const namedExportRegex = /export\s+(?:const|function|class)\s+(\w+)/g
    let match
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1])
    }

    return exports
  }

  /**
   * Validate feature cards on features page
   */
  async validateFeatureCards(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: Error[] = []
    const warnings: string[] = []

    try {
      const featuresPagePath = path.join(this.appDir, 'features/page.tsx')
      
      if (!fs.existsSync(featuresPagePath)) {
        errors.push(new Error('Features page not found'))
        return {
          passed: false,
          category: 'pages',
          testName: 'Feature Cards Validation',
          duration: Date.now() - startTime,
          errors,
          warnings,
        }
      }

      const content = fs.readFileSync(featuresPagePath, 'utf-8')

      // Check for feature cards
      const expectedFeatures = [
        'Core Note Management',
        'Organization',
        'Search',
        'Collaboration',
        'Offline',
        'AI Features',
        'Mobile',
        'Export',
        'Media',
        'Settings',
        'Templates',
        'Version History',
      ]

      for (const feature of expectedFeatures) {
        if (!content.includes(feature)) {
          warnings.push(`Feature card missing or not visible: ${feature}`)
        }
      }

      return {
        passed: errors.length === 0,
        category: 'pages',
        testName: 'Feature Cards Validation',
        duration: Date.now() - startTime,
        errors,
        warnings,
      }
    } catch (error) {
      errors.push(error as Error)
      return {
        passed: false,
        category: 'pages',
        testName: 'Feature Cards Validation',
        duration: Date.now() - startTime,
        errors,
        warnings,
      }
    }
  }

  /**
   * Validate help pages
   */
  async validateHelpPages(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: Error[] = []
    const warnings: string[] = []

    try {
      const helpPages = [
        'help/page.tsx',
        'help/offline/page.tsx',
      ]

      for (const helpPage of helpPages) {
        const helpPagePath = path.join(this.appDir, helpPage)
        
        if (!fs.existsSync(helpPagePath)) {
          errors.push(new Error(`Help page not found: ${helpPage}`))
          continue
        }

        const content = fs.readFileSync(helpPagePath, 'utf-8')

        // Check for help content
        if (!content.includes('help') && !content.includes('guide')) {
          warnings.push(`Help page may be missing content: ${helpPage}`)
        }
      }

      return {
        passed: errors.length === 0,
        category: 'pages',
        testName: 'Help Pages Validation',
        duration: Date.now() - startTime,
        errors,
        warnings,
      }
    } catch (error) {
      errors.push(error as Error)
      return {
        passed: false,
        category: 'pages',
        testName: 'Help Pages Validation',
        duration: Date.now() - startTime,
        errors,
        warnings,
      }
    }
  }

  /**
   * Validate settings pages
   */
  async validateSettingsPages(): Promise<TestResult> {
    const startTime = Date.now()
    const errors: Error[] = []
    const warnings: string[] = []

    try {
      const settingsPages = [
        'settings/page.tsx',
        'settings/storage/page.tsx',
        'settings/webhooks/page.tsx',
        'settings/offline/page.tsx',
        'settings/cache/page.tsx',
        'settings/pwa/page.tsx',
      ]

      for (const settingsPage of settingsPages) {
        const settingsPagePath = path.join(this.appDir, settingsPage)
        
        if (!fs.existsSync(settingsPagePath)) {
          errors.push(new Error(`Settings page not found: ${settingsPage}`))
          continue
        }

        const content = fs.readFileSync(settingsPagePath, 'utf-8')

        // Check for settings content
        if (!content.includes('settings') && !content.includes('config')) {
          warnings.push(`Settings page may be missing content: ${settingsPage}`)
        }
      }

      return {
        passed: errors.length === 0,
        category: 'pages',
        testName: 'Settings Pages Validation',
        duration: Date.now() - startTime,
        errors,
        warnings,
      }
    } catch (error) {
      errors.push(error as Error)
      return {
        passed: false,
        category: 'pages',
        testName: 'Settings Pages Validation',
        duration: Date.now() - startTime,
        errors,
        warnings,
      }
    }
  }

  /**
   * Run all page validations
   */
  async runAllValidations(): Promise<TestResult[]> {
    const results: TestResult[] = []

    // Validate page existence
    const pageValidation = await this.validatePages()
    results.push({
      passed: pageValidation.missingPages.length === 0,
      category: 'pages',
      testName: 'Page Existence Check',
      duration: 0,
      errors: pageValidation.missingPages.map(p => new Error(`Missing page: ${p}`)),
      warnings: pageValidation.inaccessiblePages.map(p => `Inaccessible page: ${p}`),
    })

    // Validate feature cards
    results.push(await this.validateFeatureCards())

    // Validate help pages
    results.push(await this.validateHelpPages())

    // Validate settings pages
    results.push(await this.validateSettingsPages())

    return results
  }
}
