"use client"

import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, Pause, Play, RefreshCw, Languages, Share2, Clock, Ban, Archive, Copy, FolderInput, Star, FolderOpen, Folder, FileText, Inbox } from "lucide-react"
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
  paused: "Pauză", cancelled: "Anulată", archived: "Arhivată",
}
const PAGE_SIZES = [10, 25, 50, 100]
const ALL_PLATFORMS = ["instagram", "facebook", "linkedin", "x"]
const LANGUAGES = [
  { code: "ro", label: "Română" }, { code: "en", label: "English" },
  { code: "de", label: "Deutsch" }, { code: "fr", label: "Français" },
  { code: "es", label: "Español" }, { code: "it", label: "Italiano" },
]

interface Props { orgId: string; token: string }

type DialogType = "edit" | "reschedule" | "repost" | "translate" | "create_campaign" | "edit_image_prompt" | "move_post" | null

export function CampaignsList({ orgId, token }: Props) {
  const t = useTranslations("campaigns")
  const locale = useLocale()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [postsMap, setPostsMap] = useState<Record<string, Post[]>>({})
  const [loadingPosts, setLoadingPosts] = useState<string | null>(null)

  // Paginație + selecție bulk
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [archivedOnly, setArchivedOnly] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

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

  // Campaign CRUD
  const [creating, setCreating] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState("")
  const [newCampaignTopic, setNewCampaignTopic] = useState("")
  const [newCampaignStart, setNewCampaignStart] = useState("")
  const [newCampaignEnd, setNewCampaignEnd] = useState("")
  const [newCampaignBudget, setNewCampaignBudget] = useState("")
  const [newCampaignCurrency, setNewCampaignCurrency] = useState("RON")
  // Image prompt edit
  const [editImagePrompt, setEditImagePrompt] = useState("")
  // Move post
  const [moveTargetId, setMoveTargetId] = useState("")
  // Bulk post selection
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set())
  const [bulkPostCampaignId, setBulkPostCampaignId] = useState<string | null>(null)
  const [bulkPostBusy, setBulkPostBusy] = useState(false)
  const [bulkMoveTargetId, setBulkMoveTargetId] = useState("")
  // Posturi fără campanie (inbox)
  const [uncampaignedPosts, setUncampaignedPosts] = useState<Post[]>([])
  const [inboxExpanded, setInboxExpanded] = useState(false)
  const [loadingInbox, setLoadingInbox] = useState(false)

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const { items, total } = await api.campaigns.listPaged(orgId, token, {
        limit: pageSize, offset: page * pageSize, archivedOnly,
      })
      setCampaigns(items)
      setTotal(total)
    } finally { setLoading(false) }
  }

  const fetchUncampaigned = async () => {
    setLoadingInbox(true)
    try {
      const posts = await api.campaigns.listUncampaigned(orgId, token)
      setUncampaignedPosts(posts)
    } finally { setLoadingInbox(false) }
  }

  useEffect(() => { fetchCampaigns() }, [orgId, token, page, pageSize, archivedOnly])
  useEffect(() => { fetchUncampaigned() }, [orgId, token])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulk = async (action: "archive" | "pause" | "clone") => {
    if (selected.size === 0) return
    const label = action === "archive" ? "arhivezi" : action === "pause" ? "pui pe pauză" : "clonezi"
    if (!confirm(`Sigur ${label} ${selected.size} campanii?`)) return
    setBulkBusy(true)
    try {
      await api.campaigns.bulk(orgId, action, Array.from(selected), token)
      setSelected(new Set())
      await fetchCampaigns()
    } finally { setBulkBusy(false) }
  }

  const handleSetCurrent = async (campaign: Campaign) => {
    if (campaign.is_current) {
      await api.campaigns.unsetCurrent(orgId, token)
    } else {
      await api.campaigns.setCurrent(orgId, campaign.id, token)
    }
    await fetchCampaigns()
  }

  const handleCloneCampaign = async (campaign: Campaign) => {
    await api.campaigns.bulk(orgId, "clone", [campaign.id], token)
    await fetchCampaigns()
  }

  const handleArchiveCampaign = async (campaign: Campaign) => {
    await api.campaigns.bulk(orgId, "archive", [campaign.id], token)
    await fetchCampaigns()
  }

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

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return
    setCreating(true)
    try {
      const campaign = await api.campaigns.create(orgId, {
        name: newCampaignName,
        topic: newCampaignTopic || undefined,
        start_date: newCampaignStart ? new Date(newCampaignStart).toISOString() : undefined,
        end_date: newCampaignEnd ? new Date(newCampaignEnd).toISOString() : undefined,
        budget: newCampaignBudget || undefined,
        currency: newCampaignBudget ? newCampaignCurrency : undefined,
      }, token)
      setCampaigns((prev) => [campaign, ...prev])
      setNewCampaignName(""); setNewCampaignTopic(""); setNewCampaignStart("")
      setNewCampaignEnd(""); setNewCampaignBudget(""); setNewCampaignCurrency("RON")
      closeDialog()
    } finally { setCreating(false) }
  }

  const handleCampaignStatus = async (campaign: Campaign, newStatus: string) => {
    const updated = await api.campaigns.update(orgId, campaign.id, { status: newStatus }, token)
    setCampaigns((prev) => prev.map((c) => c.id === campaign.id ? updated : c))
  }

  const handleDeleteCampaign = async (campaign: Campaign) => {
    if (!confirm(`Ștergi campania "${campaign.name}"? Toate postările se vor șterge.`)) return
    try {
      await api.campaigns.deleteCampaign(orgId, campaign.id, token)
      setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id))
    } catch (e) {
      alert("Nu se poate șterge: doar campaniile draft fără consum de credite pot fi șterse. Folosește Arhivare.")
    }
  }

  const handleRetry = async (post: Post, campaignId: string) => {
    await api.posts.retry(orgId, post.id, token)
    await refreshPosts(campaignId)
  }

  const handleSaveImagePrompt = async () => {
    if (!activePost || !activeCampaignId) return
    setSaving(true)
    try {
      await api.posts.update(orgId, activePost.id, { image_prompt: editImagePrompt }, token)
      await refreshPosts(activeCampaignId)
      closeDialog()
    } finally { setSaving(false) }
  }

  const togglePostSelect = (postId: string, campaignId: string) => {
    if (bulkPostCampaignId !== null && bulkPostCampaignId !== campaignId) {
      setSelectedPostIds(new Set([postId]))
      setBulkPostCampaignId(campaignId)
      return
    }
    setBulkPostCampaignId(campaignId)
    setSelectedPostIds((prev) => {
      const next = new Set(prev)
      next.has(postId) ? next.delete(postId) : next.add(postId)
      if (next.size === 0) setBulkPostCampaignId(null)
      return next
    })
  }

  const handleBulkPosts = async (action: "pause" | "resume" | "delete" | "move", targetCampaignId?: string) => {
    if (selectedPostIds.size === 0 || !bulkPostCampaignId) return
    const labels: Record<string, string> = { pause: "pui pe pauză", resume: "reiei", delete: "ștergi", move: "muți" }
    if (!confirm(`Sigur ${labels[action]} ${selectedPostIds.size} postări?`)) return
    setBulkPostBusy(true)
    try {
      await api.posts.bulk(orgId, {
        action,
        post_ids: Array.from(selectedPostIds),
        target_campaign_id: targetCampaignId,
      }, token)
      const campaignId = bulkPostCampaignId
      setSelectedPostIds(new Set())
      setBulkPostCampaignId(null)
      setBulkMoveTargetId("")
      await refreshPosts(campaignId)
      if (targetCampaignId && postsMap[targetCampaignId]) await refreshPosts(targetCampaignId)
    } finally { setBulkPostBusy(false) }
  }

  const handleMovePost = async () => {
    if (!activePost || !moveTargetId) return
    setSaving(true)
    try {
      await api.posts.update(orgId, activePost.id, { campaign_id: moveTargetId }, token)
      if (activeCampaignId) await refreshPosts(activeCampaignId)
      else await fetchUncampaigned()  // post venea din inbox
      if (postsMap[moveTargetId]) await refreshPosts(moveTargetId)
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Pe pagină</span>
            <select
              value={pageSize}
              onChange={(e) => { setPage(0); setPageSize(parseInt(e.target.value, 10)) }}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={archivedOnly}
              onChange={(e) => { setPage(0); setArchivedOnly(e.target.checked) }}
            />
            {archivedOnly ? "Arhivate (activ)" : "Arată arhivate"}
          </label>
        </div>
        <Button onClick={() => setActiveDialog("create_campaign")} size="sm">
          + Campanie nouă
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2 text-sm">
          <span className="px-1 font-medium">{selected.size} selectate</span>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => handleBulk("archive")}>
            <Archive className="mr-1 h-3.5 w-3.5" /> Arhivează
          </Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => handleBulk("pause")}>
            <Pause className="mr-1 h-3.5 w-3.5" /> Pauză
          </Button>
          <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => handleBulk("clone")}>
            <Copy className="mr-1 h-3.5 w-3.5" /> Clonează
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Deselectează</Button>
        </div>
      )}

      {/* Inbox: posturi fără campanie */}
      {(uncampaignedPosts.length > 0 || loadingInbox) && (
        <div className="rounded-lg border-2 border-dashed border-amber-300/60 bg-amber-50/30 dark:bg-amber-950/10 overflow-hidden">
          <button
            onClick={() => setInboxExpanded((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors text-left"
          >
            {inboxExpanded
              ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-amber-600" />
              : <ChevronRight className="h-4 w-4 flex-shrink-0 text-amber-600" />}
            <Inbox className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                Posturi fără campanie
                <span className="ml-2 text-xs font-normal bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full px-2 py-0.5">
                  {uncampaignedPosts.length}
                </span>
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Trimise din Telegram fără campanie curentă selectată. Atribuie-le unei campanii.</p>
            </div>
          </button>
          {inboxExpanded && (
            <div className="border-t border-amber-200/60 divide-y divide-amber-100/60">
              {loadingInbox ? (
                <p className="text-sm text-muted-foreground p-4">Se încarcă...</p>
              ) : uncampaignedPosts.map((post) => (
                <div key={post.id} className="p-4 pl-11 space-y-2 bg-amber-50/20 dark:bg-amber-950/5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      <PlatformBadge platform={post.platform} />
                      <StatusBadge status={post.status} />
                      {post.scheduled_at && (
                        <span className="text-xs text-muted-foreground">📅 {formatDate(post.scheduled_at)}</span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => {
                          setActivePost(post); setActiveCampaignId(null); setMoveTargetId(""); setActiveDialog("move_post")
                        }}>
                          <FolderInput className="mr-2 h-4 w-4" /> Atribuie campanie
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={async () => {
                          if (!confirm(t("delete_confirm"))) return
                          await api.posts.delete(orgId, post.id, token)
                          await fetchUncampaigned()
                        }} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {post.text_content && (
                    <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3 pl-5">{post.text_content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
            // Campanie = container folder
            <div key={campaign.id} className="rounded-lg border-2 bg-card overflow-hidden shadow-sm">
              <div className="flex items-center bg-muted/30">
                <input
                  type="checkbox"
                  className="ml-4 flex-shrink-0"
                  checked={selected.has(campaign.id)}
                  onChange={() => toggleSelect(campaign.id)}
                  aria-label="Selectează campania"
                />
              <button onClick={() => toggleCampaign(campaign.id)}
                className="flex-1 flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                <div className="flex items-center gap-3 min-w-0">
                  {isExpanded
                    ? <FolderOpen className="h-4 w-4 flex-shrink-0 text-primary" />
                    : <Folder className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                  <div className="min-w-0">
                    <p className="font-semibold truncate flex items-center gap-1.5 text-sm">
                      {campaign.is_current && (
                        <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />
                      )}
                      {campaign.name}
                    </p>
                    {campaign.topic && campaign.topic !== campaign.name && (
                      <p className="text-xs text-muted-foreground truncate">{campaign.topic}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {campaign.start_date && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {formatDate(campaign.start_date)} → {campaign.end_date ? formatDate(campaign.end_date) : "∞"}
                    </span>
                  )}
                  {campaign.budget && (
                    <span className="text-xs font-medium text-muted-foreground hidden sm:block">
                      {campaign.budget} {campaign.currency}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(campaign.created_at)}</span>
                  <StatusBadge status={campaign.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {campaign.status !== "paused" && campaign.status !== "published" && campaign.status !== "archived" && campaign.status !== "cancelled" && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCampaignStatus(campaign, "paused") }}>
                          <Pause className="mr-2 h-4 w-4" /> Pauză campanie
                        </DropdownMenuItem>
                      )}
                      {campaign.status === "paused" && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCampaignStatus(campaign, "approved") }}>
                          <Play className="mr-2 h-4 w-4" /> Reluare campanie
                        </DropdownMenuItem>
                      )}
                      {campaign.status !== "cancelled" && campaign.status !== "archived" && campaign.status !== "published" && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCampaignStatus(campaign, "cancelled") }}>
                          <Ban className="mr-2 h-4 w-4" /> Anulează campania
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSetCurrent(campaign) }}>
                        <Star className="mr-2 h-4 w-4" />
                        {campaign.is_current ? "Elimină marcajul curent" : "Marchează ca curentă"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCloneCampaign(campaign) }}>
                        <Copy className="mr-2 h-4 w-4" /> Clonează (cu pauză)
                      </DropdownMenuItem>
                      {campaign.status !== "archived" && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchiveCampaign(campaign) }}>
                          <Archive className="mr-2 h-4 w-4" /> Arhivează
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(campaign) }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Șterge (doar draft)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </button>
              </div>

              {isExpanded && (
                <div className="border-t bg-background">
                  {loadingPosts === campaign.id ? (
                    <p className="text-sm text-muted-foreground p-4 pl-10">{t("loading_posts")}</p>
                  ) : posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 pl-10 italic">{t("empty_campaign_posts")}</p>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {/* Bulk action bar pentru postările selectate */}
                      {bulkPostCampaignId === campaign.id && selectedPostIds.size > 0 && (
                        <div className="flex flex-wrap items-center gap-2 p-3 bg-primary/5 border-b">
                          <span className="text-xs font-medium px-1">{selectedPostIds.size} postări selectate</span>
                          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={bulkPostBusy}
                            onClick={() => handleBulkPosts("pause")}>
                            <Pause className="mr-1 h-3 w-3" /> Pauză
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={bulkPostBusy}
                            onClick={() => handleBulkPosts("resume")}>
                            <Play className="mr-1 h-3 w-3" /> Reia
                          </Button>
                          <div className="flex items-center gap-1">
                            <Select value={bulkMoveTargetId} onValueChange={setBulkMoveTargetId}>
                              <SelectTrigger className="h-7 w-36 text-xs">
                                <SelectValue placeholder="Mută în..." />
                              </SelectTrigger>
                              <SelectContent>
                                {campaigns.filter((c) => c.id !== campaign.id).map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {bulkMoveTargetId && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={bulkPostBusy}
                                onClick={() => handleBulkPosts("move", bulkMoveTargetId)}>
                                <FolderInput className="mr-1 h-3 w-3" /> Mută
                              </Button>
                            )}
                          </div>
                          <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={bulkPostBusy}
                            onClick={() => handleBulkPosts("delete")}>
                            <Trash2 className="mr-1 h-3 w-3" /> Șterge
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => { setSelectedPostIds(new Set()); setBulkPostCampaignId(null) }}>
                            Deselectează
                          </Button>
                        </div>
                      )}
                      {posts.map((post) => (
                        // Postare = item subordonat, vizual distinct față de campanie
                        <div key={post.id} className="pl-10 pr-4 py-3 space-y-2 hover:bg-muted/20 transition-colors">
                          {/* Header: platformă, status, dată, acțiuni */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <input
                                type="checkbox"
                                className="flex-shrink-0 rounded"
                                checked={selectedPostIds.has(post.id)}
                                onChange={() => togglePostSelect(post.id, campaign.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
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
                                <DropdownMenuItem onClick={() => {
                                  setActivePost(post)
                                  setActiveCampaignId(campaign.id)
                                  setActiveDialog("edit_image_prompt")
                                  setEditImagePrompt(post.image_prompt ?? "")
                                }}>
                                  <Pencil className="mr-2 h-4 w-4" /> Prompt imagine
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
                                <DropdownMenuItem onClick={() => {
                                  setActivePost(post)
                                  setActiveCampaignId(campaign.id)
                                  setMoveTargetId("")
                                  setActiveDialog("move_post")
                                }}>
                                  <FolderInput className="mr-2 h-4 w-4" /> Mută în campanie
                                </DropdownMenuItem>
                                {post.status === "failed" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleRetry(post, campaign.id)}>
                                      <RefreshCw className="mr-2 h-4 w-4" /> Încearcă din nou
                                    </DropdownMenuItem>
                                  </>
                                )}
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

      {/* Paginație */}
      {total > pageSize && (
        <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
          <span>Pagina {page + 1} din {totalPages} • {total} campanii</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Înapoi
            </Button>
            <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Înainte
            </Button>
          </div>
        </div>
      )}

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

      {/* Dialog: Creare campanie */}
      <Dialog open={activeDialog === "create_campaign"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Campanie nouă</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nume campanie *</p>
              <Input
                placeholder="ex: Lansare produs mai 2026"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Topic / descriere</p>
              <Textarea
                placeholder="Despre ce e campania? AI-ul va folosi asta la generare."
                value={newCampaignTopic}
                onChange={(e) => setNewCampaignTopic(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data start</p>
                <Input type="date" value={newCampaignStart} onChange={(e) => setNewCampaignStart(e.target.value)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data end</p>
                <Input type="date" value={newCampaignEnd} onChange={(e) => setNewCampaignEnd(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Buget (opțional)</p>
                <Input placeholder="ex: 5000" value={newCampaignBudget} onChange={(e) => setNewCampaignBudget(e.target.value)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Monedă</p>
                <Select value={newCampaignCurrency} onValueChange={setNewCampaignCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RON">RON</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Anulează</Button>
            <Button onClick={handleCreateCampaign} disabled={creating || !newCampaignName.trim()}>
              {creating ? "Se creează..." : "Creează campania"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Mută postare în altă campanie */}
      <Dialog open={activeDialog === "move_post"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mută postarea în altă campanie</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Selectează campania destinație:</p>
            <Select value={moveTargetId} onValueChange={setMoveTargetId}>
              <SelectTrigger><SelectValue placeholder="Alege campania..." /></SelectTrigger>
              <SelectContent>
                {campaigns
                  .filter((c) => c.id !== activeCampaignId)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Anulează</Button>
            <Button onClick={handleMovePost} disabled={saving || !moveTargetId}>
              {saving ? "Se mută..." : "Mută postarea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editare prompt imagine */}
      <Dialog open={activeDialog === "edit_image_prompt"} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editează prompt imagine</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Promptul EN trimis la generatorul AI. Modifică și salvează.
            </p>
            <Textarea
              value={editImagePrompt}
              onChange={(e) => setEditImagePrompt(e.target.value)}
              rows={8}
              className="resize-none text-sm font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Anulează</Button>
            <Button onClick={handleSaveImagePrompt} disabled={saving}>
              {saving ? "Se salvează..." : "Salvează prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
