"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import { PLATFORM_COLORS } from "@/lib/api"
import { RefreshCw, TrendingUp } from "lucide-react"

interface PlatformStats {
  platform: string
  posts_count: number
  total_reach: number
  total_impressions: number
  total_likes: number
  total_comments: number
  total_shares: number
  total_clicks: number
}

interface TopPost {
  post_id: string
  platform: string
  text_preview: string
  published_url: string | null
  published_at: string | null
  reach: number
  impressions: number
  likes: number
  engagement_score: number
}

interface AnalyticsData {
  period_days: number
  total_posts_published: number
  platforms: PlatformStats[]
  top_posts: TopPost[]
}

interface Props { orgId: string; token: string }

const PERIODS = [7, 30, 90]

export function AnalyticsDashboard({ orgId, token }: Props) {
  const t = useTranslations("analytics")
  const locale = useLocale()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const headers = { Authorization: `Bearer ${token}` }

  const fetchAnalytics = async (d = days) => {
    setLoading(true)
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/analytics?days=${d}`, { headers })
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  const syncNow = async () => {
    setSyncing(true)
    await fetch(`${API}/api/v1/orgs/${orgId}/analytics/sync`, { method: "POST", headers })
    setTimeout(() => { setSyncing(false); fetchAnalytics() }, 3000)
  }

  useEffect(() => { fetchAnalytics() }, [orgId, days])

  if (loading) return <p className="text-muted-foreground">{t("loading")}</p>
  if (!data) return null

  const engagementData = data.platforms.map((p) => ({
    name: p.platform.toUpperCase(),
    Reach: p.total_reach,
    Likes: p.total_likes,
    Comments: p.total_comments,
    Shares: p.total_shares,
  }))

  const pieData = data.platforms
    .filter((p) => p.posts_count > 0)
    .map((p) => ({ name: p.platform, value: p.posts_count }))

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {PERIODS.map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                days === d ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
              }`}>
              {t("days", { count: d })}
            </button>
          ))}
        </div>
        <button onClick={syncNow} disabled={syncing}
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? t("syncing") : t("sync_now")}
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label={t("kpi_published_posts")} value={data.total_posts_published} locale={locale} />
        <KpiCard label={t("kpi_total_reach")} value={data.platforms.reduce((s, p) => s + p.total_reach, 0)} locale={locale} />
        <KpiCard label={t("kpi_total_likes")} value={data.platforms.reduce((s, p) => s + p.total_likes, 0)} locale={locale} />
        <KpiCard label={t("kpi_total_shares")} value={data.platforms.reduce((s, p) => s + p.total_shares, 0)} locale={locale} />
      </div>

      {data.total_posts_published === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <TrendingUp className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p className="font-medium">{t("empty_title", { days })}</p>
          <p className="text-sm">{t("empty_subtitle")}</p>
        </div>
      ) : (
        <>
          {/* Engagement bar chart */}
          <div className="rounded-lg border bg-card p-5">
            <h2 className="mb-4 font-semibold">{t("engagement_by_platform")}</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="Reach" name={t("metric_reach")} fill="#6366F1" radius={[4,4,0,0]} />
                <Bar dataKey="Likes" name={t("metric_likes")} fill="#EC4899" radius={[4,4,0,0]} />
                <Bar dataKey="Comments" name={t("metric_comments")} fill="#F59E0B" radius={[4,4,0,0]} />
                <Bar dataKey="Shares" name={t("metric_shares")} fill="#10B981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution pie + Top posts */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-card p-5">
              <h2 className="mb-4 font-semibold">{t("post_distribution")}</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name}
                        fill={PLATFORM_COLORS[entry.name as keyof typeof PLATFORM_COLORS] ?? "#6B7280"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border bg-card p-5">
              <h2 className="mb-4 font-semibold">{t("top_posts")}</h2>
              {data.top_posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_data")}</p>
              ) : (
                <ul className="space-y-2">
                  {data.top_posts.map((post) => (
                    <li key={post.post_id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase text-muted-foreground">{post.platform}</p>
                        <p className="text-sm line-clamp-1">{post.text_preview || t("not_available")}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold">{post.engagement_score}</p>
                        <p className="text-xs text-muted-foreground">{t("score")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value, locale }: { label: string; value: number; locale: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value.toLocaleString(locale)}</p>
    </div>
  )
}
