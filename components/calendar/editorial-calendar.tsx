"use client"

import { useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { EventClickArg, EventDropArg } from "@fullcalendar/core"
import { api, PLATFORM_COLORS, STATUS_COLORS, type Post } from "@/lib/api"

interface Props {
  orgId: string
  token: string
}

export function EditorialCalendar({ orgId, token }: Props) {
  const t = useTranslations("calendar")
  const locale = useLocale()
  const calendarRef = useRef<FullCalendar>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [selected, setSelected] = useState<Post | null>(null)

  const fetchPosts = async (start: Date, end: Date) => {
    try {
      const data = await api.calendar.getPosts(
        orgId,
        start.toISOString(),
        end.toISOString(),
        token,
      )
      setPosts(data)
    } catch (err) {
      console.error("Calendar fetch error:", err)
    }
  }

  const events = posts
    .filter((p) => p.scheduled_at)
    .map((p) => ({
      id: p.id,
      title: `${p.platform.toUpperCase()} — ${p.text_content?.slice(0, 40) ?? ""}`,
      start: p.scheduled_at!,
      backgroundColor: PLATFORM_COLORS[p.platform] ?? "#6B7280",
      borderColor: STATUS_COLORS[p.status],
      textColor: "#fff",
      extendedProps: { post: p },
    }))

  const handleEventClick = (info: EventClickArg) => {
    setSelected(info.event.extendedProps.post as Post)
  }

  const handleEventDrop = async (info: EventDropArg) => {
    const post = info.event.extendedProps.post as Post
    try {
      await api.posts.schedule(post.id, info.event.startStr, token)
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
          onPublishNow={async () => {
            await api.posts.publishNow(selected.id, token)
            setSelected(null)
            await fetchPosts(
              calendarRef.current!.getApi().view.currentStart,
              calendarRef.current!.getApi().view.currentEnd,
            )
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

function PostDetailModal({
  post,
  orgId,
  token,
  locale,
  onClose,
  onPublishNow,
}: {
  post: Post
  orgId: string
  token: string
  locale: string
  onClose: () => void
  onPublishNow: () => void
}) {
  const t = useTranslations("calendar")
  const [analytics, setAnalytics] = useState<PostAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showRepost, setShowRepost] = useState(false)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [reposting, setReposting] = useState(false)

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

  const handleRepost = async () => {
    if (selectedPlatforms.length === 0) return
    setReposting(true)
    try {
      await api.posts.repost(orgId, post.id, { platforms: selectedPlatforms }, token)
      setShowRepost(false)
      setSelectedPlatforms([])
    } catch {}
    setReposting(false)
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl"
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

        <p className="mb-4 text-sm leading-relaxed text-foreground">
          {post.text_content ?? t("not_available")}
        </p>

        {post.scheduled_at && (
          <p className="mb-4 text-xs text-muted-foreground">
            {t("scheduled_at")}: {new Date(post.scheduled_at).toLocaleString(locale)}
          </p>
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

        {/* Repost panel */}
        {showRepost && (
          <div className="mb-4 rounded-md border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium">Alege conturile pentru repostare:</p>
            {socialAccounts.length === 0 ? (
              <p className="text-xs text-muted-foreground">Niciun cont conectat.</p>
            ) : (
              socialAccounts.filter((a) => a.is_active).map((account) => (
                <label key={account.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(account.platform)}
                    onChange={() => togglePlatform(account.platform)}
                    className="h-3 w-3"
                  />
                  <span className="capitalize">{account.platform}</span>
                  <span className="text-muted-foreground truncate">{account.account_name}</span>
                </label>
              ))
            )}
            {socialAccounts.filter((a) => a.is_active).length > 0 && (
              <button
                onClick={handleRepost}
                disabled={reposting || selectedPlatforms.length === 0}
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
