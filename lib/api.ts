const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API ${res.status}: ${err}`)
  }
  return res.json() as Promise<T>
}

export type Platform =
  | "facebook" | "instagram" | "linkedin" | "x"
  | "discord" | "blog" | "youtube" | "threads" | "bluesky"

export type PostStatus = "draft" | "approved" | "scheduled" | "published" | "failed" | "skipped"
export type CampaignStatus = "draft" | "approved" | "scheduled" | "published" | "paused" | "cancelled" | "archived"

export interface Org {
  id: string
  name: string
  slug: string
  is_agency: boolean
  timezone: string
  default_languages: string[]
}

export interface Campaign {
  id: string
  name: string
  slug: string
  topic: string | null
  status: CampaignStatus
  created_at: string
  start_date: string | null
  end_date: string | null
  budget: string | null
  currency: string | null
}

export interface Post {
  id: string
  campaign_id: string
  platform: Platform
  post_type: string
  language: string
  text_content: string | null
  hashtags: string[]
  image_urls: string[]
  image_prompt: string | null
  video_urls: string[]
  scheduled_at: string | null
  status: PostStatus
  published_url: string | null
  last_error: string | null
  retry_count: number
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  facebook:  "#1877F2",
  instagram: "#E1306C",
  linkedin:  "#0A66C2",
  x:         "#000000",
  discord:   "#5865F2",
  blog:      "#21759B",
  youtube:   "#FF0000",
  threads:   "#000000",
  bluesky:   "#0085FF",
}

export const STATUS_COLORS: Record<PostStatus, string> = {
  draft:     "#9CA3AF",
  approved:  "#3B82F6",
  scheduled: "#F59E0B",
  published: "#10B981",
  failed:    "#EF4444",
  skipped:   "#6B7280",
}

// ── API calls ──────────────────────────────────────────────────────────────

export const api = {
  orgs: {
    listMine: (token: string) =>
      apiFetch<Org[]>(`/api/v1/me/orgs`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    switch: (orgId: string, token: string) =>
      apiFetch<{ active_org_id: string }>(`/api/v1/orgs/${orgId}/switch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  campaigns: {
    list: (orgId: string, token: string) =>
      apiFetch<Campaign[]>(`/api/v1/orgs/${orgId}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    create: (orgId: string, data: {
      name: string; topic?: string;
      start_date?: string; end_date?: string; budget?: string; currency?: string
    }, token: string) =>
      apiFetch<Campaign>(`/api/v1/orgs/${orgId}/campaigns`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      }),
    listPosts: (orgId: string, campaignId: string, token: string) =>
      apiFetch<Post[]>(`/api/v1/orgs/${orgId}/campaigns/${campaignId}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    update: (orgId: string, campaignId: string, data: Partial<{
      name: string; topic: string; status: string;
      start_date: string; end_date: string; budget: string; currency: string
    }>, token: string) =>
      apiFetch<Campaign>(`/api/v1/orgs/${orgId}/campaigns/${campaignId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      }),
    deleteCampaign: (orgId: string, campaignId: string, token: string) =>
      apiFetch<void>(`/api/v1/orgs/${orgId}/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  calendar: {
    getPosts: (orgId: string, start: string, end: string, token: string) =>
      apiFetch<Post[]>(
        `/api/v1/orgs/${orgId}/calendar?start=${start}&end=${end}`,
        { headers: { Authorization: `Bearer ${token}` } },
      ),
  },

  posts: {
    schedule: (postId: string, scheduledAt: string, token: string) =>
      apiFetch<Post>(`/api/v1/posts/${postId}/schedule`, {
        method: "POST",
        body: JSON.stringify({ scheduled_at: scheduledAt }),
        headers: { Authorization: `Bearer ${token}` },
      }),
    publishNow: (postId: string, token: string) =>
      apiFetch<Post>(`/api/v1/posts/${postId}/publish-now`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    update: (orgId: string, postId: string, data: { text_content?: string; scheduled_at?: string; status?: string; image_prompt?: string }, token: string) =>
      apiFetch<Post>(`/api/v1/orgs/${orgId}/posts/${postId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      }),
    delete: (orgId: string, postId: string, token: string) =>
      apiFetch<void>(`/api/v1/orgs/${orgId}/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
    repost: (orgId: string, postId: string, data: { platforms: string[]; scheduled_at?: string }, token: string) =>
      apiFetch<Post[]>(`/api/v1/orgs/${orgId}/posts/${postId}/repost`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      }),
    translate: (orgId: string, postId: string, data: { language: string; platform?: string }, token: string) =>
      apiFetch<Post>(`/api/v1/orgs/${orgId}/posts/${postId}/translate`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      }),
    retry: (orgId: string, postId: string, token: string) =>
      apiFetch<Post>(`/api/v1/orgs/${orgId}/posts/${postId}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  generate: {
    text: (orgId: string, data: { topic: string; platform: Platform; language?: string }, token: string) =>
      apiFetch<{ text: string; platform: Platform; language: string }>(
        `/api/v1/orgs/${orgId}/generate`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
  },
}
