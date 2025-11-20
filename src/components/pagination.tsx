"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { t } from "@/lib/i18n"

type PaginationProps = {
    currentPage: number
    totalPages: number
    baseUrl?: string
}

export function Pagination({ currentPage, totalPages, baseUrl = "/notes" }: PaginationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const createPageUrl = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", page.toString())
        return `${baseUrl}?${params.toString()}`
    }

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return
        router.push(createPageUrl(page))
    }

    // 生成页码数组
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisible = 5

        if (totalPages <= maxVisible) {
            // 如果总页数小于等于最大可见数，显示所有页码
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // 总是显示第一页
            pages.push(1)

            if (currentPage > 3) {
                pages.push("...")
            }

            // 显示当前页附近的页码
            const start = Math.max(2, currentPage - 1)
            const end = Math.min(totalPages - 1, currentPage + 1)

            for (let i = start; i <= end; i++) {
                pages.push(i)
            }

            if (currentPage < totalPages - 2) {
                pages.push("...")
            }

            // 总是显示最后一页
            if (totalPages > 1) {
                pages.push(totalPages)
            }
        }

        return pages
    }

    if (totalPages <= 1) return null

    return (
        <nav className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-8" aria-label="分页导航">
            <div className="flex items-center gap-2">
                {/* 首页 */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    title={t('pagination.firstPage')}
                    aria-label={t('pagination.firstPage')}
                    className="min-h-[44px] min-w-[44px]"
                >
                    <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
                </Button>

                {/* 上一页 */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    title={t('pagination.previousPage')}
                    aria-label={t('pagination.previousPage')}
                    className="min-h-[44px] min-w-[44px]"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>

                {/* 页码 */}
                <div className="flex items-center gap-1" role="list">
                    {getPageNumbers().map((page, index) => {
                        if (page === "...") {
                            return (
                                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground" aria-hidden="true">
                                    ...
                                </span>
                            )
                        }

                        return (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="icon"
                                onClick={() => goToPage(page as number)}
                                className="min-h-[44px] min-w-[44px]"
                                aria-label={`第 ${page} 页`}
                                aria-current={currentPage === page ? "page" : undefined}
                            >
                                {page}
                            </Button>
                        )
                    })}
                </div>

                {/* 下一页 */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title={t('pagination.nextPage')}
                    aria-label={t('pagination.nextPage')}
                    className="min-h-[44px] min-w-[44px]"
                >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>

                {/* 末页 */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title={t('pagination.lastPage')}
                    aria-label={t('pagination.lastPage')}
                    className="min-h-[44px] min-w-[44px]"
                >
                    <ChevronsRight className="h-4 w-4" aria-hidden="true" />
                </Button>
            </div>

            {/* 页码信息 */}
            <span className="text-sm text-muted-foreground whitespace-nowrap" aria-live="polite" aria-atomic="true">
                {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages} {t('pagination.pages')}
            </span>
        </nav>
    )
}
