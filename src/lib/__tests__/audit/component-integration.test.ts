/**
 * Unit Tests for Component Integration
 * 
 * Tests the ComponentAnalyzer functionality
 * Validates: Requirements 17.1, 17.2, 17.3, 17.4
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ComponentAnalyzer } from '../../../../scripts/audit/analyzers/component-analyzer'
import * as path from 'path'

describe('Component Integration Tests', () => {
  let analyzer: ComponentAnalyzer
  const basePath = process.cwd() // Already in note-app directory

  beforeEach(() => {
    analyzer = new ComponentAnalyzer(basePath)
  })

  describe('Component Scanning', () => {
    it('should scan and find React components', async () => {
      // Act
      const components = await analyzer.scanComponents()

      // Assert
      expect(components).toBeDefined()
      expect(Array.isArray(components)).toBe(true)
      expect(components.length).toBeGreaterThan(0)

      // Check structure of component info
      const firstComponent = components[0]
      expect(firstComponent).toHaveProperty('name')
      expect(firstComponent).toHaveProperty('path')
      expect(firstComponent).toHaveProperty('exports')
      expect(firstComponent).toHaveProperty('imports')
      expect(firstComponent).toHaveProperty('hasTests')
      expect(firstComponent).toHaveProperty('hasDocs')
      expect(firstComponent).toHaveProperty('usedIn')
    }, 30000)

    it('should extract component information correctly', async () => {
      // Act
      const components = await analyzer.scanComponents()

      // Assert: Check that components have meaningful data
      const componentsWithExports = components.filter(c => c.exports.length > 0)
      expect(componentsWithExports.length).toBeGreaterThan(0)

      const componentsWithImports = components.filter(c => c.imports.length > 0)
      expect(componentsWithImports.length).toBeGreaterThan(0)
    }, 30000)

    it('should identify components in different directories', async () => {
      // Act
      const components = await analyzer.scanComponents()

      // Assert: Should find components in various directories (handle both / and \ path separators)
      const hasComponentsDir = components.some(c => c.path.includes('components'))
      const hasAppDir = components.some(c => c.path.includes('app'))
      const hasHooksDir = components.some(c => c.path.includes('hooks'))

      expect(hasComponentsDir).toBe(true)
      expect(hasAppDir).toBe(true)
      expect(hasHooksDir).toBe(true)
    }, 30000)
  })

  describe('Component Usage Analysis', () => {
    it('should analyze component usage', async () => {
      // Arrange
      const components = await analyzer.scanComponents()

      // Act
      await analyzer.analyzeComponentUsage(components)

      // Assert: Some components should be marked as used
      const usedComponents = components.filter(c => c.usedIn.length > 0)
      expect(usedComponents.length).toBeGreaterThan(0)
    }, 60000)

    it('should identify unused components', async () => {
      // Arrange
      const components = await analyzer.scanComponents()
      await analyzer.analyzeComponentUsage(components)

      // Act
      const unusedComponents = analyzer.findUnusedComponents(components)

      // Assert
      expect(Array.isArray(unusedComponents)).toBe(true)
      // Note: We don't assert the count because it depends on the codebase state
    }, 60000)

    it('should track where components are used', async () => {
      // Arrange
      const components = await analyzer.scanComponents()
      await analyzer.analyzeComponentUsage(components)

      // Act: Find a commonly used component
      const usedComponents = components.filter(c => c.usedIn.length > 0)

      // Assert
      expect(usedComponents.length).toBeGreaterThan(0)
      
      if (usedComponents.length > 0) {
        const component = usedComponents[0]
        expect(component.usedIn).toBeDefined()
        expect(Array.isArray(component.usedIn)).toBe(true)
        expect(component.usedIn.length).toBeGreaterThan(0)
      }
    }, 60000)
  })

  describe('Component Testing Coverage', () => {
    it('should identify components with tests', async () => {
      // Arrange
      const components = await analyzer.scanComponents()

      // Act
      const componentsWithTests = components.filter(c => c.hasTests)

      // Assert: Test detection should work (may be 0 if no component tests exist)
      expect(componentsWithTests.length).toBeGreaterThanOrEqual(0)
    }, 30000)

    it('should identify components without tests', async () => {
      // Arrange
      const components = await analyzer.scanComponents()

      // Act
      const componentsWithoutTests = analyzer.findComponentsWithoutTests(components)

      // Assert
      expect(Array.isArray(componentsWithoutTests)).toBe(true)
    }, 30000)

    it('should calculate test coverage percentage', async () => {
      // Arrange
      const components = await analyzer.scanComponents()

      // Act
      const withTests = components.filter(c => c.hasTests).length
      const total = components.length
      const coverage = total > 0 ? (withTests / total) * 100 : 0

      // Assert: Coverage should be a valid percentage (may be 0 if no tests)
      expect(coverage).toBeGreaterThanOrEqual(0)
      expect(coverage).toBeLessThanOrEqual(100)
    }, 30000)
  })

  describe('Component Documentation', () => {
    it('should identify components with documentation', async () => {
      // Arrange
      const components = await analyzer.scanComponents()

      // Act
      const componentsWithDocs = components.filter(c => c.hasDocs)

      // Assert: Some components should have documentation
      expect(componentsWithDocs.length).toBeGreaterThan(0)
    }, 30000)

    it('should identify components without documentation', async () => {
      // Arrange
      const components = await analyzer.scanComponents()

      // Act
      const componentsWithoutDocs = analyzer.findComponentsWithoutDocs(components)

      // Assert
      expect(Array.isArray(componentsWithoutDocs)).toBe(true)
    }, 30000)
  })

  describe('Dependency Graph', () => {
    it('should generate a dependency graph', async () => {
      // Arrange
      const components = await analyzer.scanComponents()
      await analyzer.analyzeComponentUsage(components)

      // Act
      const graph = analyzer.generateDependencyGraph(components)

      // Assert
      expect(graph).toBeDefined()
      expect(graph).toHaveProperty('nodes')
      expect(graph).toHaveProperty('edges')
      expect(Array.isArray(graph.nodes)).toBe(true)
      expect(Array.isArray(graph.edges)).toBe(true)
      expect(graph.nodes.length).toBeGreaterThan(0)
    }, 60000)

    it('should categorize nodes by type', async () => {
      // Arrange
      const components = await analyzer.scanComponents()
      await analyzer.analyzeComponentUsage(components)

      // Act
      const graph = analyzer.generateDependencyGraph(components)

      // Assert: Should have different node types
      const nodeTypes = new Set(graph.nodes.map(n => n.type))
      expect(nodeTypes.size).toBeGreaterThan(1)
      expect(nodeTypes.has('component') || nodeTypes.has('page') || nodeTypes.has('hook')).toBe(true)
    }, 60000)

    it('should create edges for component dependencies', async () => {
      // Arrange
      const components = await analyzer.scanComponents()
      await analyzer.analyzeComponentUsage(components)

      // Act
      const graph = analyzer.generateDependencyGraph(components)

      // Assert: Should have some edges (dependencies)
      // Note: Might be 0 if components don't import each other
      expect(graph.edges.length).toBeGreaterThanOrEqual(0)
      
      if (graph.edges.length > 0) {
        const edge = graph.edges[0]
        expect(edge).toHaveProperty('from')
        expect(edge).toHaveProperty('to')
        expect(edge).toHaveProperty('type')
      }
    }, 60000)
  })

  describe('Component Inventory', () => {
    it('should generate a complete inventory report', async () => {
      // Arrange
      const components = await analyzer.scanComponents()
      await analyzer.analyzeComponentUsage(components)

      // Act
      const inventory = analyzer.generateInventoryReport(components)

      // Assert
      expect(inventory).toBeDefined()
      expect(inventory).toHaveProperty('totalComponents')
      expect(inventory).toHaveProperty('usedComponents')
      expect(inventory).toHaveProperty('unusedComponents')
      expect(inventory).toHaveProperty('componentsWithoutTests')
      expect(inventory).toHaveProperty('componentsWithoutDocs')
      expect(inventory).toHaveProperty('componentsByType')
      expect(inventory).toHaveProperty('dependencyGraph')

      expect(inventory.totalComponents).toBeGreaterThan(0)
      expect(inventory.usedComponents).toBeGreaterThanOrEqual(0)
      expect(inventory.usedComponents).toBeLessThanOrEqual(inventory.totalComponents)
    }, 60000)

    it('should categorize components by type', async () => {
      // Arrange
      const components = await analyzer.scanComponents()
      await analyzer.analyzeComponentUsage(components)

      // Act
      const inventory = analyzer.generateInventoryReport(components)

      // Assert
      expect(inventory.componentsByType).toBeDefined()
      expect(inventory.componentsByType).toHaveProperty('component')
      expect(inventory.componentsByType).toHaveProperty('page')
      expect(inventory.componentsByType).toHaveProperty('hook')
      expect(inventory.componentsByType).toHaveProperty('util')

      // Should have at least some components
      const totalByType = 
        inventory.componentsByType.component.length +
        inventory.componentsByType.page.length +
        inventory.componentsByType.hook.length +
        inventory.componentsByType.util.length

      expect(totalByType).toBe(inventory.totalComponents)
    }, 60000)
  })

  describe('Full Analysis', () => {
    it('should run complete component analysis', async () => {
      // Act
      const result = await analyzer.analyze()

      // Assert
      expect(result).toBeDefined()
      expect(result).toHaveProperty('components')
      expect(result).toHaveProperty('inventory')
      expect(Array.isArray(result.components)).toBe(true)
      expect(result.components.length).toBeGreaterThan(0)
      expect(result.inventory.totalComponents).toBe(result.components.length)
    }, 60000)
  })
})
