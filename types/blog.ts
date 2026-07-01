export interface BlogPost {
  id: string
  title: string
  slug: string | null
  excerpt: string | null
  content?: string | null
  image_url: string | null
  image_alt?: string | null
  author_name: string | null
  language: string | null
  categories: string[] | null
  tags: string[] | null
  published_at: string | null
  reading_time_minutes: number | null
  seo_title?: string | null
  seo_description?: string | null
}
