// components/intelligence/autopilot-tab.tsx
// Version: 3.0.0 — 2026-07-11
// Scope: Campaign Autopilot cu 3 etape:
//   Etapa 1 (gratuit): propune teme din oportunități selectate
//   Etapa 2 (credite): generează prototip text + imagine per temă
//   Etapa 3: review vizual, editare text/prompt, aprobare → publicare în Calendar

'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useOrg } from '@/contexts/org-context'
import {
  generatePrototypes, getPrototypes, proposeThemes, publishApprovedDrafts, regenerateImage,
  type AutopilotDraft,
} from '@/lib/api/intelligence'
import type { AutopilotStage, SelectedOpportunity, Theme } from '@/app/(protected)/dashboard/intelligence/page'

const CREDIT_PER_THEME = 5
const THEMES_PER_PAGE = 10

const APPROVAL_FILTERS = [
  { value: 'all', label: 'Toate' },
  { value: 'approved', label: 'Aprobate' },
  { value: 'pending', label: 'Neaprobate' },
]

interface AutopilotTabProps {
  selectedOpportunities: SelectedOpportunity[]
  onClearSelected: () => void
  onRemoveSelected: (id: string) => void
  themes: Theme[]
  onThemesChange: (themes: Theme[]) => void
  stage: AutopilotStage
  onStageChange: (stage: AutopilotStage) => void
  approvedIds: Set<string>
  onApprovedIdsChange: (ids: Set<string>) => void
}

export function AutopilotTab({
  selectedOpportunities,
  onClearSelected,
  onRemoveSelected,
  themes,
  onThemesChange,
  stage,
  onStageChange,
  approvedIds,
  onApprovedIdsChange,
}: AutopilotTabProps) {
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [approvalFilter, setApprovalFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [themePage, setThemePage] = useState(1)

  // Etapa 3 — drafturi prototip
  const [drafts, setDrafts] = useState<AutopilotDraft[]>([])
  const [editTexts, setEditTexts] = useState<Record<string, string>>({})
  const [editPrompts, setEditPrompts] = useState<Record<string, string>>({})
  const [approvedDraftIds, setApprovedDraftIds] = useState<Set<string>>(new Set())
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId
  const hasSelected = selectedOpportunities.length > 0

  // Polling pentru drafturi după lansare generare
  const pollDrafts = useCallback(async (expectedCount: number) => {
    if (!token || !orgId) return
    try {
      const result = await getPrototypes(orgId, token)
      setDrafts(result)
      if (result.length >= expectedCount) {
        // Inițializează editTexts și editPrompts cu valorile generate
        const texts: Record<string, string> = {}
        const prompts: Record<string, string> = {}
        for (const d of result) {
          texts[d.id] = d.master_text
          prompts[d.id] = d.image_prompt || ''
        }
        setEditTexts(texts)
        setEditPrompts(prompts)
        // Aprobă toate implicit
        setApprovedDraftIds(new Set(result.map(d => d.id)))
        onStageChange('review')
        if (pollingRef.current) clearTimeout(pollingRef.current)
      } else {
        pollingRef.current = setTimeout(() => pollDrafts(expectedCount), 4000)
      }
    } catch {
      pollingRef.current = setTimeout(() => pollDrafts(expectedCount), 6000)
    }
  }, [token, orgId, onStageChange])

  useEffect(() => {
    return () => { if (pollingRef.current) clearTimeout(pollingRef.current) }
  }, [])

  // Etapa 1 — propune teme
  const handleProposeThemes = async () => {
    if (!token || !orgId || !hasSelected) return
    setLoading(true)
    setMessage('')
    try {
      const ids = selectedOpportunities.map(o => o.id)
      const result = await proposeThemes(orgId, ids, token)
      const newThemes: Theme[] = result.themes || []
      onThemesChange(newThemes)
      onApprovedIdsChange(new Set(newThemes.map((t: Theme) => t.opportunity_id)))
      onStageChange('etapa1')
      onClearSelected()
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

  // Etapa 2 — generare prototipuri
  const handleGeneratePrototypes = async () => {
    if (!token || !orgId || approvedIds.size === 0) return
    setLoading(true)
    onStageChange('generating')
    setMessage('')
    try {
      const approved = themes.filter(t => approvedIds.has(t.opportunity_id))
      const themesPayload = approved.map(t => ({
        opportunity_id: t.opportunity_id,
        title: t.title,
        hook: t.hook,
        visual_category: t.visual_category,
      }))
      await generatePrototypes(orgId, themesPayload, token)
      // Polling până apar draft-urile
      pollDrafts(approved.length)
    } catch (e: any) {
      setMessage(`Eroare: ${e.message}`)
      setMessageType('error')
      onStageChange('etapa1')
    } finally {
      setLoading(false)
    }
  }

  // Etapa 3 — regenerare imagine
  const handleRegenerateImage = async (draft: AutopilotDraft) => {
    if (!token || !orgId) return
    setRegeneratingId(draft.id)
    try {
      const result = await regenerateImage(orgId, draft.id, editPrompts[draft.id] || draft.image_prompt || '', token)
      setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, image_url: result.image_url, image_prompt: result.image_prompt } : d))
      setEditPrompts(prev => ({ ...prev, [draft.id]: result.image_prompt }))
    } catch (e: any) {
      setMessage(`Eroare regenerare imagine: ${e.message}`)
      setMessageType('error')
    } finally {
      setRegeneratingId(null)
    }
  }

  const toggleApproveDraft = (id: string) => {
    setApprovedDraftIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Etapa 3 — publicare în Calendar
  const handlePublish = async () => {
    if (!token || !orgId || approvedDraftIds.size === 0) return
    setLoading(true)
    onStageChange('publishing')
    try {
      const payload = drafts
        .filter(d => approvedDraftIds.has(d.id))
        .map(d => ({ draft_id: d.id, master_text: editTexts[d.id] || d.master_text }))
      const result = await publishApprovedDrafts(orgId, payload, token)
      onStageChange('done')
      setMessage(`✓ ${approvedDraftIds.size} teme publicate în Calendar. Campania a fost creată.`)
      setMessageType('success')
    } catch (e: any) {
      setMessage(`Eroare publicare: ${e.message}`)
      setMessageType('error')
      onStageChange('review')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    onStageChange('idle')
    onThemesChange([])
    onApprovedIdsChange(new Set())
    onClearSelected()
    setDrafts([])
    setEditTexts({})
    setEditPrompts({})
    setApprovedDraftIds(new Set())
    setMessage('')
    setSearchText('')
    setApprovalFilter('all')
    setThemePage(1)
  }

  // Filtrare teme (Etapa 1)
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
            Etapa 1 (gratuit): propune teme · Etapa 2 (credite): generează prototip text + imagine · Etapa 3: review și publicare în Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stage === 'idle' && (
            <div className="space-y-3">
              {hasSelected ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {selectedOpportunities.length} oportunități selectate
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        · cost estimat Etapa 2: {selectedOpportunities.length * CREDIT_PER_THEME} credite
                      </span>
                    </p>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={onClearSelected}>
                      Șterge toate
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {selectedOpportunities.map(opp => (
                      <div key={opp.id} className="flex items-start justify-between gap-2 p-2.5 bg-muted/50 rounded-md border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{opp.title}</p>
                          {opp.hook && <p className="text-xs text-muted-foreground truncate mt-0.5">{opp.hook}</p>}
                        </div>
                        <button onClick={() => onRemoveSelected(opp.id)}
                          className="text-muted-foreground hover:text-destructive text-xs shrink-0 px-1" title="Elimină">✕</button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleProposeThemes} disabled={loading} size="lg" className="w-full">
                    {loading ? 'Se generează propunerile...' : `Propune teme din ${selectedOpportunities.length} oportunități — Etapa 1 (gratuit)`}
                  </Button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Nu ai oportunități selectate.</p>
                  <p>Du-te în <strong>Oportunități</strong>, bifează oportunitățile cu checkbox — selecția se păstrează automat.</p>
                </div>
              )}
            </div>
          )}

          {stage === 'done' && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md text-sm text-green-800 dark:text-green-200">
                {message}
              </div>
              <Button variant="outline" onClick={handleReset}>Pornește o nouă rundă Autopilot</Button>
            </div>
          )}

          {stage === 'publishing' && (
            <div className="p-4 bg-muted rounded-md text-sm text-center">
              ⏳ Se publică în Calendar...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Etapa 1 — teme propuse */}
      {(stage === 'etapa1' || stage === 'etapa2' || stage === 'generating') && themes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold">Etapa 1 — Teme propuse ({approvedIds.size}/{themes.length} aprobate)</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onApprovedIdsChange(new Set(themes.map(t => t.opportunity_id)))}>Aprobă toate</Button>
              <Button size="sm" variant="ghost" onClick={() => onApprovedIdsChange(new Set())}>Deselectează</Button>
              <Button size="sm" variant="ghost" onClick={handleReset}>✕ Resetează</Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {APPROVAL_FILTERS.map(f => (
              <Button key={f.value} size="sm" variant={approvalFilter === f.value ? 'default' : 'outline'}
                onClick={() => { setApprovalFilter(f.value); setThemePage(1) }}>
                {f.label}
              </Button>
            ))}
            <Input placeholder="Caută temă..." value={searchText}
              onChange={e => { setSearchText(e.target.value); setThemePage(1) }}
              className="w-52 h-8 text-sm" />
            <span className="text-xs text-muted-foreground ml-auto">{filteredThemes.length} teme · pagina {themePage}/{totalThemePages || 1}</span>
          </div>

          {pagedThemes.map(theme => {
            const isApproved = approvedIds.has(theme.opportunity_id)
            return (
              <Card key={theme.opportunity_id}
                className={`cursor-pointer transition-all ${isApproved ? 'ring-2 ring-primary bg-primary/5' : 'opacity-60'}`}
                onClick={() => toggleApprove(theme.opportunity_id)}>
                <CardContent className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <span className="text-sm font-medium">{theme.title}</span>
                    {theme.hook && <p className="text-xs text-muted-foreground">{theme.hook}</p>}
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{theme.visual_category}</Badge>
                      {theme.pillar && <Badge variant="secondary" className="text-xs">{theme.pillar}</Badge>}
                      {theme.format && <Badge variant="outline" className="text-xs">{theme.format}</Badge>}
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

          {totalThemePages > 1 && (
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="outline" disabled={themePage === 1} onClick={() => setThemePage(p => p - 1)}>← Anterior</Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">{themePage}/{totalThemePages}</span>
              <Button size="sm" variant="outline" disabled={themePage === totalThemePages} onClick={() => setThemePage(p => p + 1)}>Următor →</Button>
            </div>
          )}

          {stage !== 'generating' && approvedIds.size > 0 && (
            <Card className="border-amber-400 dark:border-amber-600">
              <CardContent className="py-4 space-y-3">
                <div className="font-semibold">Etapa 2 — Generare prototipuri</div>
                <div className="text-sm space-y-1">
                  <div>Teme aprobate: <strong>{approvedIds.size}</strong></div>
                  <div>Cost: <strong>{approvedIds.size * CREDIT_PER_THEME} credite</strong> ({approvedIds.size} × {CREDIT_PER_THEME}cr)</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se generează un post master (text + imagine prototip) per temă. Vei putea edita și aproba înainte de publicare.
                </p>
                <Button onClick={handleGeneratePrototypes} disabled={loading} className="w-full">
                  {loading ? 'Se lansează...' : `Generează prototipuri — ${approvedIds.size * CREDIT_PER_THEME} credite`}
                </Button>
              </CardContent>
            </Card>
          )}

          {stage === 'generating' && (
            <div className="p-4 bg-muted rounded-md text-sm text-center space-y-2">
              <div>⏳ Se generează prototipurile pentru {approvedIds.size} teme...</div>
              <div className="text-xs text-muted-foreground">Durată estimată: {approvedIds.size * 20}–{approvedIds.size * 40} secunde</div>
            </div>
          )}
        </div>
      )}

      {/* Etapa 3 — Review prototipuri */}
      {stage === 'review' && drafts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold">Etapa 3 — Review prototipuri ({approvedDraftIds.size}/{drafts.length} aprobate)</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setApprovedDraftIds(new Set(drafts.map(d => d.id)))}>Aprobă toate</Button>
              <Button size="sm" variant="ghost" onClick={() => setApprovedDraftIds(new Set())}>Deselectează</Button>
              <Button size="sm" variant="ghost" onClick={handleReset}>✕ Resetează</Button>
            </div>
          </div>

          {drafts.map(draft => {
            const isApproved = approvedDraftIds.has(draft.id)
            const isRegenerating = regeneratingId === draft.id
            return (
              <Card key={draft.id} className={`transition-all ${isApproved ? 'ring-2 ring-primary' : 'opacity-75'}`}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{draft.title}</p>
                      {draft.hook && <p className="text-xs text-muted-foreground mt-0.5">{draft.hook}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant={isApproved ? 'default' : 'outline'}
                      onClick={() => toggleApproveDraft(draft.id)}
                    >
                      {isApproved ? '✓ Aprobat' : 'Aprobă'}
                    </Button>
                  </div>

                  {/* Imagine prototip */}
                  {draft.image_url ? (
                    <div className="relative">
                      <img
                        src={draft.image_url}
                        alt={draft.title}
                        className="w-full max-h-64 object-cover rounded-md"
                      />
                      {isRegenerating && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-md text-sm">
                          ⏳ Se regenerează...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
                      {isRegenerating ? '⏳ Se generează imaginea...' : 'Imaginea nu a putut fi generată'}
                    </div>
                  )}

                  {/* Edit prompt imagine */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Prompt imagine</label>
                    <div className="flex gap-2">
                      <Input
                        value={editPrompts[draft.id] ?? (draft.image_prompt || '')}
                        onChange={e => setEditPrompts(prev => ({ ...prev, [draft.id]: e.target.value }))}
                        className="text-xs h-8"
                        placeholder="Editează promptul de imagine..."
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRegenerateImage(draft)}
                        disabled={isRegenerating}
                      >
                        🔄 Regenerează
                      </Button>
                    </div>
                  </div>

                  {/* Text editabil */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Text postare (master)</label>
                    <Textarea
                      value={editTexts[draft.id] ?? draft.master_text}
                      onChange={e => setEditTexts(prev => ({ ...prev, [draft.id]: e.target.value }))}
                      className="text-sm min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Buton publicare */}
          {approvedDraftIds.size > 0 && (
            <Card className="border-green-400 dark:border-green-600">
              <CardContent className="py-4 space-y-3">
                <div className="font-semibold">Publică în Calendar</div>
                <p className="text-sm text-muted-foreground">
                  {approvedDraftIds.size} teme aprobate vor fi publicate într-o campanie nouă "Autopilot {new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })}".
                  Variantele per conector se generează automat la best time.
                </p>
                <Button onClick={handlePublish} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                  {loading ? 'Se publică...' : `Publică ${approvedDraftIds.size} teme în Calendar`}
                </Button>
              </CardContent>
            </Card>
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
