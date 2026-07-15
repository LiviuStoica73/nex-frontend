// components/intelligence/autopilot-tab.tsx
// Version: 5.1.0 — 2026-07-15
// Scope: Vizualizare oportunități publicate din Intelligence în Calendar, cu paginație

'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { listOpportunities, countOpportunities } from '@/lib/api/intelligence'
import type { ContentOpportunity } from '@/lib/api/intelligence'

const PAGE_SIZE = 12

interface AutopilotTabProps {
  orgId: string
  token: string
}

export function AutopilotTab({ orgId, token }: AutopilotTabProps) {
  const [items, setItems] = useState<ContentOpportunity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    if (!orgId || !token) return
    setLoading(true)
    Promise.all([
      listOpportunities(orgId, token, page, PAGE_SIZE, 'published'),
      countOpportunities(orgId, token, 'published'),
    ])
      .then(([res, countRes]: [any, any]) => {
        setItems(Array.isArray(res) ? res : (res.items ?? []))
        setTotal(countRes?.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orgId, token, page])

  if (loading) {
    return <div className="text-sm text-muted-foreground p-4 text-center">Se încarcă...</div>
  }

  if (total === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground space-y-2">
        <p className="text-sm font-medium">Nicio idee publicată din Intelligence încă.</p>
        <p className="text-xs">
          Publică oportunități din tab-ul <span className="font-medium">Oportunități</span> pentru a le vedea aici.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? 'idee publicată' : 'idei publicate'} în Calendar din Intelligence
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(opp => (
          <Card key={opp.id}>
            <CardContent className="pt-4 pb-3 space-y-2">
              {opp.image_url && (
                <img
                  src={opp.image_url}
                  alt={opp.title}
                  className="w-full rounded-md object-cover max-h-36"
                />
              )}
              <p className="text-sm font-medium leading-snug">{opp.title}</p>
              {opp.hook && (
                <p className="text-xs text-muted-foreground line-clamp-2">{opp.hook}</p>
              )}
              <div className="flex gap-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">Publicat</Badge>
                {opp.platforms?.slice(0, 3).map(p => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {totalPages} ({total} total)
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
