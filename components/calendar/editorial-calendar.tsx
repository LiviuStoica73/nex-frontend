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

type CalendarPost = Post & { org_name?: string }

interface Props {
  orgId: string
  token: string
  isAgency?: boolean
}

export function EditorialCalendar({ orgId, token, isAgency = false }: Props) {
  const t = useTranslations("calendar")
  const locale = useLocale()
  const calendarRef = useRef<FullCalendar>(null)
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [selected, setSelected] = useState<CalendarPost | null>(null)
  const [statusFilter, setStatusFilter] = useState("")
  const [postStatusFilter, setPostStatusFilter] = useState("")

  const fetchPosts = async (start: Date, end: Date, statusFilterOverride?: string, postStatusFilterOverride?: string) => {
    const filter = statusFilterOverride !== undefined ? statusFilterOverride : statusFilter
    const postFilter = postStatusFilterOverride !== undefined ? postStatusFilterOverride : postStatusFilter
    try {
      const data = isAgency
        ? await api.calendar.getAgencyPosts(orgId, start.toISOString(), end.toISOString(), token, filter || undefined, postFilter || undefined)
        : await api.calendar.getPosts(orgId, start.toISOString(), end.toISOString(), token, filter || undefined, postFilter || undefined)
      setPosts(data)
    } catch (err) {
      console.error("Calendar fetch error:", err)
    }
  }

  const refetchCurrentRange = (statusFilterOverride?: string, postStatusFilterOverride?: string) => {
    const calApi = calendarRef.current?.getApi()
    if (!calApi) return
    fetchPosts(calApi.view.currentStart, calApi.view.currentEnd, statusFilterOverride, postStatusFilterOverride)
  }

  const STATUS_DOTS: Record<string, string> = {
    draft: "⚪", approved: "🔵", scheduled: "🟡", published: "🟢", failed: "🔴", skipped: "⚫",
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
      <div className="flex flex-wrap justify-end gap-3">
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
        datesSet={(info) => fetchPosts(info.start, info.end)}
        height="auto"
        locale={locale}
        buttonText={{
          today: t("today"),
          month: t("month"),
          week: t("week"),
          day: t("day"),
        }}
      />

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
  post: Post
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
