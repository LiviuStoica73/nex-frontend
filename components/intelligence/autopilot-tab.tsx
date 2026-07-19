// components/intelligence/autopilot-tab.tsx
// Version: 6.0.0 — 2026-07-19
// Scope: Vizualizare oportunități publicate — cu căutare, click pe card, postări reale per rețea

'use client'
import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listOpportunities, countOpportunities } from '@/lib/api/intelligence'
import { Paginator } from './paginator'
import type { ContentOpportunity } from '@/lib/api/intelligence'
import { Search, X, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

const PAGE_SIZE = 12

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2', instagram: '#E1306C', linkedin: '#0A66C2',
  x: '#000000', discord: '#5865F2', bluesky: '#0085FF',
  blog: '#F59E0B', website: '#6B7280',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', approved: 'Aprobat', scheduled: 'Programat',
  published: 'Publicat', failed: 'Eșuat', skipped: 'Sărit', paused: 'Pauză',
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280', approved: '#3B82F6', scheduled: '#F59E0B',
  published: '#10B981', failed: '#EF4444', skipped: '#6B7280', paused: '#8B5CF6',
}

interface LinkedPost {
  id: string
  platform: string
  post_type?: string | null
  status: string
  language?: string | null
  text_content?: string | null
  scheduled_at?: string | null
  published_at?: string | null
  published_url?: string | null
}

interface OppWithPosts extends ContentOpportunity {
  linked_posts?: LinkedPost[]
}

interface AutopilotTabProps {
  orgId: string
  token: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function platformLabel(post: LinkedPost) {
  const base = post.platform.charAt(0).toUpperCase() + post.platform.slice(1)
  const type = post.post_type === 'story' ? ' 📱' : post.post_type === 'reel' ? ' 🎬' : ''
  const lang = post.platform === 'discord' && post.language ? ` ${post.language.toUpperCase()}` : ''
  return `${base}${type}${lang}`
}

function OppCard({ opp }: { opp: OppWithPosts }) {
  const [open, setOpen] = useState(false)
  const posts = opp.linked_posts ?? []
  const publishedPosts = posts.filter(p => p.status === 'published')
  const allPosts = posts

  // Platformele reale din postări; fallback la opp.platforms dacă nu există postări
  const platformsToShow = allPosts.length > 0
    ? [...new Set(allPosts.map(p => p.platform))]
    : opp.platforms ?? []

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setOpen(o => !o)}>
      {opp.image_url && (
        <img
          src={opp.image_url}
          alt={opp.title}
          className={`w-full object-cover transition-all duration-300 ${open ? 'h-auto max-h-[600px]' : 'h-40'}`}
        />
      )}
      <CardContent className="pt-3 pb-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-semibold leading-snug">{opp.title}</p>
        {opp.hook && (
          <p className="text-xs text-muted-foreground line-clamp-2">{opp.hook}</p>
        )}

        {/* Status oportunitate + nr postări */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className="text-xs text-white"
            style={{ backgroundColor: STATUS_COLORS[opp.status] ?? '#6B7280' }}
          >
            {STATUS_LABELS[opp.status] ?? opp.status}
          </Badge>
          {allPosts.length > 0 && (
            <span className="text-xs text-muted-foreground">{allPosts.length} postări</span>
          )}
        </div>

        {/* Platformele reale */}
        <div className="flex gap-1 flex-wrap">
          {platformsToShow.map(p => (
            <span
              key={p}
              className="text-[10px] font-medium rounded-full px-2 py-0.5 text-white"
              style={{ backgroundColor: PLATFORM_COLORS[p] ?? '#6B7280' }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </span>
          ))}
        </div>

        {/* Toggle postări */}
        {allPosts.length > 0 && (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          >
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {open ? 'Ascunde postările' : 'Vezi postările'}
          </button>
        )}

        {/* Lista postărilor expandată */}
        {open && allPosts.length > 0 && (
          <div className="mt-2 space-y-3 border-t pt-2" onClick={e => e.stopPropagation()}>
            {allPosts.map(post => (
              <div key={post.id} className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-semibold rounded-full px-2 py-0.5 text-white"
                    style={{ backgroundColor: PLATFORM_COLORS[post.platform] ?? '#6B7280' }}
                  >
                    {platformLabel(post)}
                  </span>
                  <span
                    className="text-[10px] font-medium rounded-full px-2 py-0.5 text-white"
                    style={{ backgroundColor: STATUS_COLORS[post.status] ?? '#6B7280' }}
                  >
                    {STATUS_LABELS[post.status] ?? post.status}
                  </span>
                  {post.language && (
                    <span className="text-[10px] text-muted-foreground uppercase">{post.language}</span>
                  )}
                  {(post.scheduled_at || post.published_at) && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate((post.published_at ?? post.scheduled_at)!)}
                    </span>
                  )}
                </div>
                {post.text_content && (
                  <p className="text-xs text-muted-foreground leading-relaxed pl-1 whitespace-pre-wrap">
                    {post.text_content}
                  </p>
                )}
                {post.published_url && (
                  <a
                    href={post.published_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline pl-1 mt-0.5"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" /> Vezi postarea
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AutopilotTab({ orgId, token }: AutopilotTabProps) {
  const [items, setItems] = useState<OppWithPosts[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = (p: number, s: string) => {
    if (!orgId || !token) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE), status_filter: 'published' })
    if (s) params.set('search', s)
    const countParams = new URLSearchParams({ status_filter: 'published' })
    if (s) countParams.set('search', s)
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.nex-nex.com'
    Promise.all([
      fetch(`${API}/api/v1/orgs/${orgId}/intelligence/opportunities?${params}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/v1/orgs/${orgId}/intelligence/opportunities/count?${countParams}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([res, countRes]) => {
        setItems(Array.isArray(res) ? res : (res.items ?? []))
        setTotal(countRes?.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page, search) }, [orgId, token, page, search])

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      setSearch(val.trim())
    }, 400)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Căutare */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Caută după titlu sau hook..."
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchInput && (
          <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground p-4 text-center">Se încarcă...</div>
      ) : total === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          {search ? (
            <p className="text-sm">Niciun rezultat pentru „{search}".</p>
          ) : (
            <>
              <p className="text-sm font-medium">Nicio idee publicată din Intelligence încă.</p>
              <p className="text-xs">Publică oportunități din tab-ul <span className="font-medium">Oportunități</span> pentru a le vedea aici.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'idee publicată' : 'idei publicate'} în Calendar din Intelligence
            {search && <span> — rezultate pentru „{search}"</span>}
          </p>

          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(opp => <OppCard key={opp.id} opp={opp} />)}
          </div>

          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
