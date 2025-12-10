/**
 * AST Parser Utility
 * 
 * Parses TypeScript/JavaScript files to extract component information
 */

export class AstParser {
  /**
   * Extract component exports from a file
   */
  extractExports(content: string, filePath: string): string[] {
    const exports: string[] = []
    
    // Match export declarations
    const exportPatterns = [
      /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
      /export\s+\{\s*([^}]+)\s*\}/g,
      /export\s+default\s+(\w+)/g,
    ]
    
    for (const pattern of exportPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
          // Handle multiple exports in braces
          if (match[1].includes(',')) {
            const names = match[1].split(',').map(n => n.trim())
            exports.push(...names)
          } else {
            exports.push(match[1].trim())
          }
        }
      }
    }
    
    return [...new Set(exports)] // Remove duplicates
  }

  /**
   * Extract import statements from a file
   */
  extractImports(content: string): string[] {
    const imports: string[] = []
    
    // Match import statements
    const importPattern = /import\s+(?:{[^}]+}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g
    
    let match
    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[1])
    }
    
    return imports
  }

  /**
   * Check if file is a React component
   */
  isReactComponent(content: string): boolean {
    // Check for React imports
    const hasReactImport = /import\s+.*\s+from\s+['"]react['"]/.test(content)
    
    // Check for JSX/TSX syntax
    const hasJsx = /<[A-Z]\w*/.test(content) || /<\/[A-Z]\w*>/.test(content)
    
    // Check for component patterns
    const hasComponentPattern = /(?:function|const|class)\s+[A-Z]\w*/.test(content)
    
    return hasReactImport && (hasJsx || hasComponentPattern)
  }

  /**
   * Check if file is a hook
   */
  isHook(content: string, filePath: string): boolean {
    const fileName = filePath.split('/').pop() || ''
    return fileName.startsWith('use-') || /export\s+(?:function|const)\s+use[A-Z]\w*/.test(content)
  }

  /**
   * Check if file is a utility
   */
  isUtility(content: string, filePath: string): boolean {
    const hasUtilPattern = /utils?|helpers?|lib/.test(filePath)
    const hasExportedFunctions = /export\s+(?:function|const)\s+\w+/.test(content)
    
    return hasUtilPattern && hasExportedFunctions
  }

  /**
   * Extract component name from file path
   */
  extractComponentName(filePath: string): string {
    const fileName = filePath.split('/').pop() || ''
    const nameWithoutExt = fileName.replace(/\.(tsx?|jsx?)$/, '')
    
    // Convert kebab-case to PascalCase
    return nameWithoutExt
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  }
}
