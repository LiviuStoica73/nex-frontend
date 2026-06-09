"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react"
import { api, PLATFORM_COLORS, STATUS_COLORS, type Campaign, type Platform, type Post } from "@/lib/api"

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn",
  x: "X / Twitter", discord: "Discord", blog: "Blog",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă", approved: "Aprobat", scheduled: "Programat",
  published: "Publicat", failed: "Eșuat", skipped: "Omis",
}

interface Props { orgId: string; token: string }

export function CampaignsList({ orgId, token }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [postsMap, setPostsMap] = useState<Record<string, Post[]>>({})
  const [loadingPosts, setLoadingPosts] = useState<string | null>(null)

  useEffect(() => {
    api.campaigns.list(orgId, token).then(setCampaigns).finally(() => setLoading(false))
  }, [orgId, token])

  const toggleCampaign = async (campaignId: string) => {
    if (expandedId === campaignId) {
      setExpandedId(null)
      return
    }
    setExpandedId(campaignId)
    if (!postsMap[campaignId]) {
      setLoadingPosts(campaignId)
      try {
        const posts = await api.campaigns.listPosts(orgId, campaignId, token)
        setPostsMap((prev) => ({ ...prev, [campaignId]: posts }))
      } finally {
        setLoadingPosts(null)
      }
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  const PlatformBadge = ({ platform }: { platform: string }) => (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: PLATFORM_COLORS[platform as Platform] ?? "#9CA3AF" }}
    >
      {PLATFORM_LABELS[platform] ?? platform}
    </span>
  )

  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#9CA3AF" }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )

  if (loading) return <p className="text-muted-foreground">Se încarcă campaniile...</p>

  return (
    <div className="space-y-3">
      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">Nicio postare încă</p>
          <p className="text-sm">Creează prima postare din Telegram Bot cu comanda /start.</p>
        </div>
      ) : (
        campaigns.map((campaign) => {
          const isExpanded = expandedId === campaign.id
          const posts = postsMap[campaign.id] ?? []

          return (
            <div key={campaign.id} className="rounded-lg border bg-card overflow-hidden">
              <button
                onClick={() => toggleCampaign(campaign.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  }
                  <div className="min-w-0">
                    <p className="font-medium truncate">{campaign.name}</p>
                    {campaign.topic && campaign.topic !== campaign.name && (
                      <p className="text-xs text-muted-foreground truncate">{campaign.topic}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(campaign.created_at)}
                  </span>
                  <StatusBadge status={campaign.status} />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t bg-muted/20">
                  {loadingPosts === campaign.id ? (
                    <p className="text-sm text-muted-foreground p-4">Se încarcă postările...</p>
                  ) : posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4">Nicio postare în această campanie.</p>
                  ) : (
                    <div className="divide-y">
                      {posts.map((post) => (
                        <div key={post.id} className="p-4 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <PlatformBadge platform={post.platform} />
                            <StatusBadge status={post.status} />
                            {post.scheduled_at && (
                              <span className="text-xs text-muted-foreground">
                                📅 {formatDate(post.scheduled_at)}
                              </span>
                            )}
                            {post.published_url && (
                              <a
                                href={post.published_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                Vezi postarea →
                              </a>
                            )}
                          </div>

                          {post.text_content && (
                            <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
                              {post.text_content}
                            </p>
                          )}

                          {post.image_urls.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {post.image_urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={url}
                                    alt={`Imagine ${i + 1}`}
                                    className="h-20 w-20 rounded-md object-cover border hover:opacity-80 transition-opacity"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none"
                                    }}
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          {post.status === "failed" && post.last_error && (
                            <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                              Eroare: {post.last_error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
