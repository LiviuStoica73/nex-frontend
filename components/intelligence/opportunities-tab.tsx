// components/intelligence/opportunities-tab.tsx
// Version: 3.0.0 — 2026-07-11
// Scope: Oportunități — generare prototip inline + bulk, review, publicare în Calendar

'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap } from 'lucide-react'
import { useOrg } from '@/contexts/org-context'
import {
  countOpportunities,
  editOpportunity,
  generateBulkPrototypes,
  generatePrototype,
  getConnectedPlatforms,
  listOpportunities,
  publishOpportunities,
  reorderOpportunities,
  updateOpportunityStatus,
} from '@/lib/api/intelligence'
import { OpportunityCard } from './opportunity-card'
import type { ContentOpportunity } from '@/lib/api/intelligence'

export interface SelectedOpportunity {
  id: string
  title: string
  hook: string | null
}

type Opportunity = ContentOpportunity & {
  pillar?: string | null
  objective?: string | null
  insight?: string | null
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  idea: { label: 'Idee', variant: 'secondary' },
  generating: { label: 'Se generează', variant: 'outline' },
  review: { label: 'Verifică', variant: 'default' },
  rejected: { label: 'Respins', variant: 'destructive' },
  published: { label: 'Publicat', variant: 'secondary' },
  // legacy
  approved: { label: 'Aprobat', variant: 'default' },
  paused: { label: 'Pauză', variant: 'outline' },
  selected: { label: 'Selectat', variant: 'default' },
  in_production: { label: 'În producție', variant: 'default' },
}

const STATUS_FILTERS = [
  { value: '', label: 'Toate' },
  { value: 'idea', label: 'Idei' },
  { value: 'generating', label: 'Se generează' },
  { value: 'review', label: 'De verificat' },
  { value: 'published', label: 'Publicate' },
  { value: 'rejected', label: 'Respinse' },
]

// Stări care folosesc OpportunityCard în loc de rândul text clasic
const CARD_STATUSES = new Set(['generating', 'review', 'published', 'rejected'])

const ALL_PLATFORMS = ['instagram', 'facebook', 'linkedin', 'x', 'youtube', 'tiktok', 'threads', 'bluesky', 'discord', 'pinterest', 'blog']
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface OpportunitiesTabProps {
  selectedIds: Set<string>
  onToggleSelect: (opp: SelectedOpportunity) => void
  onGoToAutopilot: () => void
}

export function OpportunitiesTab({ selectedIds, onToggleSelect, onGoToAutopilot }: OpportunitiesTabProps) {
  // selectedIds din props = pentru fluxul vechi Autopilot (păstrat pentru compatibilitate)
  // bulkGenerateIds = selecție locală pentru bulk generate prototip
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [textFilter, setTextFilter] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<Partial<Opportunity & { platformsEdit: string[] }>>({})
  const [saving, setSaving] = useState(false)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [bulkGenerateIds, setBulkGenerateIds] = useState<Set<string>>(new Set())
  const reorderTimerRef = useRef<NodeJS.Timeout | null>(null)

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId

  const loadPage = useCallback(async (p: number, sf: string, ps = pageSize) => {
    if (!token || !orgId) return
    setLoading(true)
    try {
      const [data, countData] = await Promise.all([
        listOpportunities(orgId, token, p, ps, sf || undefined),
        countOpportunities(orgId, token, sf || undefined),
      ])
      setOpportunities(data)
      setTotal(countData.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token, orgId])

  useEffect(() => {
    loadPage(page, statusFilter, pageSize)
  }, [loadPage, page, statusFilter, pageSize])

  useEffect(() => {
    if (!token || !orgId) return
    getConnectedPlatforms(orgId, token)
      .then(platforms => setConnectedPlatforms(platforms.length > 0 ? platforms : ALL_PLATFORMS))
      .catch(() => setConnectedPlatforms(ALL_PLATFORMS))
  }, [token, orgId])

  // Polling global la 5s dacă există oportunități generating în lista curentă
  // sau dacă a fost declanșat manual (generatingAnywhere)
  const [generatingAnywhere, setGeneratingAnywhere] = useState(false)

  useEffect(() => {
    const hasGenerating = opportunities.some(o => o.status === 'generating') || generatingAnywhere
    if (!hasGenerating) return
    const interval = setInterval(async () => {
      await loadPage(page, statusFilter, pageSize)
      // Detectează tranziții generating→review pentru a opri polling-ul
      setOpportunities(current => {
        const stillGenerating = current.some(o => o.status === 'generating')
        if (!stillGenerating) setGeneratingAnywhere(false)
        return current
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [opportunities, generatingAnywhere, page, statusFilter, pageSize, loadPage])

  const handleGenerate = async (oppId: string) => {
    if (!token || !orgId) return
    setOpportunities(os => os.map(o => o.id === oppId ? { ...o, status: 'generating' } : o))
    setGeneratingAnywhere(true)
    try {
      await generatePrototype(orgId, oppId, token)
    } catch (e) {
      console.error('Generate failed', e)
      setOpportunities(os => os.map(o => o.id === oppId ? { ...o, status: 'idea' } : o))
      setGeneratingAnywhere(false)
    }
  }

  const handleBulkGenerate = async () => {
    if (!token || !orgId || bulkGenerateIds.size === 0) return
    const ids = Array.from(bulkGenerateIds)
    setOpportunities(os => os.map(o => ids.includes(o.id) ? { ...o, status: 'generating' } : o))
    setBulkGenerateIds(new Set())
    setGeneratingAnywhere(true)
    try {
      await generateBulkPrototypes(orgId, ids, token)
    } catch (e) {
      console.error('Bulk generate failed', e)
    }
  }

  const handlePublish = async (oppId: string) => {
    if (!token || !orgId) return
    setOpportunities(os => os.map(o => o.id === oppId ? { ...o, status: 'published' } : o))
    try {
      await publishOpportunities(orgId, [oppId], token)
    } catch (e) {
      console.error('Publish failed', e)
      setOpportunities(os => os.map(o => o.id === oppId ? { ...o, status: 'review' } : o))
    }
  }

  const handleRestore = async (oppId: string) => {
    if (!token || !orgId) return
    setOpportunities(os => os.map(o => o.id === oppId ? { ...o, status: 'idea' } : o))
    try {
      await updateOpportunityStatus(orgId, oppId, 'idea', token)
    } catch (e) {
      console.error('Restore failed', e)
    }
  }

  const handleStatusChange = async (opp: Opportunity, newStatus: string) => {
    if (!token || !orgId) return
    const prev = opp.status
    setOpportunities(os => os.map(o => o.id === opp.id ? { ...o, status: newStatus } : o))
    try {
      await updateOpportunityStatus(orgId, opp.id, newStatus, token)
    } catch {
      setOpportunities(os => os.map(o => o.id === opp.id ? { ...o, status: prev } : o))
    }
  }

  const handleEditSave = async (opp: Opportunity) => {
    if (!token || !orgId) return
    setSaving(true)
    try {
      const { platformsEdit } = editFields
      const payload: { title?: string; hook?: string; insight?: string; pillar?: string; platforms?: string[]; format?: string } = {}
      if (editFields.title !== undefined) payload.title = editFields.title
      if (editFields.hook !== undefined && editFields.hook !== null) payload.hook = editFields.hook
      if (editFields.insight !== undefined && editFields.insight !== null) payload.insight = editFields.insight
      if (editFields.pillar !== undefined && editFields.pillar !== null) payload.pillar = editFields.pillar
      if (editFields.format !== undefined && editFields.format !== null) payload.format = editFields.format
      if (platformsEdit !== undefined) payload.platforms = platformsEdit
      const updated = await editOpportunity(orgId, opp.id, payload, token)
      setOpportunities(os => os.map(o => o.id === opp.id ? updated : o))
      setEditingId(null)
      setEditFields({})
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= opportunities.length) return

    const newList = [...opportunities]
    ;[newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]]
    setOpportunities(newList)

    // Debounce: trimite noile scoruri după 800ms de inactivitate
    if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current)
    reorderTimerRef.current = setTimeout(async () => {
      if (!token || !orgId) return
      const totalOpp = (page - 1) * pageSize + newList.length
      const items = newList.map((o, i) => ({
        id: o.id,
        score: totalOpp - ((page - 1) * pageSize) - i,
      }))
      try {
        await reorderOpportunities(orgId, items, token)
      } catch (e) {
        console.error('Reorder failed', e)
      }
    }, 800)
  }

  const toggleEditPlatform = (platform: string) => {
    const current = editFields.platformsEdit ?? []
    const next = current.includes(platform)
      ? current.filter(p => p !== platform)
      : [...current, platform]
    setEditFields(f => ({ ...f, platformsEdit: next }))
  }

  const filtered = textFilter
    ? opportunities.filter(o =>
        o.title.toLowerCase().includes(textFilter.toLowerCase()) ||
        o.pillar?.toLowerCase().includes(textFilter.toLowerCase())
      )
    : opportunities

  const totalPages = Math.ceil(total / pageSize)

  if (loading && opportunities.length === 0) {
    return <div className="text-muted-foreground py-8 text-center">Se încarcă oportunitățile...</div>
  }

  if (!loading && total === 0 && !statusFilter) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nu există oportunități. Generează o strategie din tab-ul Business Brain.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(sf => (
            <Button
              key={sf.value}
              size="sm"
              variant={statusFilter === sf.value ? 'default' : 'outline'}
              onClick={() => { setStatusFilter(sf.value); setPage(1) }}
            >
              {sf.label}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Caută după titlu sau pilon..."
          value={textFilter}
          onChange={e => setTextFilter(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Bara bulk generate */}
      {bulkGenerateIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
          <span className="text-sm font-medium">{bulkGenerateIds.size} selectate</span>
          <Button size="sm" onClick={handleBulkGenerate}>
            <Zap className="h-3 w-3 mr-1" />
            Generează {bulkGenerateIds.size === 1 ? 'prototip' : 'prototipuri'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setBulkGenerateIds(new Set())}>
            Deselectează
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total === 0 && statusFilter
            ? <span>Nicio oportunitate cu statusul „{STATUS_FILTERS.find(s => s.value === statusFilter)?.label}". <button className="underline" onClick={() => setStatusFilter('')}>Vezi toate</button></span>
            : <>{total} oportunități · pagina {page}/{totalPages || 1}{loading && ' · se actualizează...'}</>
          }
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Afișează:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="border rounded px-1 py-0.5 text-sm bg-background"
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n} / pagină</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((opp, index) => {
          // Oportunități cu prototip (generating/review/published/rejected) → OpportunityCard
          if (CARD_STATUSES.has(opp.status)) {
            const rank = (page - 1) * pageSize + index + 1
            return (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                rank={rank}
                selected={false}
                onSelect={() => {}}
                onGenerate={handleGenerate}
                onPublish={handlePublish}
                onReject={(_id) => handleStatusChange(opp, 'rejected')}
                onRestore={handleRestore}
                onReset={handleRestore}
                orgId={orgId!}
                token={token}
              />
            )
          }

          // Idei → rândul text clasic cu checkbox bulk generate
          const isEditing = editingId === opp.id
          const isBulkSelected = bulkGenerateIds.has(opp.id)
          const statusMeta = STATUS_LABELS[opp.status] || { label: opp.status, variant: 'secondary' as const }
          const rank = (page - 1) * pageSize + index + 1
          const editPlatforms = editFields.platformsEdit ?? opp.platforms

          return (
            <Card
              key={opp.id}
              className={`transition-all ${isBulkSelected ? 'ring-2 ring-primary' : ''}`}
            >
              <CardContent className="py-3 space-y-2">
                <div className="flex items-start gap-2">
                  {/* Checkbox bulk generate */}
                  <input
                    type="checkbox"
                    checked={isBulkSelected}
                    onChange={e => {
                      setBulkGenerateIds(prev => {
                        const next = new Set(prev)
                        e.target.checked ? next.add(opp.id) : next.delete(opp.id)
                        return next
                      })
                    }}
                    className="mt-1.5 cursor-pointer shrink-0"
                    title="Selectează pentru generare bulk"
                  />

                  {/* Săgeți reordonare */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none px-0.5"
                      title="Mută sus"
                    >▲</button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === filtered.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none px-0.5"
                      title="Mută jos"
                    >▼</button>
                  </div>

                  {/* Conținut principal */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0">#{rank}</span>
                        {isEditing ? (
                          <textarea
                            value={editFields.title ?? opp.title}
                            onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                            className="flex-1 text-sm font-medium border rounded-md px-2 py-1 resize-none min-h-[60px] bg-background"
                            rows={2}
                          />
                        ) : (
                          <span className="text-sm font-medium">{opp.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {opp.score !== null && (
                          <Badge variant="outline" className="text-xs">{opp.score}</Badge>
                        )}
                        <Badge variant={statusMeta.variant} className="text-xs">
                          {statusMeta.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Hook */}
                    {isEditing ? (
                      <textarea
                        value={editFields.hook ?? opp.hook ?? ''}
                        onChange={e => setEditFields(f => ({ ...f, hook: e.target.value }))}
                        placeholder="Hook (fraza de deschidere)..."
                        className="w-full text-xs border rounded-md px-2 py-1 resize-none min-h-[48px] bg-background text-muted-foreground"
                        rows={2}
                      />
                    ) : (
                      opp.hook && <p className="text-xs text-muted-foreground">{opp.hook}</p>
                    )}

                    {/* Platforme */}
                    {isEditing ? (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Platforme:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ALL_PLATFORMS.filter(p =>
                            connectedPlatforms.includes(p) || opp.platforms.includes(p)
                          ).map(p => (
                            <button
                              key={p}
                              onClick={() => toggleEditPlatform(p)}
                              className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                                editPlatforms.includes(p)
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background text-muted-foreground border-muted-foreground/30 hover:border-primary/50'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1 flex-wrap">
                        {opp.pillar && <Badge variant="secondary" className="text-xs">{opp.pillar}</Badge>}
                        {opp.format && <Badge variant="outline" className="text-xs">{opp.format}</Badge>}
                        {opp.platforms.map(p => (
                          <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Acțiuni */}
                    <div className="flex gap-1.5 flex-wrap">
                      {!isEditing ? (
                        <>
                          <Button size="sm" variant="outline" className="h-6 text-xs"
                            onClick={() => handleGenerate(opp.id)}>
                            ⚡ Generează prototip
                          </Button>
                          {opp.status !== 'rejected' && (
                            <Button size="sm" variant="outline" className="h-6 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleStatusChange(opp, 'rejected')}>
                              ✕ Respinge
                            </Button>
                          )}
                          {opp.status === 'rejected' && (
                            <Button size="sm" variant="outline" className="h-6 text-xs"
                              onClick={() => handleStatusChange(opp, 'idea')}>
                              ↩ Restabilește
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 text-xs"
                            onClick={() => { setEditingId(opp.id); setEditFields({ platformsEdit: [...opp.platforms] }) }}>
                            ✎ Editează
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" className="h-7 text-xs" disabled={saving}
                            onClick={() => handleEditSave(opp)}>
                            {saving ? 'Se salvează...' : 'Salvează'}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => { setEditingId(null); setEditFields({}) }}>
                            Anulează
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Paginație */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            ← Anterior
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Următor →
          </Button>
        </div>
      )}
    </div>
  )
}
