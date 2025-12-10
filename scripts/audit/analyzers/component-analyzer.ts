/**
 * Component Analyzer
 * 
 * Scans the codebase to:
 * - Find all React components
 * - Identify component usage
 * - Build dependency graphs
 * - Detect unused components
 * - Generate component inventory
 */

import * as path from 'path'
import { FileScanner } from '../utils/file-scanner'
import { AstParser } from '../utils/ast-parser'
import { ComponentInfo, DependencyGraph, GraphNode, GraphEdge } from '../types'

/**
 * Component inventory report type
 */
export interface ComponentInventory {
  totalComponents: number
  usedComponents: number
  unusedComponents: string[]
  componentsWithoutTests: string[]
  componentsWithoutDocs: string[]
  componentsByType: Record<string, ComponentInfo[]>
  dependencyGraph: DependencyGraph
}

export class ComponentAnalyzer {
  private fileScanner: FileScanner
  private astParser: AstParser
  private basePath: string
  private componentCache: Map<string, ComponentInfo> = new Map()

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath
    this.fileScanner = new FileScanner()
    this.astParser = new AstParser()
  }

  /**
   * Scan all components in the codebase
   * Implements requirement 17.1: Check component directory
   */
  async scanComponents(): Promise<ComponentInfo[]> {
    console.log('🔍 Scanning components...')
    
    // Clear cache
    this.componentCache.clear()

    // Scan for all component files
    const files = await this.fileScanner.scanFiles(this.basePath)
    console.log(`   Found ${files.length} files to analyze`)

    const components: ComponentInfo[] = []
    let componentCount = 0

    for (const filePath of files) {
      try {
        const content = await this.fileScanner.readFile(filePath)
        
        // Check if this is a React component
        if (this.astParser.isReactComponent(content)) {
          const componentInfo = await this.analyzeComponent(filePath, content)
          components.push(componentInfo)
          this.componentCache.set(filePath, componentInfo)
          componentCount++
        }
      } catch (error) {
        console.warn(`   ⚠️  Could not analyze ${filePath}:`, error)
      }
    }

    console.log(`   ✓ Found ${componentCount} React components`)
    return components
  }

  /**
   * Analyze a single component file
   */
  private async analyzeComponent(
    filePath: string,
    content: string
  ): Promise<ComponentInfo> {
    const relativePath = path.relative(this.basePath, filePath)
    const name = this.astParser.extractComponentName(filePath)
    const exports = this.astParser.extractExports(content, filePath)
    const imports = this.astParser.extractImports(content)

    // Check for tests
    const hasTests = await this.hasTestFile(filePath)

    // Check for documentation
    const hasDocs = this.hasDocumentation(content)

    return {
      name,
      path: relativePath,
      usedIn: [], // Will be populated in usage analysis
      exports,
      imports,
      hasTests,
      hasDocs,
    }
  }

  /**
   * Check if a component has a test file
   */
  private async hasTestFile(componentPath: string): Promise<boolean> {
    const dir = path.dirname(componentPath)
    const basename = path.basename(componentPath, path.extname(componentPath))
    
    // Check for common test file patterns
    const testPatterns = [
      path.join(dir, `${basename}.test.ts`),
      path.join(dir, `${basename}.test.tsx`),
      path.join(dir, `${basename}.spec.ts`),
      path.join(dir, `${basename}.spec.tsx`),
      path.join(dir, '__tests__', `${basename}.test.ts`),
      path.join(dir, '__tests__', `${basename}.test.tsx`),
    ]

    for (const testPath of testPatterns) {
      const fullPath = path.join(this.basePath, testPath)
      if (await this.fileScanner.fileExists(fullPath)) {
        return true
      }
    }

    return false
  }

  /**
   * Check if a component has documentation
   */
  private hasDocumentation(content: string): boolean {
    // Check for JSDoc comments
    const hasJsDoc = /\/\*\*[\s\S]*?\*\//.test(content)
    
    // Check for component description comments
    const hasDescription = /\/\*\*[\s\S]*?@description[\s\S]*?\*\//.test(content)
    
    return hasJsDoc || hasDescription
  }

  /**
   * Analyze component usage across the codebase
   * Implements requirement 17.2: Check component usage
   */
  async analyzeComponentUsage(components: ComponentInfo[]): Promise<ComponentInfo[]> {
    console.log('\n🔗 Analyzing component usage...')
    
    // Get all files (not just components)
    const allFiles = await this.fileScanner.scanFiles(this.basePath)
    
    // Build a map of component names to their info
    const componentMap = new Map<string, ComponentInfo>()
    components.forEach(comp => {
      comp.exports.forEach(exportName => {
        componentMap.set(exportName, comp)
      })
    })

    // Scan all files for component usage
    for (const filePath of allFiles) {
      try {
        const content = await this.fileScanner.readFile(filePath)
        const relativePath = path.relative(this.basePath, filePath)
        
        // Check which components are used in this file
        for (const [componentName, componentInfo] of componentMap) {
          if (this.isComponentUsedInFile(content, componentName, componentInfo.path, relativePath)) {
            if (!componentInfo.usedIn.includes(relativePath)) {
              componentInfo.usedIn.push(relativePath)
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    const usedCount = components.filter(c => c.usedIn.length > 0).length
    const unusedCount = components.length - usedCount
    
    console.log(`   ✓ ${usedCount} components are used`)
    console.log(`   ⚠️  ${unusedCount} components appear unused`)

    return components
  }

  /**
   * Check if a component is used in a file
   */
  private isComponentUsedInFile(
    content: string,
    componentName: string,
    componentPath: string,
    filePath: string
  ): boolean {
    // Don't count usage in the component's own file
    if (componentPath === filePath) {
      return false
    }

    // Check for import statement
    const importPattern = new RegExp(
      `import\\s+(?:{[^}]*\\b${componentName}\\b[^}]*}|${componentName})\\s+from`,
      'g'
    )
    if (importPattern.test(content)) {
      return true
    }

    // Check for JSX usage
    const jsxPattern = new RegExp(`<${componentName}[\\s/>]`, 'g')
    if (jsxPattern.test(content)) {
      return true
    }

    return false
  }

  /**
   * Find components that are not used anywhere
   * Implements requirement 17.2: Confirm each component is used
   */
  findUnusedComponents(components: ComponentInfo[]): string[] {
    console.log('\n🔍 Finding unused components...')
    
    const unused = components
      .filter(comp => comp.usedIn.length === 0)
      .map(comp => comp.path)

    if (unused.length > 0) {
      console.log(`   ⚠️  Found ${unused.length} unused components:`)
      unused.forEach(path => console.log(`      - ${path}`))
    } else {
      console.log(`   ✓ All components are used`)
    }

    return unused
  }

  /**
   * Find components that lack tests
   * Implements requirement 17.4: Check component tests
   */
  findComponentsWithoutTests(components: ComponentInfo[]): string[] {
    console.log('\n🧪 Finding components without tests...')
    
    const withoutTests = components
      .filter(comp => !comp.hasTests)
      .map(comp => comp.path)

    if (withoutTests.length > 0) {
      console.log(`   ⚠️  Found ${withoutTests.length} components without tests:`)
      withoutTests.slice(0, 10).forEach(path => console.log(`      - ${path}`))
      if (withoutTests.length > 10) {
        console.log(`      ... and ${withoutTests.length - 10} more`)
      }
    } else {
      console.log(`   ✓ All components have tests`)
    }

    return withoutTests
  }

  /**
   * Find components that lack documentation
   * Implements requirement 17.3: Check component documentation
   */
  findComponentsWithoutDocs(components: ComponentInfo[]): string[] {
    console.log('\n📝 Finding components without documentation...')
    
    const withoutDocs = components
      .filter(comp => !comp.hasDocs)
      .map(comp => comp.path)

    if (withoutDocs.length > 0) {
      console.log(`   ⚠️  Found ${withoutDocs.length} components without documentation:`)
      withoutDocs.slice(0, 10).forEach(path => console.log(`      - ${path}`))
      if (withoutDocs.length > 10) {
        console.log(`      ... and ${withoutDocs.length - 10} more`)
      }
    } else {
      console.log(`   ✓ All components have documentation`)
    }

    return withoutDocs
  }

  /**
   * Generate a dependency graph of components
   * Shows which components depend on which
   */
  generateDependencyGraph(components: ComponentInfo[]): DependencyGraph {
    console.log('\n📊 Generating dependency graph...')
    
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    // Create nodes for all components
    components.forEach(comp => {
      const type = this.determineComponentType(comp.path)
      nodes.push({
        id: comp.path,
        label: comp.name,
        type,
      })
    })

    // Create edges based on imports
    components.forEach(comp => {
      comp.imports.forEach(importPath => {
        // Find if this import is one of our components
        const importedComp = components.find(c => 
          importPath.includes(c.path.replace(/\.(tsx?|jsx?)$/, ''))
        )

        if (importedComp) {
          edges.push({
            from: comp.path,
            to: importedComp.path,
            type: 'imports',
          })
        }
      })
    })

    console.log(`   ✓ Generated graph with ${nodes.length} nodes and ${edges.length} edges`)

    return { nodes, edges }
  }

  /**
   * Determine the type of a component based on its path
   */
  private determineComponentType(filePath: string): 'component' | 'page' | 'hook' | 'util' {
    if (filePath.includes('/app/') || filePath.includes('/pages/')) {
      return 'page'
    } else if (filePath.includes('/hooks/') || filePath.includes('use-')) {
      return 'hook'
    } else if (filePath.includes('/lib/') || filePath.includes('/utils/')) {
      return 'util'
    } else {
      return 'component'
    }
  }

  /**
   * Generate a comprehensive component inventory report
   */
  generateInventoryReport(components: ComponentInfo[]): ComponentInventory {
    console.log('\n📋 Generating component inventory...')

    const unusedComponents = this.findUnusedComponents(components)
    const componentsWithoutTests = this.findComponentsWithoutTests(components)
    const componentsWithoutDocs = this.findComponentsWithoutDocs(components)
    const dependencyGraph = this.generateDependencyGraph(components)

    // Group components by type
    const componentsByType: Record<string, ComponentInfo[]> = {
      component: [],
      page: [],
      hook: [],
      util: [],
    }

    components.forEach(comp => {
      const type = this.determineComponentType(comp.path)
      componentsByType[type].push(comp)
    })

    const report = {
      totalComponents: components.length,
      usedComponents: components.filter(c => c.usedIn.length > 0).length,
      unusedComponents,
      componentsWithoutTests,
      componentsWithoutDocs,
      componentsByType,
      dependencyGraph,
    }

    console.log('\n📊 Inventory Summary:')
    console.log(`   Total Components: ${report.totalComponents}`)
    console.log(`   Used: ${report.usedComponents}`)
    console.log(`   Unused: ${report.unusedComponents.length}`)
    console.log(`   Without Tests: ${report.componentsWithoutTests.length}`)
    console.log(`   Without Docs: ${report.componentsWithoutDocs.length}`)
    console.log(`\n   By Type:`)
    console.log(`   - Components: ${componentsByType.component.length}`)
    console.log(`   - Pages: ${componentsByType.page.length}`)
    console.log(`   - Hooks: ${componentsByType.hook.length}`)
    console.log(`   - Utils: ${componentsByType.util.length}`)

    return report
  }

  /**
   * Run complete component analysis
   * Main entry point for component analysis
   */
  async analyze(): Promise<{
    components: ComponentInfo[]
    inventory: ComponentInventory
  }> {
    console.log('\n🧩 Starting Component Analysis\n')
    console.log('='.repeat(60))

    // Step 1: Scan all components
    const components = await this.scanComponents()

    // Step 2: Analyze usage
    await this.analyzeComponentUsage(components)

    // Step 3: Generate inventory
    const inventory = this.generateInventoryReport(components)

    console.log('\n' + '='.repeat(60))
    console.log('✅ Component Analysis Complete\n')

    return {
      components,
      inventory,
    }
  }
}
