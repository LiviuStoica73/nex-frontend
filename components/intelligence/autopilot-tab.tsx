// components/intelligence/autopilot-tab.tsx
// Version: 7.0.0 — 2026-07-19
// Scope: Vizualizare — status real din postări, ordonare, filtre platforme multi-select

'use client'
import { useEffect, useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Paginator } from './paginator'
import type { ContentOpportunity } from '@/lib/api/intelligence'
import { Search, X, ExternalLink, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48]
const DEFAULT_PAGE_SIZE = 12

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2', instagram: '#E1306C', linkedin: '#0A66C2',
  x: '#000000', discord: '#5865F2', bluesky: '#0085FF',
  blog: '#F59E0B', website: '#6B7280',
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280', approved: '#3B82F6', scheduled: '#F59E0B',
  published: '#10B981', failed: '#EF4444', skipped: '#6B7280', paused: '#8B5CF6',
}

const SORT_OPTIONS = [
  { value: 'post_date', labelKey: 'sort.post_date' },
  { value: 'score', labelKey: 'sort.score' },
  { value: 'created_at', labelKey: 'sort.created_at' },
  { value: 'title', labelKey: 'sort.title' },
] as const

type SortKey = typeof SORT_OPTIONS[number]['value']

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
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function platformLabel(post: LinkedPost) {
  const base = post.platform.charAt(0).toUpperCase() + post.platform.slice(1)
  const type = post.post_type === 'story' ? ' 📱' : post.post_type === 'reel' ? ' 🎬' : ''
  const lang = post.platform === 'discord' && post.language ? ` ${post.language.toUpperCase()}` : ''
  return `${base}${type}${lang}`
}

// Derivă statusul real din postările asociate
function deriveStatus(posts: LinkedPost[], t: ReturnType<typeof useTranslations>): { label: string; color: string; detail: string } {
  if (posts.length === 0) return { label: t('statuses.published'), color: STATUS_COLORS.published, detail: '' }
  const published = posts.filter(p => p.status === 'published').length
  const scheduled = posts.filter(p => p.status === 'scheduled').length
  const failed = posts.filter(p => p.status === 'failed').length
  const total = posts.length

  if (published === total) return { label: t('statuses.published'), color: STATUS_COLORS.published, detail: t('published_count', { count: total }) }
  if (scheduled === total) return { label: t('statuses.scheduled'), color: STATUS_COLORS.scheduled, detail: t('scheduled_count', { count: total }) }
  if (published > 0 && scheduled > 0) return {
    label: t('partially_published'), color: '#F97316',
    detail: failed > 0
      ? t('mixed_published_scheduled_failed', { published, scheduled, failed })
      : t('mixed_published_scheduled', { published, scheduled }),
  }
  if (published > 0) return {
    label: t('partially_published'), color: '#F97316',
    detail: t('published_other_count', { published, other: total - published }),
  }
  if (failed === total) return { label: t('statuses.failed'), color: STATUS_COLORS.failed, detail: t('failed_count', { count: failed }) }
  return { label: t('mixed'), color: '#6B7280', detail: t('mixed_short', { published, scheduled, failed }) }
}

// Prima dată relevantă dintr-o oportunitate (pentru sortare și afișare)
function firstPostDate(opp: OppWithPosts): string | null {
  const posts = opp.linked_posts ?? []
  if (posts.length === 0) return null
  const dates = posts
    .map(p => p.published_at ?? p.scheduled_at)
    .filter(Boolean) as string[]
  if (dates.length === 0) return null
  return dates.sort().at(-1) ?? null // cea mai recentă
}

function OppCard({ opp }: { opp: OppWithPosts }) {
  const t = useTranslations('autopilot')
  const [open, setOpen] = useState(false)
  const posts = opp.linked_posts ?? []
  const platformsToShow = posts.length > 0
    ? [...new Set(posts.map(p => p.platform))]
    : opp.platforms ?? []
  const { label: statusLabel, color: statusColor, detail: statusDetail } = deriveStatus(posts, t)
  const latestDate = firstPostDate(opp)

  return (
    <Card
      className="flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
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

        {/* Status derivat + data + nr postări */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="text-xs text-white" style={{ backgroundColor: statusColor }}>
            {statusLabel}
          </Badge>
          {statusDetail && (
            <span className="text-xs text-muted-foreground">{statusDetail}</span>
          )}
        </div>
        {latestDate && (
          <p className="text-xs text-muted-foreground">📅 {formatDate(latestDate)}</p>
        )}

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
        {posts.length > 0 && (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          >
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {open ? t('hide_posts') : t('view_posts')}
          </button>
        )}

        {/* Lista postărilor expandată */}
        {open && posts.length > 0 && (
          <div className="mt-2 space-y-3 border-t pt-2" onClick={e => e.stopPropagation()}>
            {posts.map(post => (
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
                    {post.status in STATUS_COLORS ? t(`statuses.${post.status}`) : post.status}
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
                    <ExternalLink className="h-3 w-3" /> {t('view_post')}
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

// Sortare client-side (datele sunt deja încărcate)
function sortItems(items: OppWithPosts[], sort: SortKey): OppWithPosts[] {
  return [...items].sort((a, b) => {
    if (sort === 'post_date') {
      const da = firstPostDate(a) ?? ''
      const db = firstPostDate(b) ?? ''
      return db.localeCompare(da) // cele mai recente primele
    }
    if (sort === 'score') return (b.score ?? 0) - (a.score ?? 0)
    if (sort === 'created_at') return b.created_at > a.created_at ? 1 : -1
    if (sort === 'title') return a.title.localeCompare(b.title, 'ro')
    return 0
  })
}

// Filtrare client-side după platforme selectate
function filterByPlatforms(items: OppWithPosts[], platforms: Set<string>): OppWithPosts[] {
  if (platforms.size === 0) return items
  return items.filter(opp => {
    const oppPlatforms = opp.linked_posts?.length
      ? opp.linked_posts.map(p => p.platform)
      : opp.platforms ?? []
    return [...platforms].some(p => oppPlatforms.includes(p))
  })
}

const ALL_PLATFORMS = ['facebook', 'instagram', 'linkedin', 'x', 'discord', 'bluesky', 'blog']

export function AutopilotTab({ orgId, token }: AutopilotTabProps) {
  const t = useTranslations('autopilot')
  const [allItems, setAllItems] = useState<OppWithPosts[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState<SortKey>('post_date')
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [platformFilter, setPlatformFilter] = useState<Set<string>>(new Set())
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = (s: string) => {
    if (!orgId || !token) return
    setLoading(true)
    const params = new URLSearchParams({ page: '1', page_size: '200', status_filter: 'published' })
    if (s) params.set('search', s)
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.nex-nex.com'
    Promise.all([
      fetch(`${API}/api/v1/orgs/${orgId}/intelligence/opportunities?${params}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/v1/orgs/${orgId}/intelligence/opportunities/count?status_filter=published${s ? `&search=${encodeURIComponent(s)}` : ''}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([res, countRes]) => {
        setAllItems(Array.isArray(res) ? res : (res.items ?? []))
        setTotal(countRes?.total ?? 0)
        setPage(1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(search) }, [orgId, token, search])

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setSearch(val.trim()), 400)
  }

  const clearSearch = () => { setSearchInput(''); setSearch('') }

  const togglePlatform = (p: string) => {
    setPlatformFilter(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      setPage(1)
      return next
    })
  }

  // Sortare + filtrare client-side
  const processed = filterByPlatforms(sortItems(allItems, sort), platformFilter)
  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize))
  const pageItems = processed.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-4">

      {/* Bara de control: căutare + sortare */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search_placeholder')}
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

        {/* Sortare */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sort}
            onChange={e => { setSort(e.target.value as SortKey); setPage(1) }}
            className="text-xs border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
            ))}
          </select>
        </div>

        {/* Cartoane per pagină */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{t('per_page')}</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            className="text-xs border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtre platforme */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-muted-foreground">{t('networks')}</span>
        {ALL_PLATFORMS.map(p => {
          const active = platformFilter.has(p)
          return (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className="text-[11px] font-medium rounded-full px-2.5 py-1 transition-all border"
              style={{
                backgroundColor: active ? (PLATFORM_COLORS[p] ?? '#6B7280') : 'transparent',
                borderColor: PLATFORM_COLORS[p] ?? '#6B7280',
                color: active ? '#fff' : (PLATFORM_COLORS[p] ?? '#6B7280'),
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          )
        })}
        {platformFilter.size > 0 && (
          <button
            onClick={() => { setPlatformFilter(new Set()); setPage(1) }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {t('reset')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground p-4 text-center">{t('loading')}</div>
      ) : processed.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          {search || platformFilter.size > 0 ? (
            <p className="text-sm">{t('no_filter_results')}</p>
          ) : (
            <>
              <p className="text-sm font-medium">{t('empty_title')}</p>
              <p className="text-xs">{t.rich('empty_subtitle', { opportunities: (chunks) => <span className="font-medium">{chunks}</span> })}</p>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {processed.length === total
              ? t('calendar_count', { count: total })
              : t('filtered_count', { count: processed.length, total })}
            {search && <span> — „{search}"</span>}
          </p>

          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map(opp => <OppCard key={opp.id} opp={opp} />)}
          </div>

          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
