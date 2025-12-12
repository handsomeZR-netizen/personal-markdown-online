import { z } from "zod"

/**
 * 服务端验证工具函数
 */

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> }

/**
 * 验证数据并返回结果
 * @param schema Zod schema
 * @param data 待验证的数据
 * @returns 验证结果
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data)
    
    if (!result.success) {
      const errors: Record<string, string[]> = {}
      
      result.error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      
      return {
        success: false,
        error: "验证失败，请检查输入数据",
        errors,
      }
    }
    
    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    return {
      success: false,
      error: "验证过程中发生错误",
    }
  }
}

/**
 * 清理和规范化字符串输入
 * @param input 输入字符串
 * @returns 清理后的字符串
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // 将多个空格替换为单个空格
    .replace(/[<>]/g, '') // 移除潜在的 HTML 标签字符
    .replace(/javascript:/gi, '') // 移除 javascript: 协议
    .replace(/on\w+\s*=/gi, '') // 移除事件处理器
}

/**
 * 验证 CUID/CUID2 格式
 * @param id CUID 字符串
 * @returns 是否有效
 */
export function isValidCuid(id: string): boolean {
  // CUID2 格式: 小写字母开头 + 字母数字，长度 21-32 字符
  // CUID 格式: c + 24个字符
  // 兼容两种格式
  if (!id || typeof id !== 'string') {
    return false
  }
  // CUID2: 以小写字母开头，只包含小写字母和数字，长度 21-32
  const cuid2Regex = /^[a-z][a-z0-9]{20,31}$/
  // 旧版 CUID: c + 24个字符
  const cuidRegex = /^c[a-z0-9]{24}$/
  return cuid2Regex.test(id) || cuidRegex.test(id)
}

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 批量验证 ID 数组
 * @param ids ID 数组
 * @returns 验证结果
 */
export function validateIds(ids: string[]): ValidationResult<string[]> {
  const invalidIds = ids.filter(id => !isValidCuid(id))
  
  if (invalidIds.length > 0) {
    return {
      success: false,
      error: `无效的ID: ${invalidIds.join(', ')}`,
    }
  }
  
  return {
    success: true,
    data: ids,
  }
}
