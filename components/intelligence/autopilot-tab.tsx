// components/intelligence/autopilot-tab.tsx
// Version: 2.1.0 — 2026-07-11
// Scope: Campaign Autopilot — state mutat în pagină-părinte pentru persistență la navigare
//        Etapa 1 (propunere teme, 0cr) → Etapa 2 (generare conținut, credite)
//        Filtre, căutare și paginație pe teme propuse

'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useOrg } from '@/contexts/org-context'
import { generateThemesContent, proposeThemes } from '@/lib/api/intelligence'
import type { AutopilotStage, Theme } from '@/app/(protected)/dashboard/intelligence/page'

const CREDIT_PER_THEME = 5  // 3 text + 2 imagine
const THEMES_PER_PAGE = 10

const APPROVAL_FILTERS = [
  { value: 'all', label: 'Toate' },
  { value: 'approved', label: 'Aprobate' },
  { value: 'pending', label: 'Neaprobate' },
]

interface AutopilotTabProps {
  pendingOpportunityIds: string[]
  onClearPending: () => void
  themes: Theme[]
  onThemesChange: (themes: Theme[]) => void
  stage: AutopilotStage
  onStageChange: (stage: AutopilotStage) => void
  approvedIds: Set<string>
  onApprovedIdsChange: (ids: Set<string>) => void
}

export function AutopilotTab({
  pendingOpportunityIds,
  onClearPending,
  themes,
  onThemesChange,
  stage,
  onStageChange,
  approvedIds,
  onApprovedIdsChange,
}: AutopilotTabProps) {
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [themePage, setThemePage] = useState(1)

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId
  const hasPending = pendingOpportunityIds.length > 0

  const handleProposeThemes = async () => {
    if (!token || !orgId || !hasPending) return
    setLoading(true)
    setMessage('')
    try {
      const result = await proposeThemes(orgId, pendingOpportunityIds, token)
      const newThemes: Theme[] = result.themes || []
      onThemesChange(newThemes)
      onApprovedIdsChange(new Set(newThemes.map((t: Theme) => t.opportunity_id)))
      onStageChange('etapa1')
      onClearPending()
      setThemePage(1)
    } catch (e: any) {
      setMessage(`Eroare: ${e.message}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const toggleApprove = (id: string) => {
    const next = new Set(approvedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    onApprovedIdsChange(next)
  }

  const handleGenerate = async () => {
    if (!token || !orgId || approvedIds.size === 0) return
    setLoading(true)
    onStageChange('generating')
    setMessage('')
    try {
      const approved = themes.filter(t => approvedIds.has(t.opportunity_id))
      const tempCampaignId = crypto.randomUUID()
      await generateThemesContent(orgId, tempCampaignId, approved, token)
      onStageChange('done')
      setMessage(`✓ Conținutul se generează pentru ${approved.length} teme. Vei găsi postările în Calendar în ~2-5 minute.`)
      setMessageType('success')
    } catch (e: any) {
      setMessage(`Eroare: ${e.message}`)
      setMessageType('error')
      onStageChange('etapa1')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    onStageChange('idle')
    onThemesChange([])
    onApprovedIdsChange(new Set())
    setMessage('')
    setSearchText('')
    setApprovalFilter('all')
    setThemePage(1)
  }

  // Filtrare teme
  const filteredThemes = themes.filter(t => {
    const matchText = !searchText || t.title.toLowerCase().includes(searchText.toLowerCase())
    const matchApproval = approvalFilter === 'all'
      || (approvalFilter === 'approved' && approvedIds.has(t.opportunity_id))
      || (approvalFilter === 'pending' && !approvedIds.has(t.opportunity_id))
    return matchText && matchApproval
  })
  const totalThemePages = Math.ceil(filteredThemes.length / THEMES_PER_PAGE)
  const pagedThemes = filteredThemes.slice((themePage - 1) * THEMES_PER_PAGE, themePage * THEMES_PER_PAGE)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Autopilot</CardTitle>
          <CardDescription>
            Etapa 1 (gratuit): propune teme din oportunități selectate.
            Etapa 2 (credite): generează text + imagini pentru fiecare temă aprobată.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stage === 'idle' && (
            <div className="space-y-4">
              {hasPending ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">{pendingOpportunityIds.length} oportunități selectate</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cost estimat Etapa 2: {pendingOpportunityIds.length * CREDIT_PER_THEME} credite
                    </p>
                  </div>
                  <Button onClick={handleProposeThemes} disabled={loading} size="lg" className="w-full">
                    {loading ? 'Se generează propunerile...' : `Propune ${pendingOpportunityIds.length} teme — Etapa 1 (gratuit)`}
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Nu ai oportunități selectate.</p>
                  <p>Du-te în <strong>Oportunități</strong>, bifează oportunitățile și apasă <strong>Trimite la Autopilot</strong>.</p>
                </div>
              )}
            </div>
          )}

          {stage === 'done' && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md text-sm text-green-800 dark:text-green-200">
                {message}
              </div>
              <Button variant="outline" onClick={handleReset}>
                Pornește o nouă rundă Autopilot
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dacă avem teme propuse (etapa1/etapa2/generating) */}
      {(stage === 'etapa1' || stage === 'etapa2' || stage === 'generating') && themes.length > 0 && (
        <div className="space-y-3">
          {/* Header + acțiuni globale */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold">
              Etapa 1 — Teme propuse ({approvedIds.size}/{themes.length} aprobate)
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline"
                onClick={() => onApprovedIdsChange(new Set(themes.map(t => t.opportunity_id)))}>
                Aprobă toate
              </Button>
              <Button size="sm" variant="ghost"
                onClick={() => onApprovedIdsChange(new Set())}>
                Deselectează
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReset}>
                ✕ Resetează
              </Button>
            </div>
          </div>

          {/* Filtre + căutare */}
          <div className="flex flex-wrap gap-2 items-center">
            {APPROVAL_FILTERS.map(f => (
              <Button
                key={f.value}
                size="sm"
                variant={approvalFilter === f.value ? 'default' : 'outline'}
                onClick={() => { setApprovalFilter(f.value); setThemePage(1) }}
              >
                {f.label}
              </Button>
            ))}
            <Input
              placeholder="Caută temă..."
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setThemePage(1) }}
              className="w-52 h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredThemes.length} teme · pagina {themePage}/{totalThemePages || 1}
            </span>
          </div>

          {/* Lista teme */}
          {pagedThemes.map(theme => {
            const isApproved = approvedIds.has(theme.opportunity_id)
            return (
              <Card
                key={theme.opportunity_id}
                className={`cursor-pointer transition-all ${isApproved ? 'ring-2 ring-primary bg-primary/5' : 'opacity-60'}`}
                onClick={() => toggleApprove(theme.opportunity_id)}
              >
                <CardContent className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <span className="text-sm font-medium">{theme.title}</span>
                    {theme.hook && <p className="text-xs text-muted-foreground">{theme.hook}</p>}
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{theme.visual_category}</Badge>
                      {theme.pillar && <Badge variant="secondary" className="text-xs">{theme.pillar}</Badge>}
                      {theme.format && <Badge variant="outline" className="text-xs">{theme.format}</Badge>}
                      {theme.platforms.slice(0, 3).map(p => (
                        <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                    isApproved ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'
                  }`}>
                    {isApproved ? '✓' : ''}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Paginație teme */}
          {totalThemePages > 1 && (
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="outline" disabled={themePage === 1} onClick={() => setThemePage(p => p - 1)}>← Anterior</Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">{themePage}/{totalThemePages}</span>
              <Button size="sm" variant="outline" disabled={themePage === totalThemePages} onClick={() => setThemePage(p => p + 1)}>Următor →</Button>
            </div>
          )}

          {/* Etapa 2 — confirmare */}
          {stage !== 'generating' && approvedIds.size > 0 && (
            <Card className="border-amber-400 dark:border-amber-600">
              <CardContent className="py-4 space-y-3">
                <div className="font-semibold">Etapa 2 — Confirmare generare conținut</div>
                <div className="text-sm space-y-1">
                  <div>Teme aprobate: <strong>{approvedIds.size}</strong></div>
                  <div>Cost text: <strong>{approvedIds.size * 3} credite</strong> ({approvedIds.size} × 3cr)</div>
                  <div>Cost imagini: <strong>{approvedIds.size * 2} credite</strong> ({approvedIds.size} × 2cr)</div>
                  <div className="font-bold text-base mt-1">Total: {approvedIds.size * CREDIT_PER_THEME} credite</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Creditele se consumă la confirmare. Conținutul apare în Calendar în ~2-5 minute.
                </p>
                <Button onClick={handleGenerate} disabled={loading} className="w-full">
                  {loading ? 'Se lansează...' : `Confirmă — consumă ${approvedIds.size * CREDIT_PER_THEME} credite`}
                </Button>
              </CardContent>
            </Card>
          )}

          {stage === 'generating' && (
            <div className="p-4 bg-muted rounded-md text-sm text-center">
              ⏳ Se generează conținut pentru {approvedIds.size} teme...
            </div>
          )}
        </div>
      )}

      {message && stage !== 'done' && (
        <div className={`p-3 rounded-md text-sm ${
          messageType === 'error' ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-muted'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
