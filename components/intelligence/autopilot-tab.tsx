// components/intelligence/autopilot-tab.tsx
// Version: 4.0.0 — 2026-07-11
// Scope: Istoric oportunități publicate din Intelligence în Calendar

'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listOpportunities } from '@/lib/api/intelligence'
import type { ContentOpportunity } from '@/lib/api/intelligence'

interface AutopilotTabProps {
  orgId: string
  token: string
}

export function AutopilotTab({ orgId, token }: AutopilotTabProps) {
  const [published, setPublished] = useState<ContentOpportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId || !token) return
    listOpportunities(orgId, token, 1, 50, 'published')
      .then((res: any) => setPublished(Array.isArray(res) ? res : (res.items ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orgId, token])

  if (loading) {
    return <div className="text-sm text-muted-foreground p-4 text-center">Se încarcă...</div>
  }

  if (published.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground space-y-2">
        <p className="text-sm font-medium">Nicio idee publicată din Intelligence încă.</p>
        <p className="text-xs">
          Generează prototipuri din tab-ul <span className="font-medium">Oportunități</span> și publică-le în Calendar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {published.length} {published.length === 1 ? 'idee publicată' : 'idei publicate'} în Calendar din Intelligence
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {published.map(opp => (
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
    </div>
  )
}
