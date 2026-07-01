import { constructMetadata } from "@/lib/utils"
import { getBlogPosts } from "@/lib/blog-api"
import { BlogPosts } from "@/components/content/blog-posts"

export const metadata = constructMetadata({
  title: "Blog – Nex-Nex",
  description: "Articole, ghiduri și noutăți despre AI content creation de la echipa Nex-Nex.",
})

export default async function BlogPage() {
  const posts = await getBlogPosts({ limit: 30 })
  return <BlogPosts posts={posts} />
}
