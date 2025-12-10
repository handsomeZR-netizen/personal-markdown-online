/**
 * Metrics Calculator Utility
 * 
 * Calculates various metrics for the audit report
 */

import { CategoryReport, AuditSummary } from '../types'

export class MetricsCalculator {
  /**
   * Calculate overall score from category reports
   */
  calculateOverallScore(categories: CategoryReport[]): number {
    if (categories.length === 0) return 100
    
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0)
    return Math.round(totalScore / categories.length)
  }

  /**
   * Calculate test statistics
   */
  calculateTestStats(categories: CategoryReport[]): {
    total: number
    passed: number
    failed: number
  } {
    const total = categories.reduce((sum, cat) => sum + cat.tests.length, 0)
    const passed = categories.reduce(
      (sum, cat) => sum + cat.tests.filter(t => t.passed).length,
      0
    )
    const failed = total - passed
    
    return { total, passed, failed }
  }

  /**
   * Calculate issue counts by severity
   */
  calculateIssueCounts(categories: CategoryReport[]): {
    critical: number
    high: number
    medium: number
    low: number
  } {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }
    
    for (const category of categories) {
      for (const issue of category.issues) {
        counts[issue.severity]++
      }
    }
    
    return counts
  }

  /**
   * Calculate category score based on test results
   */
  calculateCategoryScore(
    passedTests: number,
    totalTests: number,
    criticalIssues: number
  ): number {
    if (totalTests === 0) return 100
    
    const baseScore = (passedTests / totalTests) * 100
    const penalty = criticalIssues * 10 // 10 points per critical issue
    
    return Math.max(0, Math.round(baseScore - penalty))
  }

  /**
   * Determine category status based on score and issues
   */
  determineCategoryStatus(
    score: number,
    criticalIssues: number
  ): 'passed' | 'failed' | 'warning' {
    if (criticalIssues > 0 || score < 50) return 'failed'
    if (score < 80) return 'warning'
    return 'passed'
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(
    actualTime: number,
    threshold: number
  ): number {
    if (actualTime <= threshold) return 100
    
    const ratio = actualTime / threshold
    const score = Math.max(0, 100 - (ratio - 1) * 50)
    
    return Math.round(score)
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    return `${minutes}m ${remainingSeconds}s`
  }

  /**
   * Calculate percentage
   */
  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }
}
