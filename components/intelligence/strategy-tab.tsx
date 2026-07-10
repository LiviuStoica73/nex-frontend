// components/intelligence/strategy-tab.tsx
// Version: 1.1.0 — 2026-07-11
// Scope: Strategy tab — list strategies, polling pentru running, show Business Analysis, SWOT, content pillars

'use client'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOrg } from '@/contexts/org-context'
import { getStrategies } from '@/lib/api/intelligence'

export function StrategyTab({ pollTrigger }: { pollTrigger?: number }) {
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [strategies, setStrategies] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId

  const fetchStrategies = (silent = false) => {
    if (!token || !orgId) return
    if (!silent) setLoading(true)
    getStrategies(orgId, token)
      .then((data: any[]) => {
        setStrategies(data)
        const current = data.find((s: any) => s.id === selected?.id) || (data.length > 0 ? data[0] : null)
        setSelected(current)

        // Dacă există o strategie running, pornește polling
        const hasRunning = data.some((s: any) => s.status === 'running')
        if (hasRunning && !pollRef.current) {
          setPolling(true)
          pollRef.current = setInterval(() => {
            getStrategies(orgId!, token).then((fresh: any[]) => {
              setStrategies(fresh)
              const sel = fresh.find((s: any) => s.id === selected?.id) || (fresh.length > 0 ? fresh[0] : null)
              setSelected(sel)
              const stillRunning = fresh.some((s: any) => s.status === 'running')
              if (!stillRunning) {
                clearInterval(pollRef.current!)
                pollRef.current = null
                setPolling(false)
              }
            }).catch(console.error)
          }, 10000)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStrategies()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [token, orgId])

  // Când Business Brain lansează o strategie, reîncărcăm și pornim polling
  useEffect(() => {
    if (pollTrigger && pollTrigger > 0) {
      setTimeout(() => fetchStrategies(true), 3000)
    }
  }, [pollTrigger])

  if (loading) return <div className="text-muted-foreground py-8 text-center">Se încarcă...</div>

  if (strategies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nu există strategii generate. Folosește tab-ul Business Brain.
      </div>
    )
  }

  if (polling && strategies.every((s: any) => s.status === 'running')) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-muted-foreground">⏳ Strategia se generează... (verificăm automat la 10 secunde)</div>
        <div className="text-xs text-muted-foreground">Durează 1-3 minute. Nu închide pagina.</div>
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
