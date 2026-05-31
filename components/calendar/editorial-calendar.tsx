"use client"

import { useEffect, useRef, useState } from "react"
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
        locale="ro"
        buttonText={{ today: "Azi", month: "Lună", week: "Săptămână", day: "Zi" }}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="font-medium">Status:</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            {status}
          </span>
        ))}
      </div>

      {/* Post detail modal */}
      {selected && (
        <PostDetailModal
          post={selected}
          token={token}
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

function PostDetailModal({
  post,
  token,
  onClose,
  onPublishNow,
}: {
  post: Post
  token: string
  onClose: () => void
  onPublishNow: () => void
}) {
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
            {post.status}
          </span>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-foreground">
          {post.text_content ?? "—"}
        </p>

        {post.scheduled_at && (
          <p className="mb-4 text-xs text-muted-foreground">
            Programat: {new Date(post.scheduled_at).toLocaleString("ro-RO")}
          </p>
        )}

        {post.published_url && (
          <a
            href={post.published_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 block text-xs text-blue-500 underline"
          >
            Vezi postarea publicată →
          </a>
        )}

        <div className="flex gap-2">
          {post.status !== "published" && (
            <button
              onClick={onPublishNow}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Publică acum
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  )
}
