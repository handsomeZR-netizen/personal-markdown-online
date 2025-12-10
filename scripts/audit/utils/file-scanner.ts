/**
 * File Scanner Utility
 * 
 * Scans the file system for components, pages, and other code files
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { auditConfig } from '../config/audit-config'

export class FileScanner {
  /**
   * Scan directories for files matching patterns
   */
  async scanFiles(
    basePath: string,
    extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']
  ): Promise<string[]> {
    const files: string[] = []
    
    for (const scanPath of auditConfig.components.scanPaths) {
      // Normalize the path to avoid doubling
      const fullPath = path.resolve(basePath, scanPath)
      
      try {
        const foundFiles = await this.scanDirectory(fullPath, extensions)
        files.push(...foundFiles)
      } catch (error) {
        // Silently skip directories that don't exist
        // console.warn(`Warning: Could not scan ${fullPath}`)
      }
    }
    
    return files
  }

  /**
   * Recursively scan a directory
   */
  private async scanDirectory(
    dirPath: string,
    extensions: string[]
  ): Promise<string[]> {
    const files: string[] = []
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        
        // Skip excluded patterns
        if (this.shouldExclude(fullPath)) {
          continue
        }
        
        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath, extensions)
          files.push(...subFiles)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name)
          if (extensions.includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
      console.warn(`Warning: Could not read directory ${dirPath}`)
    }
    
    return files
  }

  /**
   * Check if a path should be excluded
   */
  private shouldExclude(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/')
    
    return auditConfig.components.excludePatterns.some(pattern => {
      const regex = this.globToRegex(pattern)
      return regex.test(normalizedPath)
    })
  }

  /**
   * Convert glob pattern to regex
   */
  private globToRegex(pattern: string): RegExp {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
    
    return new RegExp(regexPattern)
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8')
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}
