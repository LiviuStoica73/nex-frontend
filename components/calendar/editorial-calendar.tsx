"use client"

import { useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { EventClickArg, EventDropArg } from "@fullcalendar/core"
import { api, PLATFORM_COLORS, STATUS_COLORS, type Post } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { MoreHorizontal, Clock, Trash2, Pause, Play, Share2, Languages, Pencil } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type CalendarPost = Post & { org_name?: string }
type AgencyClient = { id: string; client_org_id: string; client_org_name?: string }

interface Props {
  orgId: string
  token: string
  isAgency?: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nex-nex.com"

export function EditorialCalendar({ orgId, token, isAgency = false }: Props) {
  const t = useTranslations("calendar")
  const locale = useLocale()
  const calendarRef = useRef<FullCalendar>(null)
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [selected, setSelected] = useState<CalendarPost | null>(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [postStatusFilter, setPostStatusFilter] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [clients, setClients] = useState<AgencyClient[]>([])
  const [listView, setListView] = useState(false)
  const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date } | null>(null)

  useEffect(() => {
    if (!isAgency || !orgId || !token) return
    fetch(`${API_URL}/api/v1/orgs/${orgId}/clients`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [isAgency, orgId, token])

  const fetchPosts = async (start: Date, end: Date, statusFilterOverride?: string, postStatusFilterOverride?: string, clientFilterOverride?: string) => {
    const filter = statusFilterOverride !== undefined ? statusFilterOverride : statusFilter
    const postFilter = postStatusFilterOverride !== undefined ? postStatusFilterOverride : postStatusFilter
    const clientOrg = clientFilterOverride !== undefined ? clientFilterOverride : clientFilter
    try {
      const data = isAgency
        ? await api.calendar.getAgencyPosts(orgId, start.toISOString(), end.toISOString(), token, filter || undefined, postFilter || undefined, clientOrg || undefined)
        : await api.calendar.getPosts(orgId, start.toISOString(), end.toISOString(), token, filter || undefined, postFilter || undefined)
      setPosts(data)
    } catch (err) {
      console.error("Calendar fetch error:", err)
    }
  }

  const refetchCurrentRange = (statusFilterOverride?: string, postStatusFilterOverride?: string, clientFilterOverride?: string) => {
    const calApi = calendarRef.current?.getApi()
    if (!calApi) return
    fetchPosts(calApi.view.currentStart, calApi.view.currentEnd, statusFilterOverride, postStatusFilterOverride, clientFilterOverride)
  }

  const STATUS_DOTS: Record<string, string> = {
    draft: "⚪", approved: "🔵", scheduled: "🟡", rescheduling: "🟣", published: "🟢", failed: "🔴", skipped: "⚫",
  }

  const events = posts
    .filter((p) => p.scheduled_at)
    .map((p) => {
      const dot = STATUS_DOTS[p.status] ?? "⚪"
      const preview = p.blog_title ?? p.text_content?.slice(0, 30) ?? ""
      const typeLabel = p.post_type === "story" ? " 📱Story" : p.post_type === "reel" ? " 🎬Reel" : ""
      const title = p.org_name
        ? `${dot} [${p.org_name}] ${p.platform.toUpperCase()}${typeLabel} — ${preview}`
        : `${dot} ${p.platform.toUpperCase()}${typeLabel} — ${preview}`
      return {
        id: p.id,
        title,
        start: p.scheduled_at!,
        backgroundColor: PLATFORM_COLORS[p.platform] ?? "#6B7280",
        borderColor: STATUS_COLORS[p.status],
        textColor: "#fff",
        extendedProps: { post: p },
      }
    })

  const handleEventClick = (info: EventClickArg) => {
    setSelected(info.event.extendedProps.post as Post)
  }

  const handleEventDrop = async (info: EventDropArg) => {
    const post = info.event.extendedProps.post as Post
    if (post.status === "published") {
      info.revert()
      return
    }
    try {
      await api.posts.reschedule(post.id, info.event.startStr, token)
      await fetchPosts(
        calendarRef.current!.getApi().view.currentStart,
        calendarRef.current!.getApi().view.currentEnd,
      )
    } catch {
      info.revert()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant={listView ? "default" : "outline"}
          size="sm"
          onClick={() => setListView((v) => !v)}
        >
          {listView ? "📅 Calendar" : "☰ Listă"}
        </Button>
      <div className="flex flex-wrap justify-end gap-3">
        {isAgency && clients.length > 0 && (
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Brand</span>
            <select
              value={clientFilter}
              onChange={(e) => {
                const value = e.target.value
                setClientFilter(value)
                refetchCurrentRange(undefined, undefined, value)
              }}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="">Toate brandurile</option>
              {clients.map((c) => (
                <option key={c.id} value={c.client_org_id}>
                  {c.client_org_name || c.client_org_id}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Stare campanie</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value
              setStatusFilter(value)
              refetchCurrentRange(value)
            }}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="">Active</option>
            <option value="all">Toate</option>
            <option value="draft">Ciornă</option>
            <option value="approved">Aprobat</option>
            <option value="scheduled">Programat</option>
            <option value="published">Publicat</option>
            <option value="paused">Pauză</option>
            <option value="cancelled">Anulat</option>
            <option value="archived">Arhivat</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Stare postare</span>
          <select
            value={postStatusFilter}
            onChange={(e) => {
              const value = e.target.value
              setPostStatusFilter(value)
              refetchCurrentRange(undefined, value)
            }}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="">Toate</option>
            <option value="draft">Ciornă</option>
            <option value="approved">Aprobat</option>
            <option value="scheduled">Programat</option>
            <option value="published">Publicat</option>
            <option value="failed">Eșuat</option>
            <option value="skipped">Omis</option>
          </select>
        </label>
      </div>
      </div>
      <div className={listView ? "hidden" : ""}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          editable={true}
          droppable={true}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          datesSet={(info) => { setCurrentRange({ start: info.start, end: info.end }); fetchPosts(info.start, info.end) }}
          height="auto"
          locale={locale}
          buttonText={{
            today: t("today"),
            month: t("month"),
            week: t("week"),
            day: t("day"),
          }}
        />
      </div>

      {listView && (
        <CalendarListView
          posts={posts}
          orgId={orgId}
          token={token}
          locale={locale}
          onSelect={setSelected}
          onRefresh={() => refetchCurrentRange()}
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="font-medium">{t("status_legend")}</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            {t(`statuses.${status}`)}
          </span>
        ))}
      </div>

      {/* Post detail modal */}
      {selected && (
        <PostDetailModal
          post={selected}
          orgId={orgId}
          token={token}
          locale={locale}
          onClose={() => setSelected(null)}
          onRefresh={() => refetchCurrentRange()}
          onPublishNow={async () => {
            try {
              await api.posts.publishNow(selected.id, token)
              setSelected(null)
              toast({ title: "Publicare inițiată", description: "Postarea va apărea ca publicată în câteva secunde." })
              setTimeout(() => refetchCurrentRange(), 5000)
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err)
              toast({ title: "Eroare la publicare", description: msg, variant: "destructive" })
            }
          }}
        />
      )}
    </div>
  )
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn",
  x: "X / Twitter", discord: "Discord", blog: "Blog",
  youtube: "YouTube", threads: "Threads", bluesky: "Bluesky",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă", approved: "Aprobat", scheduled: "Programat", rescheduling: "Reprogramare",
  published: "Publicat", failed: "Eșuat", skipped: "Omis",
}

function CalendarListView({
  posts, orgId, token, locale, onSelect, onRefresh,
}: {
  posts: CalendarPost[]
  orgId: string
  token: string
  locale: string
  onSelect: (p: CalendarPost) => void
  onRefresh: () => void
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nex-nex.com"
  const [busyId, setBusyId] = useState<string | null>(null)

  // Grupează postările pe zile
  const sorted = [...posts]
    .filter((p) => p.scheduled_at)
    .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!))

  const byDay: Record<string, CalendarPost[]> = {}
  for (const p of sorted) {
    const day = p.scheduled_at!.slice(0, 10)
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(p)
  }

  const days = Object.keys(byDay).sort()

  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center italic">Nicio postare programată în această perioadă.</p>
  }

  const handleAction = async (action: string, post: CalendarPost) => {
    setBusyId(post.id)
    try {
      if (action === "delete") {
        if (!confirm("Ștergi definitiv această postare?")) return
        await fetch(`${API_URL}/api/v1/posts/${post.id}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${token}` },
        })
        onRefresh()
      } else if (action === "pause") {
        await fetch(`${API_URL}/api/v1/posts/${post.id}/pause`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` },
        })
        onRefresh()
      } else if (action === "publish_now") {
        await api.posts.publishNow(post.id, token)
        onRefresh()
      }
    } catch (err) {
      alert(`Eroare: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {days.map((day) => {
        const dayPosts = byDay[day]
        const dayDate = new Date(day + "T00:00:00")
        const dayLabel = dayDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        return (
          <div key={day}>
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-1.5 mb-2 border-b">
              <h3 className="text-sm font-semibold text-foreground capitalize">{dayLabel}</h3>
            </div>
            <div className="space-y-2">
              {dayPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 rounded-lg border bg-card p-3 hover:bg-muted/30 transition-colors">
                  {/* Thumbnail */}
                  {post.image_urls && post.image_urls.length > 0 ? (
                    <img
                      src={post.image_urls[0]}
                      alt=""
                      className="h-14 w-14 rounded-md object-cover flex-shrink-0 cursor-pointer"
                      onClick={() => onSelect(post)}
                    />
                  ) : (
                    <div
                      className="h-14 w-14 rounded-md flex-shrink-0 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                      style={{ backgroundColor: PLATFORM_COLORS[post.platform] ?? "#6B7280" }}
                      onClick={() => onSelect(post)}
                    >
                      {post.platform.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(post)}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="text-xs font-semibold rounded-full px-2 py-0.5 text-white"
                        style={{ backgroundColor: PLATFORM_COLORS[post.platform] ?? "#6B7280" }}
                      >
                        {PLATFORM_LABELS[post.platform] ?? post.platform}
                        {post.org_name ? ` · ${post.org_name}` : ""}
                      </span>
                      <span
                        className="text-xs font-semibold rounded-full px-2 py-0.5 text-white"
                        style={{ backgroundColor: STATUS_COLORS[post.status] }}
                      >
                        {STATUS_LABELS[post.status] ?? post.status}
                      </span>
                      {post.language && (
                        <span className="text-xs text-muted-foreground uppercase">{post.language}</span>
                      )}
                      {post.scheduled_at && (
                        <span className="text-xs text-muted-foreground">
                          📅 {new Date(post.scheduled_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2 leading-snug">
                      {post.blog_title ?? post.text_content ?? "—"}
                    </p>
                  </div>

                  {/* Meniu acțiuni */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onSelect(post)}>
                        <Pencil className="mr-2 h-4 w-4" /> Modifică text
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSelect(post)}>
                        <Clock className="mr-2 h-4 w-4" /> Reprogramează
                      </DropdownMenuItem>
                      {post.status !== "published" && (
                        <DropdownMenuItem onClick={() => handleAction("pause", post)} disabled={busyId === post.id}>
                          <Pause className="mr-2 h-4 w-4" /> Pauză
                        </DropdownMenuItem>
                      )}
                      {post.status === "draft" && (
                        <DropdownMenuItem onClick={() => handleAction("publish_now", post)} disabled={busyId === post.id}>
                          <Play className="mr-2 h-4 w-4" /> Publică acum
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleAction("delete", post)}
                        disabled={busyId === post.id}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Șterge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface PostAnalytics {
  reach: number; impressions: number; likes: number
  comments: number; shares: number; clicks: number; video_views: number
  synced_at: string | null
}

interface SocialAccount {
  id: string; platform: string; account_name: string; is_active: boolean
}

// O intrare virtuală în lista de repost (cont + variantă post_type)
interface RepostTarget {
  key: string         // unic în UI
  account_id: string
  post_type: string | null  // null = post normal
  label: string       // ex: "Facebook XignAll.io — Story"
  platform: string
}

function PostDetailModal({
  post,
  orgId,
  token,
  locale,
  onClose,
  onRefresh,
  onPublishNow,
}: {
  post: CalendarPost
  orgId: string
  token: string
  locale: string
  onClose: () => void
  onRefresh: () => void
  onPublishNow: () => void
}) {
  const t = useTranslations("calendar")
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const [analytics, setAnalytics] = useState<PostAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showRepost, setShowRepost] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [selectedTargetKeys, setSelectedTargetKeys] = useState<string[]>([])
  const [reposting, setReposting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pausing, setPausing] = useState(false)

  const handleShowAnalytics = async () => {
    setShowAnalytics(true)
    setAnalyticsLoading(true)
    try {
      const data = await api.posts.syncAnalytics(post.id, token)
      if ("reach" in data) {
        setAnalytics(data as unknown as PostAnalytics)
      } else {
        // fallback: fetch stored analytics
        const stored = await api.posts.getAnalytics(post.id, token)
        setAnalytics(stored)
      }
    } catch {
      try {
        const stored = await api.posts.getAnalytics(post.id, token)
        setAnalytics(stored)
      } catch {}
    }
    setAnalyticsLoading(false)
  }

  const handleShowRepost = async () => {
    setShowRepost(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setSocialAccounts(await res.json())
    } catch {}
  }

  // Construiește lista expandată de targets (post + story + reel per cont FB/IG)
  const repostTargets: RepostTarget[] = socialAccounts.filter((a) => a.is_active).flatMap((a) => {
    const base: RepostTarget = {
      key: `${a.id}:post`,
      account_id: a.id,
      post_type: null,
      label: `${a.account_name}`,
      platform: a.platform,
    }
    if (a.platform === "instagram" || a.platform === "facebook") {
      return [
        base,
        { key: `${a.id}:story`, account_id: a.id, post_type: "story", label: `${a.account_name} — 📱 Story`, platform: a.platform },
        { key: `${a.id}:reel`,  account_id: a.id, post_type: "reel",  label: `${a.account_name} — 🎬 Reel`,  platform: a.platform },
      ]
    }
    return [base]
  })

  const handleRepost = async () => {
    if (selectedTargetKeys.length === 0) return
    setReposting(true)
    try {
      const targets = repostTargets
        .filter((t) => selectedTargetKeys.includes(t.key))
        .map((t) => ({ account_id: t.account_id, post_type: t.post_type }))
      await api.posts.repost(post.org_id ?? orgId, post.id, { targets }, token)
      setShowRepost(false)
      setSelectedTargetKeys([])
    } catch {}
    setReposting(false)
  }

  const toggleTarget = (key: string) => {
    setSelectedTargetKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleDelete = async () => {
    if (!confirm("Ștergi definitiv această postare?")) return
    setDeleting(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/posts/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      onClose()
      onRefresh()
    } catch (err) {
      alert(`Eroare: ${err instanceof Error ? err.message : String(err)}`)
    }
    setDeleting(false)
  }

  const handlePause = async () => {
    setPausing(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/posts/${post.id}/pause`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(await res.text())
      onClose()
      onRefresh()
    } catch (err) {
      alert(`Eroare: ${err instanceof Error ? err.message : String(err)}`)
    }
    setPausing(false)
  }

  const handleReschedule = async () => {
    if (!rescheduleDate) return
    try {
      await api.posts.reschedule(post.id, new Date(rescheduleDate).toISOString(), token)
      setShowReschedule(false)
      onClose()
      onRefresh()
    } catch (err) {
      alert(`Eroare: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {post.org_name && (
          <div className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
            🏢 {post.org_name}
          </div>
        )}
        <div className="mb-4 flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: PLATFORM_COLORS[post.platform] }}
          >
            {post.platform.toUpperCase()}
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: STATUS_COLORS[post.status] }}
          >
            {t(`statuses.${post.status}`)}
          </span>
        </div>

        {(post.post_type === "story" || post.post_type === "reel") && (
          <span className="mb-3 inline-block rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
            {post.post_type === "story" ? "📱 Story" : "🎬 Reel"}
          </span>
        )}
        {post.blog_title && (
          <p className="mb-1 text-sm font-semibold text-foreground">{post.blog_title}</p>
        )}
        <p className="mb-4 text-sm leading-relaxed text-foreground">
          {post.text_content ?? t("not_available")}
        </p>

        {/* Media thumbnail */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-md">
            <img
              src={post.image_urls[0]}
              alt="thumbnail"
              className="max-h-48 w-full object-cover"
            />
            {post.image_urls.length > 1 && (
              <p className="mt-1 text-xs text-muted-foreground">+{post.image_urls.length - 1} imagini</p>
            )}
          </div>
        )}
        {post.video_urls && post.video_urls.length > 0 && !(post.image_urls && post.image_urls.length > 0) && (
          <div className="mb-4 overflow-hidden rounded-md bg-black">
            <video
              src={post.video_urls[0]}
              className="max-h-48 w-full object-contain"
              preload="metadata"
              muted
              playsInline
            />
          </div>
        )}

        {post.scheduled_at && (
          <p className="mb-2 text-xs text-muted-foreground">
            {t("scheduled_at")}: {new Date(post.scheduled_at).toLocaleString(locale)}
          </p>
        )}

        {/* Link temă — toate postările corelate */}
        {post.topic_id && (
          <a
            href={`/dashboard/campaigns?topic=${post.topic_id}`}
            className="mb-4 block text-xs text-blue-500 underline"
          >
            🗂️ Vezi toate postările din această temă →
          </a>
        )}

        {post.published_url && (
          <a
            href={post.published_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 block text-xs text-blue-500 underline"
          >
            {t("view_published_post")}
          </a>
        )}

        {/* Analytics panel */}
        {showAnalytics && (
          <div className="mb-4 rounded-md border bg-muted/30 p-3">
            {analyticsLoading ? (
              <p className="text-xs text-muted-foreground">Se sincronizează...</p>
            ) : analytics ? (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div><div className="font-semibold text-base">{analytics.reach}</div><div className="text-muted-foreground">Reach</div></div>
                <div><div className="font-semibold text-base">{analytics.impressions}</div><div className="text-muted-foreground">Impresii</div></div>
                <div><div className="font-semibold text-base">{analytics.likes}</div><div className="text-muted-foreground">Like-uri</div></div>
                <div><div className="font-semibold text-base">{analytics.comments}</div><div className="text-muted-foreground">Comentarii</div></div>
                <div><div className="font-semibold text-base">{analytics.shares}</div><div className="text-muted-foreground">Share-uri</div></div>
                <div><div className="font-semibold text-base">{analytics.clicks}</div><div className="text-muted-foreground">Click-uri</div></div>
                {analytics.synced_at && (
                  <div className="col-span-3 text-muted-foreground text-[10px]">
                    Sincronizat: {new Date(analytics.synced_at).toLocaleString(locale)}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Analytics indisponibile.</p>
            )}
          </div>
        )}

        {/* Reschedule panel */}
        {showReschedule && (
          <div className="mb-4 rounded-md border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium">Alege noua dată și oră:</p>
            <input
              type="datetime-local"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="w-full rounded border bg-background px-2 py-1 text-xs"
            />
            <button
              onClick={handleReschedule}
              disabled={!rescheduleDate}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Confirmă reprogramarea
            </button>
          </div>
        )}

        {/* Repost panel */}
        {showRepost && (
          <div className="mb-4 rounded-md border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium">Alege conturile pentru repostare:</p>
            {repostTargets.length === 0 ? (
              <p className="text-xs text-muted-foreground">Niciun cont conectat.</p>
            ) : (
              repostTargets.map((target) => (
                <label key={target.key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTargetKeys.includes(target.key)}
                    onChange={() => toggleTarget(target.key)}
                    className="h-3 w-3"
                  />
                  <span className="capitalize">{target.platform}</span>
                  <span className="text-muted-foreground truncate">{target.label}</span>
                </label>
              ))
            )}
            {repostTargets.length > 0 && (
              <button
                onClick={handleRepost}
                disabled={reposting || selectedTargetKeys.length === 0}
                className="mt-1 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {reposting ? "Se repostează..." : "Repostează"}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {post.status !== "published" && (
            <button
              onClick={onPublishNow}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {t("publish_now")}
            </button>
          )}
          {post.status !== "published" && (
            <button
              onClick={() => setShowReschedule((v) => !v)}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              📅 Reprogramează
            </button>
          )}
          {post.status !== "published" && post.status !== "draft" && (
            <button
              onClick={handlePause}
              disabled={pausing}
              className="rounded bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              {pausing ? "..." : "⏸ Pauză"}
            </button>
          )}
          {post.status !== "published" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "..." : "🗑 Șterge"}
            </button>
          )}
          {post.status === "published" && !showAnalytics && (
            <button
              onClick={handleShowAnalytics}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Analytics
            </button>
          )}
          {post.status === "published" && !showRepost && (
            <button
              onClick={handleShowRepost}
              className="rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Repostează
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  )
}
