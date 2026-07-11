// components/intelligence/opportunities-tab.tsx
// Version: 2.0.0 — 2026-07-11
// Scope: Oportunități cu workflow complet: aprobare/respingere/pauză, editare inline,
//        paginație, selectare pentru Autopilot, filtrare după status și text

'use client'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOrg } from '@/contexts/org-context'
import {
  countOpportunities,
  editOpportunity,
  listOpportunities,
  updateOpportunityStatus,
} from '@/lib/api/intelligence'

interface Opportunity {
  id: string
  title: string
  pillar: string | null
  objective: string | null
  hook: string | null
  insight: string | null
  format: string | null
  platforms: string[]
  score: number | null
  status: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  idea: { label: 'Idee', color: 'secondary' },
  approved: { label: 'Aprobat', color: 'default' },
  paused: { label: 'Pauză', color: 'outline' },
  rejected: { label: 'Respins', color: 'destructive' },
  selected: { label: 'Selectat', color: 'default' },
  in_production: { label: 'În producție', color: 'default' },
  published: { label: 'Publicat', color: 'default' },
}

const STATUS_FILTERS = [
  { value: '', label: 'Toate' },
  { value: 'idea', label: 'Idei' },
  { value: 'approved', label: 'Aprobate' },
  { value: 'paused', label: 'Pauză' },
  { value: 'rejected', label: 'Respinse' },
  { value: 'published', label: 'Publicate' },
]

const PAGE_SIZE = 20

interface OpportunitiesTabProps {
  onSendToAutopilot?: (ids: string[]) => void
}

export function OpportunitiesTab({ onSendToAutopilot }: OpportunitiesTabProps) {
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [textFilter, setTextFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<Partial<Opportunity>>({})
  const [saving, setSaving] = useState(false)

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId

  const loadPage = useCallback(async (p: number, sf: string) => {
    if (!token || !orgId) return
    setLoading(true)
    try {
      const [data, countData] = await Promise.all([
        listOpportunities(orgId, token, p, PAGE_SIZE, sf || undefined),
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
    loadPage(page, statusFilter)
  }, [loadPage, page, statusFilter])

  const handleStatusChange = async (opp: Opportunity, newStatus: string) => {
    if (!token || !orgId) return
    const prev = opp.status
    // Optimistic update
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
      const updated = await editOpportunity(orgId, opp.id, editFields, token)
      setOpportunities(os => os.map(o => o.id === opp.id ? updated : o))
      setEditingId(null)
      setEditFields({})
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = textFilter
    ? opportunities.filter(o =>
        o.title.toLowerCase().includes(textFilter.toLowerCase()) ||
        o.pillar?.toLowerCase().includes(textFilter.toLowerCase())
      )
    : opportunities

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (loading && opportunities.length === 0) {
    return <div className="text-muted-foreground py-8 text-center">Se încarcă oportunitățile...</div>
  }

  if (!loading && total === 0) {
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

      {/* Selectare pentru Autopilot */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
          <span className="text-sm font-medium">{selected.size} oportunități selectate</span>
          <Button
            size="sm"
            onClick={() => { onSendToAutopilot?.(Array.from(selected)); setSelected(new Set()) }}
          >
            Trimite la Autopilot →
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Deselectează
          </Button>
        </div>
      )}

      {/* Statistici */}
      <div className="text-sm text-muted-foreground">
        {total} oportunități total · pagina {page}/{totalPages || 1}
        {loading && ' · se actualizează...'}
      </div>

      {/* Lista oportunități */}
      <div className="space-y-2">
        {filtered.map((opp, index) => {
          const isEditing = editingId === opp.id
          const isSelected = selected.has(opp.id)
          const statusMeta = STATUS_LABELS[opp.status] || { label: opp.status, color: 'secondary' }
          const rank = (page - 1) * PAGE_SIZE + index + 1

          return (
            <Card
              key={opp.id}
              className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${opp.status === 'rejected' ? 'opacity-50' : ''}`}
            >
              <CardContent className="py-3 space-y-2">
                <div className="flex items-start gap-3">
                  {/* Checkbox selectare */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(opp.id)}
                    className="mt-1 cursor-pointer"
                  />

                  {/* Rank + conținut */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">#{rank}</span>
                        {isEditing ? (
                          <Input
                            value={editFields.title ?? opp.title}
                            onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))}
                            className="h-7 text-sm font-medium"
                          />
                        ) : (
                          <span className="text-sm font-medium">{opp.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {opp.score && (
                          <Badge variant="outline" className="text-xs">
                            {opp.score}
                          </Badge>
                        )}
                        <Badge variant={statusMeta.color as any} className="text-xs">
                          {statusMeta.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Hook */}
                    {(opp.hook || isEditing) && (
                      <div className="mt-1">
                        {isEditing ? (
                          <Input
                            value={editFields.hook ?? opp.hook ?? ''}
                            onChange={e => setEditFields(f => ({ ...f, hook: e.target.value }))}
                            placeholder="Hook..."
                            className="h-6 text-xs"
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground">{opp.hook}</p>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex gap-1 flex-wrap mt-1">
                      {opp.pillar && <Badge variant="secondary" className="text-xs">{opp.pillar}</Badge>}
                      {opp.format && <Badge variant="outline" className="text-xs">{opp.format}</Badge>}
                      {opp.platforms.map(p => (
                        <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Acțiuni */}
                <div className="flex gap-2 flex-wrap pl-7">
                  {!isEditing ? (
                    <>
                      {opp.status !== 'approved' && (
                        <Button size="sm" variant="outline" className="h-6 text-xs"
                          onClick={() => handleStatusChange(opp, 'approved')}>
                          ✓ Aprobă
                        </Button>
                      )}
                      {opp.status !== 'paused' && (
                        <Button size="sm" variant="outline" className="h-6 text-xs"
                          onClick={() => handleStatusChange(opp, 'paused')}>
                          ⏸ Pauză
                        </Button>
                      )}
                      {opp.status !== 'rejected' && (
                        <Button size="sm" variant="outline" className="h-6 text-xs text-destructive"
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
                        onClick={() => { setEditingId(opp.id); setEditFields({}) }}>
                        ✎ Editează
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" className="h-6 text-xs" disabled={saving}
                        onClick={() => handleEditSave(opp)}>
                        {saving ? 'Se salvează...' : 'Salvează'}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs"
                        onClick={() => { setEditingId(null); setEditFields({}) }}>
                        Anulează
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Paginație */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Anterior
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Următor →
          </Button>
        </div>
      )}
    </div>
  )
}
