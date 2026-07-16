// components/intelligence/paginator.tsx
// Version: 1.0.0 — 2026-07-16
// Scope: Paginație avansată reutilizabilă — |« < 1 2 3 [input] ... 30 > »|

'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface PaginatorProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

export function Paginator({
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: PaginatorProps) {
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (totalPages <= 1 && !pageSizeOptions) return null

  const goTo = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p))
    onPageChange(clamped)
  }

  const handleInputSubmit = () => {
    const n = parseInt(inputVal)
    if (!isNaN(n)) goTo(n)
    setInputVal('')
    inputRef.current?.blur()
  }

  // Generează lista de pagini vizibile (max 5 numere + ellipsis)
  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = []
    const left = Math.max(2, page - 1)
    const right = Math.min(totalPages - 1, page + 1)
    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Navigație pagini */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* |« Prima */}
        <Button size="sm" variant="outline" className="px-2 h-8" disabled={page === 1} onClick={() => goTo(1)} title="Prima pagină">
          «
        </Button>
        {/* < Anterior */}
        <Button size="sm" variant="outline" className="px-2 h-8" disabled={page === 1} onClick={() => goTo(page - 1)} title="Pagina anterioară">
          ‹
        </Button>

        {/* Numere pagini */}
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
          ) : (
            <Button
              key={p}
              size="sm"
              variant={p === page ? 'default' : 'outline'}
              className="px-2.5 h-8 min-w-[32px]"
              onClick={() => goTo(p as number)}
            >
              {p}
            </Button>
          )
        )}

        {/* Input manual pagină */}
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={totalPages}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleInputSubmit() }}
            onBlur={handleInputSubmit}
            placeholder="…"
            className="w-12 h-8 border rounded px-1 text-sm text-center bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            title="Introdu numărul paginii"
          />
        </div>

        {/* > Următor */}
        <Button size="sm" variant="outline" className="px-2 h-8" disabled={page === totalPages} onClick={() => goTo(page + 1)} title="Pagina următoare">
          ›
        </Button>
        {/* »| Ultima */}
        <Button size="sm" variant="outline" className="px-2 h-8" disabled={page === totalPages} onClick={() => goTo(totalPages)} title="Ultima pagină">
          »
        </Button>
      </div>

      {/* Afișează N / pagină */}
      {pageSizeOptions && onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Afișează:</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="border rounded px-1 py-0.5 text-sm bg-background"
          >
            {pageSizeOptions.map(n => (
              <option key={n} value={n}>{n} / pagină</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
