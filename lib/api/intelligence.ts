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
