// components/intelligence/strategy-tab.tsx
// Version: 2.0.0 — 2026-07-14
// Scope: Strategie profesională completă — personas, messaging matrix, competitor gaps,
// plan editorial lunar, content mix, distribution recommendations, quick wins

'use client'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrg } from '@/contexts/org-context'
import { getStrategies, runStrategy } from '@/lib/api/intelligence'

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

function ScoreBadge({ label, value }: { label: string; value: any }) {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  const tone = n >= 80 ? 'border-green-300 text-green-700' : n >= 60 ? 'border-yellow-300 text-yellow-700' : 'border-red-300 text-red-700'
  return (
    <div className={`rounded-md border px-3 py-2 ${Number.isFinite(n) ? tone : ''}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

export function StrategyTab({ pollTrigger }: { pollTrigger?: number }) {
  const t = useTranslations('strategy')
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [strategies, setStrategies] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [scanDepth, setScanDepth] = useState<'standard' | 'deep'>('standard')
  const [runningStrategy, setRunningStrategy] = useState(false)
  const [strategyMessage, setStrategyMessage] = useState('')
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

  const handleRunStrategy = async () => {
    if (!token || !orgId) return
    setRunningStrategy(true)
    setStrategyMessage('')
    try {
      const result = await runStrategy(orgId, scanDepth, token)
      setStrategyMessage(t('strategy_started', { credits: result.credits_consumed }))
      setTimeout(() => fetchStrategies(true), 5000)
    } catch (e: any) {
      setStrategyMessage(t('error_with_message', { message: e.message }))
    } finally {
      setRunningStrategy(false)
    }
  }

  if (loading) return <div className="text-muted-foreground py-8 text-center">{t('loading')}</div>

  const formatLabel = (value: string) => {
    const normalized = value.toLowerCase().trim()
    const keyByValue: Record<string, string> = {
      articol: 'article',
      carusel: 'carousel',
      postare: 'post',
      poveste: 'story',
    }
    const key = keyByValue[normalized]
    return key ? t(`content_formats.${key}`) : value
  }

  const frequencyLabel = (value: string) => {
    const normalized = value.toLowerCase().trim()
    if (normalized === '3x/săptămână' || normalized === '3x/saptamana') return t('frequencies.three_per_week')
    return value
  }

  const generateBlock = (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1">
            <p className="text-sm font-medium">{t('generate_strategy')}</p>
            <p className="text-xs text-muted-foreground">{t('generate_strategy_description')}</p>
          </div>
          <Select value={scanDepth} onValueChange={(v) => setScanDepth(v as 'standard' | 'deep')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard — 20cr</SelectItem>
              <SelectItem value="deep">Deep — 30cr</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRunStrategy} disabled={runningStrategy} size="sm">
            {runningStrategy ? t('launching') : t('generate')}
          </Button>
        </div>
        {strategyMessage && (
          <p className="text-xs text-muted-foreground mt-2">{strategyMessage}</p>
        )}
      </CardContent>
    </Card>
  )

  // Banner persistent când există o strategie în curs (chiar dacă există și altele completate)
  const inProgressStrategy = strategies.find((s: any) => s.status === 'running')
  const runningBanner = inProgressStrategy ? (
    <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm">
      <span className="animate-pulse">⏳</span>
      <span className="font-medium text-yellow-800 dark:text-yellow-200">
        {t('analysis_started_at', { time: new Date(inProgressStrategy.created_at).toLocaleString('ro', { hour: '2-digit', minute: '2-digit' }) })}
      </span>
      <span className="text-yellow-700 dark:text-yellow-300 text-xs">{t('auto_refresh_note')}</span>
    </div>
  ) : null

  if (strategies.length === 0) {
    return (
      <div className="space-y-3">
        {generateBlock}
        {runningBanner}
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t('empty')}
        </div>
      </div>
    )
  }

  const ba = selected?.business_analysis || {}
  const cs = selected?.content_strategy || {}
  const aq = ba.audit_quality || {}
  const executive = ba.executive_summary || {}
  const diagnosis = ba.business_diagnosis || {}
  const positioning = ba.positioning || {}
  const competitorAnalysis = ba.competitor_analysis || {}
  const offerPricing = ba.offer_and_pricing || {}

  const SWOT_LABELS: Record<string, string> = {
    strengths: t('swot.strengths'),
    weaknesses: t('swot.weaknesses'),
    opportunities: t('swot.opportunities'),
    threats: t('swot.threats'),
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
    awareness: t('stages.awareness'),
    consideration: t('stages.consideration'),
    decision: t('stages.decision'),
    retention: t('stages.retention'),
  }

  return (
    <div className="space-y-4">
      {generateBlock}
      {runningBanner}
      {/* Selector run */}
      <select
        className="border rounded px-3 py-2 text-sm bg-background"
        onChange={(e) => setSelected(strategies.find((s) => s.id === e.target.value))}
        value={selected?.id}
      >
        {strategies.map((s: any) => (
          <option key={s.id} value={s.id}>
            {new Date(s.created_at).toLocaleString('ro', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — {s.scan_depth} — {s.status}
          </option>
        ))}
      </select>

      {selected?.status === 'failed' && (
        <div className="text-sm text-red-500 p-3 bg-red-50 dark:bg-red-950 rounded">
          {t('generation_failed')} {ba.error || t('unknown_error')}
        </div>
      )}

      {selected?.status === 'completed' && (
        <div className="space-y-4">

          {/* Audit Quality */}
          {(aq.confidence_score || aq.data_completeness_score || aq.brand_consistency_score || aq.warnings?.length > 0) && (
            <Section title={t('sections.audit_quality')}>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <ScoreBadge label={t('audit.confidence')} value={aq.confidence_score} />
                  <ScoreBadge label={t('audit.data_completeness')} value={aq.data_completeness_score} />
                  <ScoreBadge label={t('audit.brand_consistency')} value={aq.brand_consistency_score} />
                </div>
                {aq.warnings?.length > 0 && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
                    <div className="font-medium mb-1">{t('audit.warnings')}</div>
                    <BulletList items={aq.warnings} />
                  </div>
                )}
                {aq.missing_data?.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {t('audit.missing_data', { data: aq.missing_data.join(', ') })}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Executive Summary */}
          {(executive.one_paragraph || executive.top_findings?.length > 0 || executive.top_recommendations?.length > 0) && (
            <Section title="📌 Executive Summary">
              <div className="space-y-3 text-sm">
                {executive.one_paragraph && <p>{executive.one_paragraph}</p>}
                {executive.priority_decision && (
                  <div className="rounded-md bg-muted p-3">
                    <span className="font-medium">{t('priority_decision')} </span>{executive.priority_decision}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {executive.top_findings?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{t('findings')}</div>
                      <BulletList items={executive.top_findings} />
                    </div>
                  )}
                  {executive.top_recommendations?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{t('recommendations')}</div>
                      <BulletList items={executive.top_recommendations} />
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Rezumat + Poziționare */}
          {(ba.summary || ba.recommended_positioning) && (
            <Section title={t('sections.business_analysis')}>
              <div className="space-y-3 text-sm">
                {ba.industry_context && (
                  <div>
                    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{t('industry_context')}</span>
                    <p className="mt-1">{ba.industry_context}</p>
                  </div>
                )}
                {ba.summary && (
                  <div>
                    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{t('summary')}</span>
                    <p className="mt-1">{ba.summary}</p>
                  </div>
                )}
                {ba.current_positioning && (
                  <div>
                    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{t('current_positioning')}</span>
                    <p className="mt-1 text-muted-foreground">{ba.current_positioning}</p>
                  </div>
                )}
                {ba.recommended_positioning && (
                  <div>
                    <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{t('recommended_positioning')}</span>
                    <p className="mt-1 font-medium">{ba.recommended_positioning}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Business Diagnosis + Positioning */}
          {(diagnosis.what_the_business_sells || positioning.one_liner || positioning.value_proposition) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title={t('sections.business_diagnosis')}>
                <div className="space-y-2 text-sm">
                  {diagnosis.what_the_business_sells && <p><span className="font-medium">{t('diagnosis.sells')} </span>{diagnosis.what_the_business_sells}</p>}
                  {diagnosis.who_it_serves && <p><span className="font-medium">{t('diagnosis.serves')} </span>{diagnosis.who_it_serves}</p>}
                  {diagnosis.problem_solved && <p><span className="font-medium">{t('diagnosis.problem_solved')} </span>{diagnosis.problem_solved}</p>}
                  {diagnosis.economic_value && <p><span className="font-medium">{t('diagnosis.economic_value')} </span>{diagnosis.economic_value}</p>}
                  {diagnosis.current_clarity_score !== undefined && <ScoreBadge label={t('diagnosis.message_clarity')} value={diagnosis.current_clarity_score} />}
                  {diagnosis.clarity_issues?.length > 0 && <BulletList items={diagnosis.clarity_issues} />}
                </div>
              </Section>
              <Section title={t('sections.positioning')}>
                <div className="space-y-2 text-sm">
                  {positioning.one_liner && <p><span className="font-medium">One-liner: </span>{positioning.one_liner}</p>}
                  {positioning.elevator_pitch && <p><span className="font-medium">Pitch: </span>{positioning.elevator_pitch}</p>}
                  {positioning.value_proposition && <p><span className="font-medium">Value proposition: </span>{positioning.value_proposition}</p>}
                  {positioning.reasons_to_believe?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Proof points</div>
                      <BulletList items={positioning.reasons_to_believe} />
                    </div>
                  )}
                  {positioning.anti_positioning?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{t('do_not_position_like_this')}</div>
                      <BulletList items={positioning.anti_positioning} />
                    </div>
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* Quick Wins */}
          {cs.quick_wins?.length > 0 && (
            <Section title={t('sections.quick_wins')}>
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
            <Section title={t('sections.target_personas')}>
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
                          <span className="font-medium text-muted-foreground">{t('personas.pain_points')}</span>
                          <ul className="mt-1 space-y-0.5">{p.pain_points.map((x: string, j: number) => <li key={j}>• {x}</li>)}</ul>
                        </div>
                      )}
                      {p.desires?.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">{t('personas.desires')}</span>
                          <ul className="mt-1 space-y-0.5">{p.desires.map((x: string, j: number) => <li key={j}>• {x}</li>)}</ul>
                        </div>
                      )}
                      {p.buying_triggers?.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">{t('personas.buying_triggers')}</span>
                          <ul className="mt-1 space-y-0.5">{p.buying_triggers.map((x: string, j: number) => <li key={j}>• {x}</li>)}</ul>
                        </div>
                      )}
                      {p.content_that_resonates?.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground">{t('personas.resonating_content')}</span>
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
            <Section title={t('sections.competitor_gaps')}>
              <div className="space-y-3">
                {ba.competitor_gaps.map((gap: any, i: number) => (
                  <div key={i} className="border rounded p-3 space-y-1 text-sm">
                    <div><span className="font-medium text-muted-foreground text-xs">Gap:</span> {gap.gap}</div>
                    <div><span className="font-medium text-muted-foreground text-xs">Oportunitate:</span> {gap.opportunity}</div>
                    {gap.content_angle && (
                      <div className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded">
                        <span className="font-medium">{t('content_angle')}</span> {gap.content_angle}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Competitor Analysis */}
          {(competitorAnalysis.summary || competitorAnalysis.competitors?.length > 0) && (
            <Section title={t('sections.competitor_analysis')}>
              <div className="space-y-3 text-sm">
                {competitorAnalysis.summary && <p>{competitorAnalysis.summary}</p>}
                {competitorAnalysis.competitors?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-3">Competitor</th>
                          <th className="py-2 pr-3">{t('current_positioning')}</th>
                          <th className="py-2 pr-3">Pricing</th>
                          <th className="py-2 pr-3">{t('opportunity')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competitorAnalysis.competitors.map((c: any, i: number) => (
                          <tr key={i} className="border-b align-top">
                            <td className="py-2 pr-3 font-medium">{c.name || c.url}</td>
                            <td className="py-2 pr-3">{c.positioning || c.offer}</td>
                            <td className="py-2 pr-3 text-muted-foreground">{c.pricing_notes}</td>
                            <td className="py-2 pr-3">{c.opportunity_for_us}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {competitorAnalysis.messages_to_own?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{t('messages_to_own')}</div>
                    <BulletList items={competitorAnalysis.messages_to_own} />
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Offer & Pricing */}
          {(offerPricing.offer_diagnosis || offerPricing.packaging_recommendations?.length > 0) && (
            <Section title={t('sections.offer_pricing')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  {offerPricing.offer_diagnosis && <p>{offerPricing.offer_diagnosis}</p>}
                  {offerPricing.pricing_observations?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{t('pricing_observations')}</div>
                      <BulletList items={offerPricing.pricing_observations} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {offerPricing.packaging_recommendations?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{t('package_recommendations')}</div>
                      <BulletList items={offerPricing.packaging_recommendations} />
                    </div>
                  )}
                  {offerPricing.tests_to_run?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Teste</div>
                      <BulletList items={offerPricing.tests_to_run} />
                    </div>
                  )}
                  {offerPricing.limitations?.length > 0 && (
                    <div className="text-xs text-muted-foreground">{t('limitations', { limitations: offerPricing.limitations.join(', ') })}</div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Piloni + Content Mix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cs.pillars?.length > 0 && (
              <Section title={t('sections.content_pillars')}>
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
              <Section title={t('sections.content_mix')}>
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
            <Section title={t('sections.monthly_editorial_plan')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cs.monthly_editorial_plan.map((week: any) => (
                  <div key={week.week} className="border rounded p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs">{t('week_number', { week: week.week })}</Badge>
                      {week.pillar && <span className="text-xs text-muted-foreground">{week.pillar}</span>}
                    </div>
                    <p className="font-medium text-sm">{week.theme}</p>
                    {week.hook_angle && <p className="text-xs text-muted-foreground italic">{week.hook_angle}</p>}
                    {week.suggested_formats?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {week.suggested_formats.map((f: string) => (
                          <Badge key={f} variant="outline" className="text-xs">{formatLabel(f)}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Funnel Plan */}
          {cs.funnel_plan?.length > 0 && (
            <Section title="🧲 Funnel & Customer Journey">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cs.funnel_plan.map((stage: any, i: number) => (
                  <div key={i} className="border rounded p-3 space-y-1.5 text-sm">
                    <div className="font-semibold capitalize">{STAGE_LABELS[stage.stage] || stage.stage}</div>
                    {stage.objective && <p className="text-xs text-muted-foreground">{stage.objective}</p>}
                    {stage.cta && <p className="text-xs"><span className="font-medium">CTA: </span>{stage.cta}</p>}
                    {stage.content_types?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {stage.content_types.map((x: string) => <Badge key={x} variant="outline" className="text-xs">{x}</Badge>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Roadmap 90 zile */}
          {cs.roadmap_90_days?.length > 0 && (
            <Section title={t('sections.roadmap_90_days')}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cs.roadmap_90_days.map((month: any, i: number) => (
                  <div key={i} className="border rounded p-3 space-y-2 text-sm">
                    <Badge>Luna {month.month || i + 1}</Badge>
                    {month.objective && <p className="font-medium">{month.objective}</p>}
                    {month.campaigns?.length > 0 && <BulletList items={month.campaigns} />}
                    {month.distribution_focus?.length > 0 && (
                      <p className="text-xs text-muted-foreground">{t('distribution', { distribution: month.distribution_focus.join(', ') })}</p>
                    )}
                    {month.kpis?.length > 0 && (
                      <p className="text-xs text-muted-foreground">KPI: {month.kpis.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Calendar editorial 12 săptămâni */}
          {cs.editorial_calendar_12_weeks?.length > 0 && (
            <Section title={t('sections.editorial_calendar_12_weeks')}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">{t('table.week')}</th>
                      <th className="py-2 pr-3">{t('table.theme')}</th>
                      <th className="py-2 pr-3">Obiectiv</th>
                      <th className="py-2 pr-3">Platforme</th>
                      <th className="py-2 pr-3">CTA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cs.editorial_calendar_12_weeks.map((week: any, i: number) => (
                      <tr key={i} className="border-b align-top">
                        <td className="py-2 pr-3 font-medium">{week.week}</td>
                        <td className="py-2 pr-3">{week.theme}</td>
                        <td className="py-2 pr-3">{week.objective}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{week.platforms?.join(', ')}</td>
                        <td className="py-2 pr-3">{week.cta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Platforme Prioritare */}
          {cs.priority_platforms?.length > 0 && (
            <Section title={t('sections.priority_platforms')}>
              <div className="space-y-3">
                {cs.priority_platforms.map((pl: any, i: number) => (
                  <div key={i} className="border rounded p-3 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{pl.platform}</span>
                      {pl.frequency && <Badge variant="outline" className="text-xs">{frequencyLabel(pl.frequency)}</Badge>}
                      {pl.tone && <span className="text-xs text-muted-foreground">{pl.tone}</span>}
                    </div>
                    {pl.what_works_here && <p className="text-xs text-muted-foreground">{pl.what_works_here}</p>}
                    {pl.formats?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {pl.formats.map((f: string) => <Badge key={f} variant="secondary" className="text-xs">{formatLabel(f)}</Badge>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Distribution Recommendations */}
          {cs.distribution_recommendations?.length > 0 && (
            <Section title={t('sections.distribution_recommendations')}>
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
              <Section title={t('sections.differentiators')}>
                <BulletList items={ba.differentiators} />
              </Section>
            )}
            {ba.common_objections?.length > 0 && (
              <Section title={t('sections.common_objections')}>
                <BulletList items={ba.common_objections} />
              </Section>
            )}
            {cs.what_to_avoid?.length > 0 && (
              <Section title={t('sections.what_to_avoid')}>
                <BulletList items={cs.what_to_avoid} />
              </Section>
            )}
          </div>

          {/* Action Plan */}
          {cs.action_plan && Object.keys(cs.action_plan).length > 0 && (
            <Section title="✅ Action Plan">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {[
                  ['next_7_days', t('action_plan.next_7_days')],
                  ['next_30_days', t('action_plan.next_30_days')],
                  ['next_60_days', t('action_plan.next_60_days')],
                  ['next_90_days', t('action_plan.next_90_days')],
                  ['requires_human_input', t('action_plan.requires_human_input')],
                ].map(([key, label]) => (
                  cs.action_plan[key]?.length > 0 && (
                    <div key={key}>
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{label}</div>
                      <BulletList items={cs.action_plan[key]} />
                    </div>
                  )
                ))}
              </div>
            </Section>
          )}

        </div>
      )}
    </div>
  )
}
