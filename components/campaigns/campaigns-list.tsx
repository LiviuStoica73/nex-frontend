"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, Pause, Play, RefreshCw, Languages, Share2, Clock } from "lucide-react"
import { api, PLATFORM_COLORS, STATUS_COLORS, type Campaign, type Platform, type Post } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn",
  x: "X / Twitter", discord: "Discord", blog: "Blog",
}
const STATUS_LABELS: Record<string, string> = {
  draft: "Ciornă", approved: "Aprobat", scheduled: "Programat",
  published: "Publicat", failed: "Eșuat", skipped: "Omis",
}
const ALL_PLATFORMS = ["instagram", "facebook", "linkedin", "x"]
const LANGUAGES = [
  { code: "ro", label: "Română" }, { code: "en", label: "English" },
  { code: "de", label: "Deutsch" }, { code: "fr", label: "Français" },
  { code: "es", label: "Español" }, { code: "it", label: "Italiano" },
]

interface Props { orgId: string; token: string }

type DialogType = "edit" | "reschedule" | "repost" | "translate" | null

export function CampaignsList({ orgId, token }: Props) {
  const t = useTranslations("campaigns")
  const locale = useLocale()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [postsMap, setPostsMap] = useState<Record<string, Post[]>>({})
  const [loadingPosts, setLoadingPosts] = useState<string | null>(null)

  // Dialog state
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)
  const [activePost, setActivePost] = useState<Post | null>(null)
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit fields
  const [editText, setEditText] = useState("")
  const [editSchedule, setEditSchedule] = useState("")
  const [repostPlatforms, setRepostPlatforms] = useState<string[]>([])
  const [repostSchedule, setRepostSchedule] = useState("")
  const [translateLang, setTranslateLang] = useState("en")
  const [translatePlatform, setTranslatePlatform] = useState("")

  useEffect(() => {
    api.campaigns.list(orgId, token).then(setCampaigns).finally(() => setLoading(false))
  }, [orgId, token])

  const toggleCampaign = async (campaignId: string) => {
    if (expandedId === campaignId) { setExpandedId(null); return }
    setExpandedId(campaignId)
    if (!postsMap[campaignId]) {
      setLoadingPosts(campaignId)
      try {
        const posts = await api.campaigns.listPosts(orgId, campaignId, token)
        setPostsMap((prev) => ({ ...prev, [campaignId]: posts }))
      } finally { setLoadingPosts(null) }
    }
  }

  const refreshPosts = async (campaignId: string) => {
    const posts = await api.campaigns.listPosts(orgId, campaignId, token)
    setPostsMap((prev) => ({ ...prev, [campaignId]: posts }))
  }

  const openDialog = (type: DialogType, post: Post, campaignId: string) => {
    setActivePost(post)
    setActiveCampaignId(campaignId)
    setActiveDialog(type)
    if (type === "edit") setEditText(post.text_content ?? "")
    if (type === "reschedule") {
      const d = post.scheduled_at ? new Date(post.scheduled_at) : new Date()
      setEditSchedule(d.toISOString().slice(0, 16))
    }
    if (type === "repost") { setRepostPlatforms([]); setRepostSchedule("") }
    if (type === "translate") { setTranslateLang("en"); setTranslatePlatform(post.platform) }
  }

  const closeDialog = () => { setActiveDialog(null); setActivePost(null) }

  const handleSaveEdit = async () => {
    if (!activePost || !activeCampaignId) return
    setSaving(true)
    try {
      await api.posts.update(orgId, activePost.id, { text_content: editText }, token)
      await refreshPosts(activeCampaignId)
      closeDialog()
    } finally { setSaving(false) }
  }

  const handleReschedule = async () => {
    if (!activePost || !activeCampaignId) return
    setSaving(true)
    try {
      await api.posts.update(orgId, activePost.id, { scheduled_at: new Date(editSchedule).toISOString() }, token)
      await refreshPosts(activeCampaignId)
      closeDialog()
    } finally { setSaving(false) }
  }

  const handlePause = async (post: Post, campaignId: string) => {
    await api.posts.update(orgId, post.id, { status: "approved" }, token)
    await refreshPosts(campaignId)
  }

  const handleResume = async (post: Post, campaignId: string) => {
    await api.posts.update(orgId, post.id, { status: "scheduled" }, token)
    await refreshPosts(campaignId)
  }

  const handleDelete = async (post: Post, campaignId: string) => {
    if (!confirm(t("delete_confirm"))) return
    await api.posts.delete(orgId, post.id, token)
    await refreshPosts(campaignId)
  }

  const handleRepost = async () => {
    if (!activePost || !activeCampaignId || repostPlatforms.length === 0) return
    setSaving(true)
    try {
      await api.posts.repost(orgId, activePost.id, {
        platforms: repostPlatforms,
        scheduled_at: repostSchedule ? new Date(repostSchedule).toISOString() : undefined,
      }, token)
      await refreshPosts(activeCampaignId)
      closeDialog()
    } finally { setSaving(false) }
  }

  const handleTranslate = async () => {
    if (!activePost || !activeCampaignId) return
    setSaving(true)
    try {
      await api.posts.translate(orgId, activePost.id, {
        language: translateLang,
        platform: translatePlatform || undefined,
      }, token)
      await refreshPosts(activeCampaignId)
      closeDialog()
    } finally { setSaving(false) }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleString(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const PlatformBadge = ({ platform }: { platform: string }) => (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: PLATFORM_COLORS[platform as Platform] ?? "#9CA3AF" }}>
      {t(`platforms.${platform}`) ?? PLATFORM_LABELS[platform] ?? platform}
    </span>
  )

  const StatusBadge = ({ status }: { status: string }) => (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#9CA3AF" }}>
      {t(`statuses.${status}`) ?? STATUS_LABELS[status] ?? status}
    </span>
  )

  if (loading) return <p className="text-muted-foreground">{t("loading_campaigns")}</p>

  return (
    <>
      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">{t("empty_title")}</p>
            <p className="text-sm">{t("empty_subtitle")}</p>
          </div>
        ) : campaigns.map((campaign) => {
          const isExpanded = expandedId === campaign.id
          const posts = postsMap[campaign.id] ?? []
          return (
            <div key={campaign.id} className="rounded-lg border bg-card overflow-hidden">
              <button onClick={() => toggleCampaign(campaign.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                <div className="flex items-center gap-3 min-w-0">
                  {isExpanded ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{campaign.name}</p>
                    {campaign.topic && campaign.topic !== campaign.name && (
                      <p className="text-xs text-muted-foreground truncate">{campaign.topic}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground">{formatDate(campaign.created_at)}</span>
                  <StatusBadge status={campaign.status} />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t bg-muted/20">
                  {loadingPosts === campaign.id ? (
                    <p className="text-sm text-muted-foreground p-4">{t("loading_posts")}</p>
                  ) : posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4">{t("empty_campaign_posts")}</p>
                  ) : (
                    <div className="divide-y">
                      {posts.map((post) => (
                        <div key={post.id} className="p-4 space-y-3">
                          {/* Header: platformă, status, dată, acțiuni */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <PlatformBadge platform={post.platform} />
                              <StatusBadge status={post.status} />
                              {post.language && post.language !== "ro" && (
                                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground uppercase">
                                  {post.language}
                                </span>
                              )}
                              {post.scheduled_at && (
                                <span className="text-xs text-muted-foreground">📅 {formatDate(post.scheduled_at)}</span>
                              )}
                              {post.published_url && (
                                <a href={post.published_url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline">
                                  {t("view_post")}
                                </a>
                              )}
                            </div>

                            {/* Meniu acțiuni */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => openDialog("edit", post, campaign.id)}>
                                  <Pencil className="mr-2 h-4 w-4" /> {t("edit_text")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDialog("reschedule", post, campaign.id)}>
                                  <Clock className="mr-2 h-4 w-4" /> {t("reschedule")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {post.status === "scheduled" ? (
                                  <DropdownMenuItem onClick={() => handlePause(post, campaign.id)}>
                                    <Pause className="mr-2 h-4 w-4" /> {t("pause")}
                                  </DropdownMenuItem>
                                ) : post.status === "approved" ? (
                                  <DropdownMenuItem onClick={() => handleResume(post, campaign.id)}>
                                    <Play className="mr-2 h-4 w-4" /> {t("resume")}
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem onClick={() => openDialog("repost", post, campaign.id)}>
                                  <RefreshCw className="mr-2 h-4 w-4" /> {t("repost")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDialog("translate", post, campaign.id)}>
                                  <Languages className="mr-2 h-4 w-4" /> {t("other_language")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDialog("repost", post, campaign.id)}>
                                  <Share2 className="mr-2 h-4 w-4" /> {t("other_social_network")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(post, campaign.id)}
                                  className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> {t("delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Imagini */}
                          {post.image_urls && post.image_urls.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {post.image_urls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt={t("image_alt", { index: i + 1 })}
                                    className="h-24 w-24 rounded-md object-cover border hover:opacity-80 transition-opacity"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Text */}
                          {post.text_content && (
                            <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
                              {post.text_content}
                            </p>
                          )}

                          {post.status === "failed" && post.last_error && (
                            <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
                              {t("error_prefix")}: {post.last_error}
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
        })}
      </div>

      {/* Dialog: Modifică text */}
      <Dialog open={activeDialog === "edit"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("dialog_edit_title")}</DialogTitle></DialogHeader>
          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)}
            rows={10} className="resize-none text-sm" />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t("cancel")}</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reprogramează */}
      <Dialog open={activeDialog === "reschedule"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("dialog_reschedule_title")}</DialogTitle></DialogHeader>
          <Input type="datetime-local" value={editSchedule}
            onChange={(e) => setEditSchedule(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t("cancel")}</Button>
            <Button onClick={handleReschedule} disabled={saving}>
              {saving ? t("saving") : t("reschedule")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Repostează / Altă rețea */}
      <Dialog open={activeDialog === "repost"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("dialog_repost_title")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("select_platforms")}</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PLATFORMS.map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={repostPlatforms.includes(p)}
                    onChange={(e) => setRepostPlatforms(e.target.checked
                      ? [...repostPlatforms, p]
                      : repostPlatforms.filter((x) => x !== p))} />
                  {PLATFORM_LABELS[p]}
                </label>
              ))}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("scheduled_date_optional")}</p>
              <Input type="datetime-local" value={repostSchedule}
                onChange={(e) => setRepostSchedule(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t("cancel")}</Button>
            <Button onClick={handleRepost} disabled={saving || repostPlatforms.length === 0}>
              {saving ? t("creating") : t("create_posts")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Altă limbă */}
      <Dialog open={activeDialog === "translate"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("dialog_translate_title")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("language_label")}</p>
              <Select value={translateLang} onValueChange={setTranslateLang}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("platform_optional_label")}</p>
              <Select value={translatePlatform} onValueChange={setTranslatePlatform}>
                <SelectTrigger><SelectValue placeholder={t("same_platform")} /></SelectTrigger>
                <SelectContent>
                  {ALL_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t("cancel")}</Button>
            <Button onClick={handleTranslate} disabled={saving}>
              {saving ? t("generating") : t("generate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
