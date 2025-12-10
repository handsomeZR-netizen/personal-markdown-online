/**
 * JSON Reporter - Exports audit results as JSON
 */

import { AuditReport } from '../types'
import * as fs from 'fs/promises'
import * as path from 'path'

export class JsonReporter {
  async generate(
    report: AuditReport,
    outputDir: string,
    timestamp: string
  ): Promise<void> {
    const filename = `audit-report-${timestamp}.json`
    const filepath = path.join(outputDir, filename)

    const jsonData = JSON.stringify(report, null, 2)
    await fs.writeFile(filepath, jsonData, 'utf-8')

    console.log(`📄 JSON report saved: ${filepath}`)
  }
}
