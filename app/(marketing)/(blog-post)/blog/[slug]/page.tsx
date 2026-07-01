import { notFound } from "next/navigation"
import Image from "next/image"
import { Metadata } from "next"
import { getBlogPostBySlug, getBlogPosts } from "@/lib/blog-api"
import { constructMetadata, formatDate } from "@/lib/utils"
import MaxWidthWrapper from "@/components/shared/max-width-wrapper"

export async function generateStaticParams() {
  try {
    const posts = await getBlogPosts({ limit: 100 })
    return posts
      .filter((p) => p.slug)
      .map((p) => ({ slug: p.slug as string }))
  } catch {
    // API indisponibil la build time — paginile se generează on-demand via ISR
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata | undefined> {
  const post = await getBlogPostBySlug(params.slug)
  if (!post) return undefined
  return constructMetadata({
    title: post.seo_title || `${post.title} – Nex-Nex Blog`,
    description: post.seo_description || post.excerpt || "",
    image: post.image_url || undefined,
  })
}

export default async function PostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getBlogPostBySlug(params.slug)
  if (!post) notFound()

  return (
    <>
      <MaxWidthWrapper className="pt-6 md:pt-10">
        <div className="flex flex-col space-y-4">
          {post.categories && post.categories.length > 0 && (
            <div className="flex items-center gap-2">
              {post.categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-lg border px-3 py-1 text-xs font-medium capitalize text-muted-foreground"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-heading text-3xl text-foreground sm:text-4xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-base text-muted-foreground md:text-lg">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {post.author_name && <span>{post.author_name}</span>}
            {post.published_at && (
              <time dateTime={post.published_at}>
                {formatDate(post.published_at)}
              </time>
            )}
            {post.reading_time_minutes && (
              <span>{post.reading_time_minutes} min citire</span>
            )}
          </div>
        </div>
      </MaxWidthWrapper>

      <div className="relative">
        <div className="absolute top-52 w-full border-t" />
        <MaxWidthWrapper className="pt-8 max-md:px-0">
          <div className="mb-10 flex flex-col space-y-8 border-y bg-background md:rounded-xl md:border">
            {post.image_url && (
              <Image
                alt={post.image_alt || post.title}
                className="aspect-[1200/630] border-b object-cover md:rounded-t-xl"
                width={1200}
                height={630}
                priority
                src={post.image_url}
                sizes="(max-width: 768px) 770px, 1000px"
              />
            )}
            <div
              className="prose prose-lg max-w-none px-[.8rem] pb-10 dark:prose-invert md:px-8"
              dangerouslySetInnerHTML={{ __html: post.content || "" }}
            />
          </div>
        </MaxWidthWrapper>
      </div>
    </>
  )
}
