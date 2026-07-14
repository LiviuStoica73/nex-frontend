// components/intelligence/strategy-tab.tsx
// Version: 2.0.0 — 2026-07-14
// Scope: Strategie profesională completă — personas, messaging matrix, competitor gaps,
// plan editorial lunar, content mix, distribution recommendations, quick wins

'use client'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOrg } from '@/contexts/org-context'
import { getStrategies } from '@/lib/api/intelligence'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function BulletList({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <ul className="space-y-1 text-sm">
      {items.map((item, i) => <li key={i} className="flex gap-2"><span className="text-muted-foreground shrink-0">•</span><span>{item}</span></li>)}
    </ul>
  )
}

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
        const hasRunning = data.some((s: any) => s.status === 'running')
        if (hasRunning && !pollRef.current) {
          setPolling(true)
          pollRef.current = setInterval(() => {
            getStrategies(orgId!, token).then((fresh: any[]) => {
              setStrategies(fresh)
              const sel = fresh.find((s: any) => s.id === selected?.id) || (fresh.length > 0 ? fresh[0] : null)
              setSelected(sel)
              if (!fresh.some((s: any) => s.status === 'running')) {
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

  useEffect(() => {
    if (pollTrigger && pollTrigger > 0) setTimeout(() => fetchStrategies(true), 3000)
  }, [pollTrigger])

  if (loading) return <div className="text-muted-foreground py-8 text-center">Se încarcă...</div>

  if (strategies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nu există strategii generate. Folosește tab-ul Business Brain pentru a genera prima strategie.
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

  const SWOT_LABELS: Record<string, string> = {
    strengths: '💪 Puncte forte',
    weaknesses: '⚠️ Puncte slabe',
    opportunities: '🚀 Oportunități',
    threats: '🛡️ Amenințări',
  }

  const SWOT_COLORS: Record<string, string> = {
    strengths: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    weaknesses: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    opportunities: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    threats: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  }

  const MIX_COLORS: Record<string, string> = {
    educational: 'bg-blue-500',
    promotional: 'bg-green-500',
    storytelling: 'bg-purple-500',
    authority: 'bg-orange-500',
    community: 'bg-pink-500',
  }

  const STAGE_LABELS: Record<string, string> = {
    awareness: '👁️ Awareness',
    consideration: '🤔 Consideration',
    decision: '✅ Decision',
    retention: '❤️ Retention',
  }

  return (
    <div className="space-y-4">
      {/* Selector run */}
      <select
        className="border rounded px-3 py-2 text-sm bg-background"
        onChange={(e) => setSelected(strategies.find((s) => s.id === e.target.value))}
        value={selected?.id}
      >
        {strategies.map((s: any) => (
          <option key={s.id} value={s.id}>
            {new Date(s.created_at).toLocaleDateString('ro')} — {s.scan_depth} — {s.status}
          </option>
        ))}
      </select>

      {selected?.status === 'failed' && (
        <div className="text-sm text-red-500 p-3 bg-red-50 dark:bg-red-950 rounded">
          Generarea a eșuat: {ba.error || 'eroare necunoscută'}
        </div>
      )}

      {selected?.status === 'completed' && (
        <div className="space-y-4">

          {/* Rezumat + Poziționare */}
          {(ba.summary || ba.recommended_positioning) && (
            <Section title="📊 Analiza Business">
              <div className="space-y-3 text-sm">
                {ba.industry_context && (
                  <div>
                    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Context industrie</span>
                    <p className="mt-1">{ba.industry_context}</p>
                  </div>
                )}
                {ba.summary && (
                  <div>
                    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Rezumat</span>
                    <p className="mt-1">{ba.summary}</p>
                  </div>
                )}
                {ba.current_positioning && (
                  <div>
                    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Poziționare actuală</span>
                    <p className="mt-1 text-muted-foreground">{ba.current_positioning}</p>
                  </div>
                )}
                {ba.recommended_positioning && (
                  <div>
                    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Poziționare recomandată</span>
                    <p className="mt-1 font-medium">{ba.recommended_positioning}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Quick Wins */}
          {cs.quick_wins?.length > 0 && (
            <Section title="⚡ Quick Wins — primele 30 de zile">
              <div className="space-y-2">
                {cs.quick_wins.map((win: string, i: number) => (
                  <div key={i} className="flex gap-3 p-2 bg-green-50 dark:bg-green-950 rounded text-sm">
                    <span className="font-bold text-green-600 shrink-0">{i + 1}.</span>
                    <span>{win}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* SWOT */}
          {ba.swot && (
            <Section title="🎯 SWOT">
              <div className="grid grid-cols-2 gap-3">
                {(['strengths', 'weaknesses', 'opportunities', 'threats'] as const).map((key) => (
                  ba.swot[key]?.length > 0 && (
                    <div key={key} className={`p-3 rounded border ${SWOT_COLORS[key]}`}>
                      <div className="font-semibold text-xs mb-2">{SWOT_LABELS[key]}</div>
                      <ul className="space-y-1 text-xs">
                        {ba.swot[key].map((item: string, i: number) => (
                          <li key={i} className="flex gap-1.5"><span className="shrink-0">•</span><span>{item}</span></li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </div>
            </Section>
          )}

          {/* Personas */}
          {ba.target_personas?.length > 0 && (
            <Section title="👥 Persoane Țintă">
              <div className="space-y-4">
                {ba.target_personas.map((p: any, i: number) => (
                  <div key={i} className="border rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{p.name}</span>
                      {p.job_title && <Badge variant="outline" className="text-xs">{p.job_title}</Badge>}
                      {p.age_range && <span className="text-xs text-muted-foreground">{p.age_range} ani</span>}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {p.pain_points?.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">Dureri</span>
                          <ul className="mt-1 space-y-0.5">{p.pain_points.map((x: string, j: number) => <li key={j}>• {x}</li>)}</ul>
                        </div>
                      )}
                      {p.desires?.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">Dorințe</span>
                          <ul className="mt-1 space-y-0.5">{p.desires.map((x: string, j: number) => <li key={j}>• {x}</li>)}</ul>
                        </div>
                      )}
                      {p.buying_triggers?.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">Triggere de cumpărare</span>
                          <ul className="mt-1 space-y-0.5">{p.buying_triggers.map((x: string, j: number) => <li key={j}>• {x}</li>)}</ul>
                        </div>
                      )}
                      {p.content_that_resonates?.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">Conținut care rezonează</span>
                          <ul className="mt-1 space-y-0.5">{p.content_that_resonates.map((x: string, j: number) => <li key={j}>• {x}</li>)}</ul>
                        </div>
                      )}
                    </div>
                    {p.preferred_platforms?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {p.preferred_platforms.map((pl: string) => (
                          <Badge key={pl} variant="secondary" className="text-xs">{pl}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Messaging Matrix */}
          {ba.messaging_matrix && Object.keys(ba.messaging_matrix).length > 0 && (
            <Section title="💬 Messaging Matrix">
              <div className="space-y-2">
                {Object.entries(ba.messaging_matrix).map(([stage, message]: [string, any]) => (
                  <div key={stage} className="flex gap-3 text-sm border rounded p-2.5">
                    <span className="shrink-0 font-medium text-xs w-24">{STAGE_LABELS[stage] || stage}</span>
                    <span className="text-muted-foreground">{message}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Competitor Gaps */}
          {ba.competitor_gaps?.length > 0 && (
            <Section title="🔍 Goluri față de Competitori">
              <div className="space-y-3">
                {ba.competitor_gaps.map((gap: any, i: number) => (
                  <div key={i} className="border rounded p-3 space-y-1 text-sm">
                    <div><span className="font-medium text-muted-foreground text-xs">Gap:</span> {gap.gap}</div>
                    <div><span className="font-medium text-muted-foreground text-xs">Oportunitate:</span> {gap.opportunity}</div>
                    {gap.content_angle && (
                      <div className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded">
                        <span className="font-medium">💡 Unghi de conținut:</span> {gap.content_angle}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Piloni + Content Mix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cs.pillars?.length > 0 && (
              <Section title="🏛️ Piloni de Conținut">
                <div className="space-y-3">
                  {cs.pillars.map((p: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{p.name}</span>
                        {p.monthly_percentage && (
                          <Badge variant="outline" className="text-xs">{p.monthly_percentage}%</Badge>
                        )}
                      </div>
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      {p.example_topics?.length > 0 && (
                        <div className="text-xs text-muted-foreground pl-2">
                          {p.example_topics.slice(0, 2).map((t: string, j: number) => (
                            <div key={j}>· {t}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {cs.content_mix && Object.keys(cs.content_mix).length > 0 && (
              <Section title="📊 Mix de Conținut">
                <div className="space-y-2">
                  {Object.entries(cs.content_mix).map(([type, pct]: [string, any]) => (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{type}</span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${MIX_COLORS[type] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Plan Editorial Lunar */}
          {cs.monthly_editorial_plan?.length > 0 && (
            <Section title="📅 Plan Editorial Lunar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cs.monthly_editorial_plan.map((week: any) => (
                  <div key={week.week} className="border rounded p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs">Săptămâna {week.week}</Badge>
                      {week.pillar && <span className="text-xs text-muted-foreground">{week.pillar}</span>}
                    </div>
                    <p className="font-medium text-sm">{week.theme}</p>
                    {week.hook_angle && <p className="text-xs text-muted-foreground italic">{week.hook_angle}</p>}
                    {week.suggested_formats?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {week.suggested_formats.map((f: string) => (
                          <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Platforme Prioritare */}
          {cs.priority_platforms?.length > 0 && (
            <Section title="📱 Platforme Prioritare">
              <div className="space-y-3">
                {cs.priority_platforms.map((pl: any, i: number) => (
                  <div key={i} className="border rounded p-3 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{pl.platform}</span>
                      {pl.frequency && <Badge variant="outline" className="text-xs">{pl.frequency}</Badge>}
                      {pl.tone && <span className="text-xs text-muted-foreground">{pl.tone}</span>}
                    </div>
                    {pl.what_works_here && <p className="text-xs text-muted-foreground">{pl.what_works_here}</p>}
                    {pl.formats?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {pl.formats.map((f: string) => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Distribution Recommendations */}
          {cs.distribution_recommendations?.length > 0 && (
            <Section title="📣 Recomandări de Distribuție">
              <div className="space-y-2">
                {cs.distribution_recommendations.map((rec: any, i: number) => (
                  <div key={i} className="flex gap-3 p-2.5 border rounded text-sm">
                    <span className="font-medium shrink-0 text-muted-foreground text-xs w-28">{rec.channel}</span>
                    <div className="space-y-0.5">
                      <div>{rec.action}</div>
                      {(rec.frequency || rec.goal) && (
                        <div className="text-xs text-muted-foreground">
                          {rec.frequency && <span>{rec.frequency} · </span>}
                          {rec.goal}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Diferențiatori + Obiecții + Ce de evitat */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ba.differentiators?.length > 0 && (
              <Section title="🌟 Diferențiatori">
                <BulletList items={ba.differentiators} />
              </Section>
            )}
            {ba.common_objections?.length > 0 && (
              <Section title="❓ Obiecții Comune">
                <BulletList items={ba.common_objections} />
              </Section>
            )}
            {cs.what_to_avoid?.length > 0 && (
              <Section title="🚫 De Evitat">
                <BulletList items={cs.what_to_avoid} />
              </Section>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
