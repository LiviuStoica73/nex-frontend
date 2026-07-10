// components/intelligence/opportunities-tab.tsx
// Version: 1.0.0 — 2026-07-10
// Scope: Opportunities tab — list top 10 + rest, filter by title/pillar

'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useOrg } from '@/contexts/org-context'
import { getStrategies } from '@/lib/api/intelligence'

interface Opportunity {
  id: string
  title: string
  pillar: string | null
  objective: string | null
  hook: string | null
  format: string | null
  platforms: string[]
  score: number | null
  score_rationale: string | null
  status: string
}

export function OpportunitiesTab() {
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId

  useEffect(() => {
    if (!token || !orgId) return
    setLoading(true)
    getStrategies(orgId, token)
      .then((strategies: any[]) => {
        const latest = strategies[0]
        if (latest?.opportunities) {
          setOpportunities(
            [...latest.opportunities].sort(
              (a: Opportunity, b: Opportunity) => (b.score || 0) - (a.score || 0)
            )
          )
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token, orgId])

  const filtered = opportunities.filter(
    (o) =>
      !filter ||
      o.title.toLowerCase().includes(filter.toLowerCase()) ||
      o.pillar?.toLowerCase().includes(filter.toLowerCase())
  )
  const top10 = filtered.slice(0, 10)
  const rest = filtered.slice(10)

  if (loading) return <div className="text-muted-foreground">Se încarcă oportunitățile...</div>

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nu există oportunități. Generează o strategie din tab-ul Business Brain.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filtrează după titlu sau pilon..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div>
        <h3 className="font-semibold mb-3">Top 10 oportunități recomandate</h3>
        <div className="grid gap-3">
          {top10.map((opp) => (
            <Card key={opp.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{opp.title}</CardTitle>
                  <Badge variant="outline" className="shrink-0">
                    Scor: {opp.score || 'N/A'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {opp.hook && <p className="text-xs text-muted-foreground">Hook: {opp.hook}</p>}
                <div className="flex gap-1 flex-wrap">
                  {opp.pillar && (
                    <Badge variant="secondary" className="text-xs">
                      {opp.pillar}
                    </Badge>
                  )}
                  {opp.format && (
                    <Badge variant="outline" className="text-xs">
                      {opp.format}
                    </Badge>
                  )}
                  {opp.platforms.map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {rest.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            {rest.length} oportunități suplimentare
          </summary>
          <div className="grid gap-2 mt-3">
            {rest.map((opp) => (
              <Card key={opp.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <span className="text-sm">{opp.title}</span>
                  <Badge variant="outline" className="text-xs">
                    Scor: {opp.score || 'N/A'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
