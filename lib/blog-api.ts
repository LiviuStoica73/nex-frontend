import { BlogPost } from "@/types/blog"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.nex-nex.com"

export async function getBlogPosts(options?: {
  language?: string
  limit?: number
  offset?: number
}): Promise<BlogPost[]> {
  const params = new URLSearchParams()
  if (options?.language) params.set("language", options.language)
  if (options?.limit) params.set("limit", String(options.limit))
  if (options?.offset) params.set("offset", String(options.offset))

  const res = await fetch(
    `${API_BASE}/api/v1/blog/posts?${params.toString()}`,
    { next: { revalidate: 300 } }, // ISR 5 minute
  )
  if (!res.ok) return []
  return res.json()
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const res = await fetch(
    `${API_BASE}/api/v1/blog/posts/${encodeURIComponent(slug)}`,
    { next: { revalidate: 300 } },
  )
  if (res.status === 404) return null
  if (!res.ok) return null
  return res.json()
}
