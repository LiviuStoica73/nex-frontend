import { BlogPost } from "@/types/blog"
import { BlogCard } from "./blog-card"

export function BlogPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg text-muted-foreground">
          Nu există articole publicate momentan. Revino curând!
        </p>
      </main>
    )
  }

  return (
    <main className="space-y-8">
      <BlogCard data={posts[0]} horizontale priority />
      <div className="grid gap-8 md:grid-cols-2 md:gap-x-6 md:gap-y-10 xl:grid-cols-3">
        {posts.slice(1).map((post, idx) => (
          <BlogCard data={post} key={post.id} priority={idx <= 2} />
        ))}
      </div>
    </main>
  )
}
