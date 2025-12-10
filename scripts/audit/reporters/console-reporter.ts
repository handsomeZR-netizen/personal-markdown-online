/**
 * Console Reporter - Displays audit results in the terminal
 */

import { AuditReport } from '../types'

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

export class ConsoleReporter {
  async generate(report: AuditReport): Promise<void> {
    console.log('\n' + '='.repeat(80))
    console.log(colors.bold + colors.cyan + '  COMPREHENSIVE FEATURE AUDIT REPORT' + colors.reset)
    console.log('='.repeat(80) + '\n')

    this.printSummary(report)
    this.printCategories(report)
    this.printRecommendations(report)
    this.printMetadata(report)
  }

  private printSummary(report: AuditReport): void {
    const { summary } = report

    console.log(colors.bold + '📊 SUMMARY' + colors.reset)
    console.log('─'.repeat(80))
    
    const scoreColor = this.getScoreColor(summary.overallScore)
    console.log(`Overall Score: ${scoreColor}${summary.overallScore}%${colors.reset}`)
    console.log(`Total Tests: ${summary.totalTests}`)
    console.log(`Passed: ${colors.green}${summary.passedTests}${colors.reset}`)
    console.log(`Failed: ${colors.red}${summary.failedTests}${colors.reset}`)
    console.log(`Warnings: ${colors.yellow}${summary.warningCount}${colors.reset}`)
    console.log(`Critical Issues: ${colors.red}${colors.bold}${summary.criticalIssues}${colors.reset}`)
    console.log()
  }

  private printCategories(report: AuditReport): void {
    console.log(colors.bold + '📋 CATEGORIES' + colors.reset)
    console.log('─'.repeat(80))

    for (const category of report.categories) {
      const statusIcon = this.getStatusIcon(category.status)
      const scoreColor = this.getScoreColor(category.score)
      
      console.log(
        `${statusIcon} ${category.category.padEnd(20)} ` +
        `Score: ${scoreColor}${category.score}%${colors.reset} ` +
        `Tests: ${category.tests.length} ` +
        `Issues: ${category.issues.length}`
      )
    }
    console.log()
  }

  private printRecommendations(report: AuditReport): void {
    if (report.recommendations.length === 0) {
      return
    }

    console.log(colors.bold + '💡 RECOMMENDATIONS' + colors.reset)
    console.log('─'.repeat(80))

    const highPriority = report.recommendations.filter(r => r.priority === 'high')
    const mediumPriority = report.recommendations.filter(r => r.priority === 'medium')
    const lowPriority = report.recommendations.filter(r => r.priority === 'low')

    if (highPriority.length > 0) {
      console.log(colors.red + colors.bold + 'High Priority:' + colors.reset)
      highPriority.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec.title}`)
      })
    }

    if (mediumPriority.length > 0) {
      console.log(colors.yellow + colors.bold + 'Medium Priority:' + colors.reset)
      mediumPriority.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec.title}`)
      })
    }

    if (lowPriority.length > 0) {
      console.log(colors.gray + colors.bold + 'Low Priority:' + colors.reset)
      lowPriority.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec.title}`)
      })
    }
    console.log()
  }

  private printMetadata(report: AuditReport): void {
    console.log(colors.bold + 'ℹ️  METADATA' + colors.reset)
    console.log('─'.repeat(80))
    console.log(`Audit ID: ${report.id}`)
    console.log(`Timestamp: ${report.timestamp.toISOString()}`)
    console.log(`Duration: ${this.formatDuration(report.metadata.duration)}`)
    console.log(`Environment: ${report.metadata.environment}`)
    console.log(`Database Mode: ${report.metadata.databaseMode}`)
    console.log()
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'passed':
        return colors.green + '✓' + colors.reset
      case 'failed':
        return colors.red + '✗' + colors.reset
      case 'warning':
        return colors.yellow + '⚠' + colors.reset
      default:
        return '○'
    }
  }

  private getScoreColor(score: number): string {
    if (score >= 90) return colors.green
    if (score >= 70) return colors.yellow
    return colors.red
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${seconds}s`
  }
}
