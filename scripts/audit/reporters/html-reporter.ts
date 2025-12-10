/**
 * HTML Reporter - Generates interactive HTML audit report
 */

import { AuditReport } from '../types'
import * as fs from 'fs/promises'
import * as path from 'path'

export class HtmlReporter {
  async generate(
    report: AuditReport,
    outputDir: string,
    timestamp: string
  ): Promise<void> {
    const filename = `audit-report-${timestamp}.html`
    const filepath = path.join(outputDir, filename)

    const html = this.generateHtml(report)
    await fs.writeFile(filepath, html, 'utf-8')

    console.log(`📊 HTML report saved: ${filepath}`)
  }

  private generateHtml(report: AuditReport): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audit Report - ${report.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    
    header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    
    header p {
      opacity: 0.9;
      font-size: 1.1em;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f9fafb;
    }
    
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .summary-card h3 {
      font-size: 0.9em;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    
    .summary-card .value {
      font-size: 2.5em;
      font-weight: bold;
      color: #333;
    }
    
    .score-high { color: #10b981; }
    .score-medium { color: #f59e0b; }
    .score-low { color: #ef4444; }
    
    .section {
      padding: 40px;
      border-top: 1px solid #e5e7eb;
    }
    
    .section h2 {
      font-size: 1.8em;
      margin-bottom: 20px;
      color: #1f2937;
    }
    
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .category-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .category-card.passed { border-left-color: #10b981; }
    .category-card.failed { border-left-color: #ef4444; }
    .category-card.warning { border-left-color: #f59e0b; }
    
    .category-card h3 {
      font-size: 1.2em;
      margin-bottom: 10px;
      text-transform: capitalize;
    }
    
    .category-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      font-size: 0.9em;
      color: #666;
    }
    
    .recommendations {
      list-style: none;
    }
    
    .recommendation {
      background: #f9fafb;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 3px solid #667eea;
    }
    
    .recommendation.high { border-left-color: #ef4444; }
    .recommendation.medium { border-left-color: #f59e0b; }
    .recommendation.low { border-left-color: #6b7280; }
    
    .recommendation h4 {
      margin-bottom: 5px;
    }
    
    .recommendation .meta {
      font-size: 0.85em;
      color: #666;
      margin-top: 5px;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75em;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .badge.high { background: #fee2e2; color: #991b1b; }
    .badge.medium { background: #fef3c7; color: #92400e; }
    .badge.low { background: #e5e7eb; color: #374151; }
    
    footer {
      padding: 20px 40px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔍 Comprehensive Feature Audit</h1>
      <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
    </header>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Overall Score</h3>
        <div class="value ${this.getScoreClass(report.summary.overallScore)}">
          ${report.summary.overallScore}%
        </div>
      </div>
      <div class="summary-card">
        <h3>Total Tests</h3>
        <div class="value">${report.summary.totalTests}</div>
      </div>
      <div class="summary-card">
        <h3>Passed</h3>
        <div class="value score-high">${report.summary.passedTests}</div>
      </div>
      <div class="summary-card">
        <h3>Failed</h3>
        <div class="value score-low">${report.summary.failedTests}</div>
      </div>
      <div class="summary-card">
        <h3>Warnings</h3>
        <div class="value score-medium">${report.summary.warningCount}</div>
      </div>
      <div class="summary-card">
        <h3>Critical Issues</h3>
        <div class="value score-low">${report.summary.criticalIssues}</div>
      </div>
    </div>
    
    <div class="section">
      <h2>📋 Categories</h2>
      <div class="category-grid">
        ${report.categories.map(cat => `
          <div class="category-card ${cat.status}">
            <h3>${cat.category.replace(/-/g, ' ')}</h3>
            <div class="category-stats">
              <span>Score: <strong class="${this.getScoreClass(cat.score)}">${cat.score}%</strong></span>
              <span>Tests: ${cat.tests.length}</span>
              <span>Issues: ${cat.issues.length}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    ${report.recommendations.length > 0 ? `
      <div class="section">
        <h2>💡 Recommendations</h2>
        <ul class="recommendations">
          ${report.recommendations.map(rec => `
            <li class="recommendation ${rec.priority}">
              <h4>${rec.title}</h4>
              <p>${rec.description}</p>
              <div class="meta">
                <span class="badge ${rec.priority}">${rec.priority} priority</span>
                <span class="badge ${rec.effort}">${rec.effort} effort</span>
                <span class="badge ${rec.impact}">${rec.impact} impact</span>
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    ` : ''}
    
    <footer>
      <p>Audit ID: ${report.id} | Version: ${report.version}</p>
      <p>Environment: ${report.metadata.environment} | Database Mode: ${report.metadata.databaseMode}</p>
      <p>Duration: ${this.formatDuration(report.metadata.duration)}</p>
    </footer>
  </div>
</body>
</html>`
  }

  private getScoreClass(score: number): string {
    if (score >= 90) return 'score-high'
    if (score >= 70) return 'score-medium'
    return 'score-low'
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
