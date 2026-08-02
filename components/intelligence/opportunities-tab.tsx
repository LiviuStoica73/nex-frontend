// components/intelligence/opportunities-tab.tsx
// Version: 3.0.0 — 2026-07-11
// Scope: Oportunități — generare prototip inline + bulk, review, publicare în Calendar

'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles, Zap } from 'lucide-react'
import { Paginator } from './paginator'
import { useOrg } from '@/contexts/org-context'
import {
  countOpportunities,
  createOpportunity,
  editOpportunity,
  generateBulkPrototypes,
  generatePrototype,
  getConnectedPlatforms,
  listOpportunities,
  publishOpportunities,
  reorderOpportunities,
  updateOpportunityStatus,
  generateIdeas,
} from '@/lib/api/intelligence'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

const STATUS_LABELS: Record<string, { labelKey: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  idea: { labelKey: 'statuses.idea', variant: 'secondary' },
  generating: { labelKey: 'statuses.generating', variant: 'outline' },
  review: { labelKey: 'statuses.review', variant: 'default' },
  rejected: { labelKey: 'statuses.rejected', variant: 'destructive' },
  published: { labelKey: 'statuses.published', variant: 'secondary' },
  // legacy
  approved: { labelKey: 'statuses.approved', variant: 'default' },
  paused: { labelKey: 'statuses.paused', variant: 'outline' },
  selected: { labelKey: 'statuses.selected', variant: 'default' },
  in_production: { labelKey: 'statuses.in_production', variant: 'default' },
}

const STATUS_FILTERS = [
  { value: '', labelKey: 'filters.all' },
  { value: 'idea', labelKey: 'filters.ideas' },
  { value: 'generating', labelKey: 'filters.generating' },
  { value: 'review', labelKey: 'filters.review' },
  { value: 'published', labelKey: 'filters.published' },
  { value: 'rejected', labelKey: 'filters.rejected' },
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
  const t = useTranslations('opportunities')
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
  const [ideaCount, setIdeaCount] = useState<string>('10')
  const [ideaFocus, setIdeaFocus] = useState<string>('')
  const [generatingIdeas, setGeneratingIdeas] = useState(false)
  const [ideasMessage, setIdeasMessage] = useState('')
  const reorderTimerRef = useRef<NodeJS.Timeout | null>(null)
  const searchParams = useSearchParams()
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('new') === 'true')
  const [createFields, setCreateFields] = useState({ title: '', hook: '', image_prompt: '', pillar: '', platforms: [] as string[] })
  const [creating, setCreating] = useState(false)

  // Deschide formularul automat când vine cu ?new=true din butonul de sidebar
  useEffect(() => {
    if (searchParams.get('new') === 'true') setShowCreateForm(true)
  }, [searchParams])

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
    // Include și blog connectors ca platformă normală
    Promise.all([
      getConnectedPlatforms(orgId, token).catch(() => [] as string[]),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/orgs/${orgId}/blog-connectors`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).catch(() => []) as Promise<Array<{ is_active: boolean }>>
    ]).then(([platforms, blogConnectors]) => {
      const hasBlog = (Array.isArray(blogConnectors) ? blogConnectors : []).some(c => c.is_active)
      const all = hasBlog ? [...platforms, 'blog'] : platforms
      setConnectedPlatforms(all.length > 0 ? [...new Set(all)] : ALL_PLATFORMS)
    }).catch(() => setConnectedPlatforms(ALL_PLATFORMS))
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

  const handleGenerateIdeas = async () => {
    if (!token || !orgId) return
    setGeneratingIdeas(true)
    setIdeasMessage('')
    try {
      await generateIdeas(orgId, parseInt(ideaCount), token, ideaFocus || undefined)
      setIdeasMessage(t('ideas_generating_message', { count: ideaCount }))
      setTimeout(() => {
        loadPage(1, statusFilter)
        setIdeasMessage('')
      }, 90000)
    } catch (e: any) {
      setIdeasMessage(t('error_with_message', { message: e.message }))
    } finally {
      setGeneratingIdeas(false)
    }
  }

  const handleBulkPublish = async (ids: string[]) => {
    if (!token || !orgId || ids.length === 0) return
    if (!confirm(t('confirm_bulk_publish', { count: ids.length }))) return
    setOpportunities(os => os.map(o => ids.includes(o.id) ? { ...o, status: 'published' } : o))
    try {
      const result = await publishOpportunities(orgId, ids, token)
      if (result?.campaign_id) {
        window.location.href = `/dashboard/calendar`
      }
    } catch (e) {
      console.error('Bulk publish failed', e)
      setOpportunities(os => os.map(o => ids.includes(o.id) ? { ...o, status: 'review' } : o))
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

  const PILLAR_OPTIONS = ['educational', 'promotional', 'storytelling', 'behind-the-scenes', 'seasonal', 'community', 'authority']

  const handleCreate = async () => {
    if (!token || !orgId || !createFields.title.trim()) return
    setCreating(true)
    try {
      const newOpp = await createOpportunity(orgId, {
        title: createFields.title.trim(),
        hook: createFields.hook.trim() || undefined,
        image_prompt_raw: createFields.image_prompt.trim() || undefined,
        pillar: createFields.pillar || undefined,
        platforms: createFields.platforms.length > 0 ? createFields.platforms : connectedPlatforms,
      }, token)
      setOpportunities(os => [newOpp, ...os])
      setTotal(t => t + 1)
      setCreateFields({ title: '', hook: '', image_prompt: '', pillar: '', platforms: [] })
      setShowCreateForm(false)
    } catch (e) {
      console.error('Create failed', e)
    } finally {
      setCreating(false)
    }
  }

  const filtered = textFilter
    ? opportunities.filter(o =>
        o.title.toLowerCase().includes(textFilter.toLowerCase()) ||
        o.pillar?.toLowerCase().includes(textFilter.toLowerCase())
      )
    : opportunities

  const totalPages = Math.ceil(total / pageSize)

  const FOCUS_CHIPS = [
    { label: t('focus_chips.app_features.label'), value: t('focus_chips.app_features.value') },
    { label: t('focus_chips.use_cases.label'), value: t('focus_chips.use_cases.value') },
    { label: t('focus_chips.before_after.label'), value: t('focus_chips.before_after.value') },
    { label: t('focus_chips.tutorials.label'), value: t('focus_chips.tutorials.value') },
  ]

  if (loading && opportunities.length === 0) {
    return <div className="text-muted-foreground py-8 text-center">{t('loading_opportunities')}</div>
  }

  if (!loading && total === 0 && !statusFilter) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {FOCUS_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => setIdeaFocus(f => f === chip.value ? '' : chip.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${ideaFocus === chip.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-transparent hover:border-primary/40'}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <textarea
            placeholder={t('idea_focus_placeholder')}
            value={ideaFocus}
            onChange={e => setIdeaFocus(e.target.value)}
            className="w-full text-xs border rounded-md px-3 py-2 resize-none bg-background text-foreground min-h-[56px]"
            rows={2}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={ideaCount} onValueChange={setIdeaCount}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 idei</SelectItem>
              <SelectItem value="10">10 idei</SelectItem>
              <SelectItem value="25">25 idei</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleGenerateIdeas} disabled={generatingIdeas}>
            <Sparkles className="h-3 w-3 mr-1" />
            {generatingIdeas ? t('launching') : t('generate_ideas')}
          </Button>
          {ideasMessage && <span className="text-xs text-muted-foreground">{ideasMessage}</span>}
        </div>
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t('empty')}
        </div>
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
              {t(sf.labelKey)}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="border-dashed"
            onClick={() => { setShowCreateForm(v => !v); setCreateFields({ title: '', hook: '', image_prompt: '', pillar: '', platforms: [...connectedPlatforms] }) }}
          >
            {t('create_post')}
          </Button>
        </div>
        <Input
          placeholder={t('search_placeholder')}
          value={textFilter}
          onChange={e => setTextFilter(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Formular creare postare manuală */}
      {showCreateForm && (
        <Card className="border-primary/40">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{t('new_post')}</p>
              <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>
            <textarea
              placeholder={t('title_placeholder')}
              value={createFields.title}
              onChange={e => setCreateFields(f => ({ ...f, title: e.target.value }))}
              className="w-full text-sm border rounded-md px-3 py-2 resize-none min-h-[56px] bg-background"
              rows={2}
            />
            <textarea
              placeholder={t('hook_placeholder')}
              value={createFields.hook}
              onChange={e => setCreateFields(f => ({ ...f, hook: e.target.value }))}
              className="w-full text-xs border rounded-md px-3 py-2 resize-none bg-background text-muted-foreground"
              rows={2}
            />
            <textarea
              placeholder={t('visual_prompt_placeholder')}
              value={createFields.image_prompt}
              onChange={e => setCreateFields(f => ({ ...f, image_prompt: e.target.value }))}
              className="w-full text-xs border rounded-md px-3 py-2 resize-none bg-background text-muted-foreground"
              rows={2}
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('category_optional')}</p>
              <div className="flex flex-wrap gap-1.5">
                {PILLAR_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => setCreateFields(f => ({ ...f, pillar: f.pillar === p ? '' : p }))}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                      createFields.pillar === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-muted-foreground/30 hover:border-primary/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Platforme</p>
              <div className="flex flex-wrap gap-1.5">
                {connectedPlatforms.map(p => (
                  <button
                    key={p}
                    onClick={() => setCreateFields(f => ({
                      ...f,
                      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p]
                    }))}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                      createFields.platforms.includes(p)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-muted-foreground/30 hover:border-primary/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" disabled={creating || !createFields.title.trim()} onClick={handleCreate}>
                {creating ? t('creating') : t('save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreateForm(false)}>{t('cancel')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bara bulk generate */}
      {bulkGenerateIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-md flex-wrap">
          <span className="text-sm font-medium">{t('selected_count', { count: bulkGenerateIds.size })}</span>
          <Button size="sm" onClick={handleBulkGenerate}>
            <Zap className="h-3 w-3 mr-1" />
            {t('generate_prototypes_count', { count: bulkGenerateIds.size })}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setBulkGenerateIds(new Set())}>
            {t('deselect')}
          </Button>
        </div>
      )}

      {/* Generează idei noi */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {FOCUS_CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => setIdeaFocus(f => f === chip.value ? '' : chip.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${ideaFocus === chip.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-transparent hover:border-primary/40'}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <textarea
          placeholder={t('idea_focus_placeholder')}
          value={ideaFocus}
          onChange={e => setIdeaFocus(e.target.value)}
          className="w-full text-xs border rounded-md px-3 py-2 resize-none bg-background text-foreground min-h-[48px]"
          rows={2}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={ideaCount} onValueChange={setIdeaCount}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 idei</SelectItem>
              <SelectItem value="10">10 idei</SelectItem>
              <SelectItem value="25">25 idei</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleGenerateIdeas} disabled={generatingIdeas}>
            <Sparkles className="h-3 w-3 mr-1" />
            {generatingIdeas ? t('launching') : t('generate_ideas')}
          </Button>
          {ideasMessage && <span className="text-xs text-muted-foreground">{ideasMessage}</span>}
        </div>
      </div>

      {/* Publică toate de verificat */}
      {opportunities.filter(o => o.status === 'review').length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-md">
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {t('ready_to_publish_count', { count: opportunities.filter(o => o.status === 'review').length })}
          </span>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleBulkPublish(opportunities.filter(o => o.status === 'review').map(o => o.id))}
          >
            <Send className="h-3 w-3 mr-1" />
            {t('publish_all_to_calendar')}
          </Button>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        {total === 0 && statusFilter
          ? <span>{t('no_status_results', { status: t(STATUS_FILTERS.find(s => s.value === statusFilter)?.labelKey ?? 'filters.all') })} <button className="underline" onClick={() => setStatusFilter('')}>{t('view_all')}</button></span>
          : <>{t('opportunities_count', { count: total })}{loading && t('updating_suffix')}</>
        }
      </div>

      {/* Paginație sus */}
      <Paginator
        page={page}
        totalPages={totalPages || 1}
        onPageChange={p => setPage(p)}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={n => { setPageSize(n); setPage(1) }}
      />

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
                connectedPlatforms={connectedPlatforms}
              />
            )
          }

          // Idei → rândul text clasic cu checkbox bulk generate
          const isEditing = editingId === opp.id
          const isBulkSelected = bulkGenerateIds.has(opp.id)
          const statusMeta = STATUS_LABELS[opp.status] || { labelKey: '', variant: 'secondary' as const }
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
                    title={t('select_for_bulk')}
                  />

                  {/* Săgeți reordonare */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none px-0.5"
                      title={t('move_up')}
                    >▲</button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === filtered.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs leading-none px-0.5"
                      title={t('move_down')}
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
                          {statusMeta.labelKey ? t(statusMeta.labelKey) : opp.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Hook */}
                    {isEditing ? (
                      <textarea
                        value={editFields.hook ?? opp.hook ?? ''}
                        onChange={e => setEditFields(f => ({ ...f, hook: e.target.value }))}
                        placeholder={t('hook_edit_placeholder')}
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
                        {opp.platforms
                          .filter(p => connectedPlatforms.length === 0 || connectedPlatforms.includes(p))
                          .map(p => (
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
                            {t('generate_prototype')}
                          </Button>
                          {opp.status !== 'rejected' && (
                            <Button size="sm" variant="outline" className="h-6 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleStatusChange(opp, 'rejected')}>
                              {t('reject')}
                            </Button>
                          )}
                          {opp.status === 'rejected' && (
                            <Button size="sm" variant="outline" className="h-6 text-xs"
                              onClick={() => handleStatusChange(opp, 'idea')}>
                              {t('restore')}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 text-xs"
                            onClick={() => { setEditingId(opp.id); setEditFields({ platformsEdit: connectedPlatforms.length > 0 ? [...connectedPlatforms] : [...opp.platforms] }) }}>
                            {t('edit')}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" className="h-7 text-xs" disabled={saving}
                            onClick={() => handleEditSave(opp)}>
                            {saving ? t('saving') : t('save')}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => { setEditingId(null); setEditFields({}) }}>
                            {t('cancel')}
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

      {/* Paginație jos */}
      <Paginator
        page={page}
        totalPages={totalPages || 1}
        onPageChange={p => setPage(p)}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={n => { setPageSize(n); setPage(1) }}
      />
    </div>
  )
}
