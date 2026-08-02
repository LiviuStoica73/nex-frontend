"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { EventClickArg, EventDropArg } from "@fullcalendar/core"
import { api, PLATFORM_COLORS, STATUS_COLORS, type Post } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { MoreHorizontal, Clock, Trash2, Pause, Play, Share2, Languages, Pencil, RefreshCw } from "lucide-react"
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
  const [listDay, setListDay] = useState<string>(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
  })
  const [rescheduleAllBusy, setRescheduleAllBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const AUTO_REFRESH_INTERVAL = 60_000 // 60 secunde

  const handleRescheduleAll = async () => {
    if (!confirm(t("reschedule_all_confirm"))) return
    setRescheduleAllBusy(true)
    try {
      const result = await api.campaigns.rescheduleAll(orgId, token)
      toast({ title: t("reschedule_all_success", { count: result.rescheduled }) })
      refetchCurrentRange()
    } catch {
      toast({ title: t("reschedule_all_error"), variant: "destructive" })
    } finally {
      setRescheduleAllBusy(false)
    }
  }

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

  const refetchCurrentRange = useCallback((statusFilterOverride?: string, postStatusFilterOverride?: string, clientFilterOverride?: string) => {
    const calApi = calendarRef.current?.getApi()
    if (!calApi) return
    fetchPosts(calApi.view.currentStart, calApi.view.currentEnd, statusFilterOverride, postStatusFilterOverride, clientFilterOverride)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, token, statusFilter, postStatusFilter, clientFilter, isAgency])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    refetchCurrentRange()
    await new Promise((r) => setTimeout(r, 600))
    setRefreshing(false)
  }, [refetchCurrentRange])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => refetchCurrentRange(), AUTO_REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [autoRefresh, refetchCurrentRange])

  const STATUS_DOTS: Record<string, string> = {
    draft: "⚪", approved: "🔵", scheduled: "🟡", rescheduling: "🟣", published: "🟢", failed: "🔴", skipped: "⚫",
  }

  const events = posts
    .filter((p) => p.scheduled_at)
    .map((p) => {
      const dot = STATUS_DOTS[p.status] ?? "⚪"
      const preview = p.blog_title ?? p.text_content?.slice(0, 30) ?? ""
      const typeLabel = p.post_type === "story" ? " 📱" : p.post_type === "reel" ? " 🎬" : ""
      const discordLang = p.platform === "discord" && p.language ? ` ${p.language.toUpperCase()}` : ""
      const platformLabel = `${p.platform.toUpperCase()}${typeLabel}${discordLang}`
      const title = p.org_name
        ? `${dot} [${p.org_name}] ${platformLabel} — ${preview}`
        : `${dot} ${platformLabel} — ${preview}`
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
        <div className="flex items-center gap-2">
          <Button
            variant={listView ? "default" : "outline"}
            size="sm"
            onClick={() => setListView((v) => !v)}
          >
            {listView ? t("calendar_view") : t("list_view")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRescheduleAll}
            disabled={rescheduleAllBusy}
          >
            {rescheduleAllBusy ? t("processing") : t("reschedule_all")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            title={t("refresh_posts")}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
            title={autoRefresh ? t("stop_auto_refresh") : t("start_auto_refresh")}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            <span className="text-xs">Auto</span>
          </Button>
        </div>
      <div className="flex flex-wrap justify-end gap-3">
        {isAgency && clients.length > 0 && (
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{t("brand")}</span>
            <select
              value={clientFilter}
              onChange={(e) => {
                const value = e.target.value
                setClientFilter(value)
                refetchCurrentRange(undefined, undefined, value)
              }}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="">{t("all_brands")}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.client_org_id}>
                  {c.client_org_name || c.client_org_id}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>{t("campaign_status")}</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value
              setStatusFilter(value)
              refetchCurrentRange(value)
            }}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="">{t("active_campaigns")}</option>
            <option value="all">{t("all")}</option>
            <option value="draft">{t("statuses.draft")}</option>
            <option value="approved">{t("statuses.approved")}</option>
            <option value="scheduled">{t("statuses.scheduled")}</option>
            <option value="published">{t("statuses.published")}</option>
            <option value="paused">{t("statuses.paused")}</option>
            <option value="cancelled">{t("statuses.cancelled")}</option>
            <option value="archived">{t("statuses.archived")}</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>{t("post_status")}</span>
          <select
            value={postStatusFilter}
            onChange={(e) => {
              const value = e.target.value
              setPostStatusFilter(value)
              refetchCurrentRange(undefined, value)
            }}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="">{t("all")}</option>
            <option value="draft">{t("statuses.draft")}</option>
            <option value="approved">{t("statuses.approved")}</option>
            <option value="scheduled">{t("statuses.scheduled")}</option>
            <option value="published">{t("statuses.published")}</option>
            <option value="failed">{t("statuses.failed")}</option>
            <option value="skipped">{t("statuses.skipped")}</option>
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
          listDay={listDay}
          onListDayChange={setListDay}
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
              toast({ title: t("publish_started"), description: t("publish_started_description") })
              setTimeout(() => refetchCurrentRange(), 5000)
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err)
              toast({ title: t("publish_error"), description: msg, variant: "destructive" })
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

function CalendarListView({
  posts, orgId, token, locale, listDay, onListDayChange, onSelect, onRefresh,
}: {
  posts: CalendarPost[]
  orgId: string
  token: string
  locale: string
  listDay: string
  onListDayChange: (day: string) => void
  onSelect: (p: CalendarPost) => void
  onRefresh: () => void
}) {
  const t = useTranslations("calendar")
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nex-nex.com"
  const [busyId, setBusyId] = useState<string | null>(null)

  const localDateStr = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const shiftDay = (delta: number) => {
    const d = new Date(listDay + "T00:00:00")
    d.setDate(d.getDate() + delta)
    onListDayChange(localDateStr(d))
  }

  const todayStr = localDateStr(new Date())
  const displayDate = new Date(listDay + "T00:00:00")
  const dayLabel = displayDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  // Postările zilei selectate
  const dayPosts = [...posts]
    .filter((p) => p.scheduled_at && p.scheduled_at.slice(0, 10) === listDay)
    .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!))

  const handleAction = async (action: string, post: CalendarPost) => {
    setBusyId(post.id)
    try {
      if (action === "delete") {
        if (!confirm(t("delete_post_confirm"))) return
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
      alert(t("error_with_message", { message: err instanceof Error ? err.message : String(err) }))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Navigare zi */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => shiftDay(-1)}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          {t("yesterday")}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold capitalize">{dayLabel}</span>
          {listDay !== todayStr && (
            <button
              onClick={() => onListDayChange(todayStr)}
              className="rounded-md border px-2 py-0.5 text-xs hover:bg-muted transition-colors text-muted-foreground"
            >
              {t("today")}
            </button>
          )}
        </div>
        <button
          onClick={() => shiftDay(1)}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          {t("tomorrow")}
        </button>
      </div>

      {dayPosts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center italic">{t("no_posts_day")}</p>
      ) : (
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
                        {post.post_type === "story" ? " 📱" : post.post_type === "reel" ? " 🎬" : ""}
                        {post.platform === "discord" && post.language ? ` ${post.language.toUpperCase()}` : ""}
                        {post.org_name ? ` · ${post.org_name}` : ""}
                      </span>
                      <span
                        className="text-xs font-semibold rounded-full px-2 py-0.5 text-white"
                        style={{ backgroundColor: STATUS_COLORS[post.status] }}
                      >
                        {post.status in STATUS_COLORS ? t(`statuses.${post.status}`) : post.status}
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
                        <Pencil className="mr-2 h-4 w-4" /> {t("edit_text")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSelect(post)}>
                        <Clock className="mr-2 h-4 w-4" /> {t("reschedule")}
                      </DropdownMenuItem>
                      {post.status !== "published" && (
                        <DropdownMenuItem onClick={() => handleAction("pause", post)} disabled={busyId === post.id}>
                          <Pause className="mr-2 h-4 w-4" /> {t("pause")}
                        </DropdownMenuItem>
                      )}
                      {post.status === "draft" && (
                        <DropdownMenuItem onClick={() => handleAction("publish_now", post)} disabled={busyId === post.id}>
                          <Play className="mr-2 h-4 w-4" /> {t("publish_now")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleAction("delete", post)}
                        disabled={busyId === post.id}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
          ))}
        </div>
      )}
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
      const postOrgId = post.org_id ?? orgId
      const res = await fetch(`${API_URL}/api/v1/orgs/${postOrgId}/social-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setSocialAccounts(await res.json())
    } catch {}
  }

  // Construiește lista de targets pentru repost
  // FB/IG: doar Story și Reel (postarea normală e flux separat, nu repost)
  // Alte platforme: doar post normal
  const repostTargets: RepostTarget[] = socialAccounts.filter((a) => a.is_active).flatMap((a): RepostTarget[] => {
    if (a.platform === "instagram" || a.platform === "facebook") {
      return [
        { key: `${a.id}:story`, account_id: a.id, post_type: "story", label: `${a.account_name} — 📱 Story`, platform: a.platform },
        { key: `${a.id}:reel`,  account_id: a.id, post_type: "reel",  label: `${a.account_name} — 🎬 Reel`,  platform: a.platform },
      ]
    }
    return [{ key: `${a.id}:post`, account_id: a.id, post_type: null, label: `${a.account_name}`, platform: a.platform }]
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
    if (!confirm(t("delete_post_confirm"))) return
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
      alert(t("error_with_message", { message: err instanceof Error ? err.message : String(err) }))
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
      alert(t("error_with_message", { message: err instanceof Error ? err.message : String(err) }))
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
      alert(t("error_with_message", { message: err instanceof Error ? err.message : String(err) }))
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

        {/* Banner eroare pentru postări eșuate */}
        {post.status === "failed" && post.last_error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm dark:border-red-800 dark:bg-red-950">
            {post.last_error.includes("TOKEN_EXPIRED") ? (
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">{t("token_expired_title")}</p>
                <p className="mt-1 text-red-600 dark:text-red-300">
                  {t.rich("token_expired_description", {
                    platform: () => <strong>{post.platform}</strong>,
                    settings: (chunks) => <a href="/dashboard/settings/social-accounts" className="underline font-medium">{chunks}</a>,
                  })}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">{t("publish_failed")}</p>
                <p className="mt-1 text-red-600 dark:text-red-300 text-xs font-mono break-all">
                  {post.last_error.slice(0, 200)}{post.last_error.length > 200 ? "…" : ""}
                </p>
              </div>
            )}
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
              <p className="mt-1 text-xs text-muted-foreground">{t("more_images", { count: post.image_urls.length - 1 })}</p>
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
            {t("view_topic_posts")}
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
              <p className="text-xs text-muted-foreground">{t("syncing")}</p>
            ) : analytics ? (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div><div className="font-semibold text-base">{analytics.reach}</div><div className="text-muted-foreground">Reach</div></div>
                <div><div className="font-semibold text-base">{analytics.impressions}</div><div className="text-muted-foreground">{t("analytics.impressions")}</div></div>
                <div><div className="font-semibold text-base">{analytics.likes}</div><div className="text-muted-foreground">{t("analytics.likes")}</div></div>
                <div><div className="font-semibold text-base">{analytics.comments}</div><div className="text-muted-foreground">{t("analytics.comments")}</div></div>
                <div><div className="font-semibold text-base">{analytics.shares}</div><div className="text-muted-foreground">{t("analytics.shares")}</div></div>
                <div><div className="font-semibold text-base">{analytics.clicks}</div><div className="text-muted-foreground">{t("analytics.clicks")}</div></div>
                {analytics.synced_at && (
                  <div className="col-span-3 text-muted-foreground text-[10px]">
                    {t("analytics.synced_at", { date: new Date(analytics.synced_at).toLocaleString(locale) })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("analytics_unavailable")}</p>
            )}
          </div>
        )}

        {/* Reschedule panel */}
        {showReschedule && (
          <div className="mb-4 rounded-md border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium">{t("choose_new_date")}</p>
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
              {t("confirm_reschedule")}
            </button>
          </div>
        )}

        {/* Repost panel */}
        {showRepost && (
          <div className="mb-4 rounded-md border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium">{t("choose_repost_accounts")}</p>
            {repostTargets.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("no_connected_accounts")}</p>
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
                {reposting ? t("reposting") : t("repost")}
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
              {t("reschedule_button")}
            </button>
          )}
          {post.status !== "published" && post.status !== "draft" && (
            <button
              onClick={handlePause}
              disabled={pausing}
              className="rounded bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              {pausing ? "..." : t("pause_button")}
            </button>
          )}
          {post.status !== "published" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "..." : t("delete_button")}
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
              {t("repost")}
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
