// components/intelligence/strategy-tab.tsx
// Version: 1.0.0 — 2026-07-10
// Scope: Strategy tab — list strategies, show Business Analysis, SWOT, content pillars

'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrg } from '@/contexts/org-context'
import { getStrategies } from '@/lib/api/intelligence'

export function StrategyTab() {
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [strategies, setStrategies] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId

  useEffect(() => {
    if (!token || !orgId) return
    getStrategies(orgId, token)
      .then((data: any[]) => {
        setStrategies(data)
        if (data.length > 0) setSelected(data[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token, orgId])

  if (loading) return <div className="text-muted-foreground">Se încarcă...</div>

  if (strategies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nu există strategii generate. Folosește tab-ul Business Brain.
      </div>
    )
  }

  const ba = selected?.business_analysis || {}
  const cs = selected?.content_strategy || {}

  return (
    <div className="space-y-4">
      {/* Selector run */}
      <select
        className="border rounded px-3 py-2 text-sm"
        onChange={(e) => setSelected(strategies.find((s) => s.id === e.target.value))}
        value={selected?.id}
      >
        {strategies.map((s: any) => (
          <option key={s.id} value={s.id}>
            {new Date(s.created_at).toLocaleDateString('ro')} — {s.scan_depth} — {s.status}
          </option>
        ))}
      </select>

      {selected && (
        <div className="space-y-4">
          {/* Business Analysis */}
          {ba.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rezumat Business</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{ba.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* SWOT */}
          {ba.swot && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">SWOT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(ba.swot).map(([key, items]: [string, any]) => (
                    <div key={key}>
                      <div className="font-semibold capitalize mb-1">{key}</div>
                      <ul className="space-y-0.5">
                        {(items as string[]).map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Piloni */}
          {cs.pillars && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Piloni de Conținut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cs.pillars.map((p: any, i: number) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium">{p.name}</span>
                      {p.rationale && (
                        <span className="text-muted-foreground"> — {p.rationale}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
