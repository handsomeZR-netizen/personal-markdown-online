'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, User, FileText } from 'lucide-react'

/**
 * 所有权筛选组件
 * 筛选我的笔记、共享给我的笔记、或全部
 */
export function OwnershipFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentFilter = searchParams.get('ownership') || 'all'

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('ownership')
    } else {
      params.set('ownership', value)
    }
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">笔记来源</Label>
      <Select value={currentFilter} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="选择笔记来源" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>全部笔记</span>
            </div>
          </SelectItem>
          <SelectItem value="mine">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>我的笔记</span>
            </div>
          </SelectItem>
          <SelectItem value="shared">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>共享给我的</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
