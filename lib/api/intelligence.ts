// lib/api/intelligence.ts
// Version: 1.0.0 — 2026-07-10
// Scope: Intelligence & Autopilot API client functions for Nex-Nex frontend
// Functions: getBusinessBrainStatus, saveInterview, scanWebsite, getStrategies,
//            getStrategy, runStrategy, getCompetitors, addCompetitor, findCompetitors,
//            proposeThemes, getAutopilotCost, generateThemesContent

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.nex-nex.com'

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `API error ${response.status}`)
  }
  return response.json()
}

export async function getBusinessBrainStatus(orgId: string, token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/status`, token)
}

export async function saveInterview(orgId: string, answers: Record<string, string>, token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/interview`, token, {
    method: 'POST',
    body: JSON.stringify(answers),
  })
}

export async function scanWebsite(orgId: string, url: string, depth: 'standard' | 'deep', token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/scan-website`, token, {
    method: 'POST',
    body: JSON.stringify({ url, depth }),
  })
}

export async function deleteWebsiteScan(orgId: string, scanId: string, token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/scans/${scanId}`, token, {
    method: 'DELETE',
  })
}

export async function getStrategies(orgId: string, token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/strategies`, token)
}

export async function getStrategy(orgId: string, strategyId: string, token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/strategies/${strategyId}`, token)
}

export async function runStrategy(orgId: string, scanDepth: 'standard' | 'deep', token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/strategy/run?scan_depth=${scanDepth}`, token, {
    method: 'POST',
  })
}

export async function getCompetitors(orgId: string, token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/competitors`, token)
}

export async function addCompetitor(orgId: string, url: string, name: string | undefined, token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/competitors`, token, {
    method: 'POST',
    body: JSON.stringify({ url, name }),
  })
}

export async function findCompetitors(orgId: string, niche: string, token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/competitors/find`, token, {
    method: 'POST',
    body: JSON.stringify({ niche }),
  })
}

export async function getConnectedPlatforms(orgId: string, token: string): Promise<string[]> {
  const accounts = await apiFetch(`/api/v1/orgs/${orgId}/social-accounts`, token)
  return [...new Set((accounts as any[]).map((a: any) => a.platform))]
}

export async function listOpportunities(
  orgId: string,
  token: string,
  page = 1,
  pageSize = 25,
  statusFilter?: string
) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (statusFilter) params.set('status_filter', statusFilter)
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities?${params}`, token)
}

export async function countOpportunities(orgId: string, token: string, statusFilter?: string) {
  const params = statusFilter ? `?status_filter=${statusFilter}` : ''
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/count${params}`, token)
}

export async function updateOpportunityStatus(
  orgId: string,
  oppId: string,
  status: string,
  token: string
) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/${oppId}/status`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function reorderOpportunities(
  orgId: string,
  items: { id: string; score: number }[],
  token: string
) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/reorder`, token, {
    method: 'POST',
    body: JSON.stringify(items),
  })
}

export async function editOpportunity(
  orgId: string,
  oppId: string,
  fields: { title?: string; hook?: string; insight?: string; pillar?: string; platforms?: string[]; format?: string },
  token: string
) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/${oppId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  })
}

export async function proposeThemes(orgId: string, opportunityIds: string[], token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/autopilot/propose`, token, {
    method: 'POST',
    body: JSON.stringify({ opportunity_ids: opportunityIds }),
  })
}

export async function getAutopilotCost(orgId: string, themeCount: number, withImages: boolean, token: string) {
  return apiFetch(
    `/api/v1/orgs/${orgId}/autopilot/cost?theme_count=${themeCount}&with_images=${withImages}`,
    token
  )
}

export async function generateThemesContent(
  orgId: string,
  campaignId: string,
  approvedThemes: Array<{ opportunity_id: string; title: string; visual_category: string; platforms: string[] }>,
  token: string
) {
  return apiFetch(`/api/v1/orgs/${orgId}/autopilot/generate`, token, {
    method: 'POST',
    body: JSON.stringify({ campaign_id: campaignId, approved_themes: approvedThemes }),
  })
}

// ---------------------------------------------------------------------------
// Nou flux: prototip direct pe oportunitate
// ---------------------------------------------------------------------------

export interface ImageVersion {
  url: string
  prompt: string
  selected: boolean
  created_at: string
}

export interface ContentOpportunity {
  id: string
  title: string
  hook: string | null
  insight: string | null
  pillar: string | null
  objective: string | null
  target_audience: string | null
  format: string | null
  platforms: string[]
  difficulty: string | null
  estimated_impact: string | null
  score: number | null
  status: 'idea' | 'generating' | 'review' | 'published' | 'rejected' | string
  master_text: string | null
  image_url: string | null
  image_prompt: string | null
  image_prompt_raw: string | null
  image_versions: ImageVersion[]
  prototype_generated_at: string | null
  created_at: string
}

export async function generatePrototype(orgId: string, oppId: string, token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/${oppId}/generate`, token, {
    method: 'POST',
  })
}

export async function generateIdeas(orgId: string, count: number, token: string, focus?: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/generate-ideas`, token, {
    method: 'POST',
    body: JSON.stringify({ count, focus: focus || null }),
  })
}

export async function generateBulkPrototypes(orgId: string, opportunityIds: string[], token: string) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/generate-bulk`, token, {
    method: 'POST',
    body: JSON.stringify({ opportunity_ids: opportunityIds }),
  })
}

export async function updatePrototype(
  orgId: string,
  oppId: string,
  fields: { master_text?: string; image_prompt_raw?: string },
  token: string
) {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/${oppId}/prototype`, token, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  })
}

export async function regenerateOpportunityImage(orgId: string, oppId: string, token: string, scenePrompt?: string): Promise<{ image_url: string; image_versions: ImageVersion[] }> {
  return apiFetch(
    `/api/v1/orgs/${orgId}/intelligence/opportunities/${oppId}/regenerate-image`,
    token,
    { method: 'POST', body: JSON.stringify({ scene_concept: scenePrompt || null }) }
  )
}

export async function publishOpportunities(orgId: string, opportunityIds: string[], token: string): Promise<{ campaign_id: string }> {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/publish`, token, {
    method: 'POST',
    body: JSON.stringify({ opportunity_ids: opportunityIds }),
  })
}

// ---------------------------------------------------------------------------
// Autopilot v2 — prototipuri + review + publicare (legacy)
// ---------------------------------------------------------------------------

export interface AutopilotDraft {
  id: string
  opportunity_id: string
  title: string
  hook: string | null
  master_text: string
  image_url: string | null
  image_prompt: string | null
  visual_category: string | null
  status: 'pending' | 'approved' | 'published'
}

export async function generatePrototypes(
  orgId: string,
  themes: Array<{ opportunity_id: string; title: string; hook?: string | null; visual_category: string }>,
  token: string
): Promise<{ started: boolean; task_id: string; theme_count: number }> {
  return apiFetch(`/api/v1/orgs/${orgId}/autopilot/generate-prototypes`, token, {
    method: 'POST',
    body: JSON.stringify({ themes }),
  })
}

export async function getPrototypes(orgId: string, token: string): Promise<AutopilotDraft[]> {
  return apiFetch(`/api/v1/orgs/${orgId}/autopilot/prototypes`, token)
}

export async function regenerateImage(
  orgId: string,
  draftId: string,
  imagePrompt: string,
  token: string
): Promise<{ image_url: string; image_prompt: string }> {
  return apiFetch(`/api/v1/orgs/${orgId}/autopilot/regenerate-image`, token, {
    method: 'POST',
    body: JSON.stringify({ draft_id: draftId, image_prompt: imagePrompt }),
  })
}

export async function publishApprovedDrafts(
  orgId: string,
  approvedDrafts: Array<{ draft_id: string; master_text: string }>,
  token: string
): Promise<{ campaign_id: string }> {
  return apiFetch(`/api/v1/orgs/${orgId}/autopilot/publish`, token, {
    method: 'POST',
    body: JSON.stringify({ approved_drafts: approvedDrafts }),
  })
}

export interface PublishedLink {
  platform: string
  url: string | null
  published_at: string | null
  scheduled_at: string | null
  status: string
  post_type?: string
}

export async function getPublishedLinks(orgId: string, oppId: string, token: string): Promise<PublishedLink[]> {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/${oppId}/published-links`, token)
}

export async function createOpportunity(
  orgId: string,
  data: { title: string; hook?: string; image_prompt_raw?: string; pillar?: string; platforms?: string[] },
  token: string
): Promise<ContentOpportunity> {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities`, token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function selectOpportunityImage(orgId: string, oppId: string, url: string, selected: boolean, token: string): Promise<{ image_versions: any[], image_url: string }> {
  return apiFetch(`/api/v1/orgs/${orgId}/intelligence/opportunities/${oppId}/image-select`, token, {
    method: 'PATCH',
    body: JSON.stringify({ url, selected }),
  })
}
