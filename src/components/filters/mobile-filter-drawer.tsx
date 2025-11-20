"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Filter } from "lucide-react"
import { t } from "@/lib/i18n"
import { FilterPanel } from "./filter-panel"

interface MobileFilterDrawerProps {
  tags: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
}

/**
 * 移动端筛选抽屉组件
 * Mobile filter drawer component
 */
export function MobileFilterDrawer({ tags, categories }: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full md:hidden min-h-[44px]"
          aria-label={t('common.filter')}
        >
          <Filter className="mr-2 h-4 w-4" />
          {t('common.filter')}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('common.filter')}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterPanel tags={tags} categories={categories} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
