/**
 * Type definitions for the audit system
 */

export type AuditCategory =
  | 'core-features'
  | 'organization'
  | 'search'
  | 'collaboration'
  | 'offline'
  | 'ai'
  | 'mobile'
  | 'export'
  | 'media'
  | 'settings'
  | 'templates'
  | 'versions'
  | 'performance'
  | 'accessibility'
  | 'database'
  | 'errors'
  | 'components'
  | 'pages'
  | 'i18n'
  | 'security'

export interface AuditReport {
  id: string
  timestamp: Date
  version: string
  summary: AuditSummary
  categories: CategoryReport[]
  recommendations: Recommendation[]
  metadata: AuditMetadata
}

export interface AuditSummary {
  totalTests: number
  passedTests: number
  failedTests: number
  warningCount: number
  overallScore: number
  criticalIssues: number
}

export interface CategoryReport {
  category: AuditCategory
  status: 'passed' | 'failed' | 'warning'
  score: number
  tests: TestResult[]
  issues: Issue[]
  recommendations: string[]
}

export interface TestResult {
  passed: boolean
  category: string
  testName: string
  duration: number
  errors?: Error[]
  warnings?: string[]
}

export interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  location?: string
  suggestion?: string
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  effort: 'small' | 'medium' | 'large'
  impact: 'high' | 'medium' | 'low'
}

export interface AuditMetadata {
  duration: number
  environment: string
  databaseMode: string
  nodeVersion?: string
  platform?: string
  totalCategories?: number
  passedCategories?: number
  failedCategories?: number
  warningCategories?: number
}

export interface ComponentInfo {
  name: string
  path: string
  usedIn: string[]
  exports: string[]
  imports: string[]
  hasTests: boolean
  hasDocs: boolean
}

export interface DependencyGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphNode {
  id: string
  label: string
  type: 'component' | 'page' | 'hook' | 'util'
}

export interface GraphEdge {
  from: string
  to: string
  type: 'imports' | 'uses'
}

export interface FeatureCoverage {
  featureName: string
  requirementId: string
  implemented: boolean
  tested: boolean
  documented: boolean
  accessible: boolean
  performant: boolean
  components: string[]
  pages: string[]
  apis: string[]
  issues: Issue[]
}

export interface AccessibilityReport {
  violations: A11yViolation[]
  warnings: A11yWarning[]
  score: number
}

export interface A11yViolation {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  description: string
  help: string
  helpUrl: string
  nodes: A11yNode[]
}

export interface A11yWarning {
  id: string
  description: string
  nodes: A11yNode[]
}

export interface A11yNode {
  html: string
  target: string[]
  failureSummary: string
}

export interface PerformanceReport {
  metrics: PerformanceMetrics
  passed: boolean
  issues: Issue[]
}

export interface PerformanceMetrics {
  pageLoad: number
  apiResponse: number
  searchResponse: number
  renderTime: number
}
