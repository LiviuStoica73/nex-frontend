import Link from "next/link"
import Image from "next/image"
import { BlogPost } from "@/types/blog"
import { cn, formatDate } from "@/lib/utils"

export function BlogCard({
  data,
  priority = false,
  horizontale = false,
}: {
  data: BlogPost
  priority?: boolean
  horizontale?: boolean
}) {
  const href = `/blog/${data.slug ?? data.id}`

  return (
    <article
      className={cn(
        "group relative",
        horizontale
          ? "grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6"
          : "flex flex-col space-y-2",
      )}
    >
      {data.image_url && (
        <div className="w-full overflow-hidden rounded-xl border">
          <Image
            alt={data.image_alt || data.title}
            className={cn(
              "size-full object-cover object-center",
              horizontale ? "lg:h-72" : null,
            )}
            width={800}
            height={400}
            priority={priority}
            src={data.image_url}
            sizes="(max-width: 768px) 750px, 600px"
          />
        </div>
      )}
      <div
        className={cn(
          "flex flex-1 flex-col",
          horizontale ? "justify-center" : "justify-between",
        )}
      >
        <div className="w-full">
          <h2 className="my-1.5 line-clamp-2 font-heading text-2xl">
            {data.title}
          </h2>
          {data.excerpt && (
            <p className="line-clamp-2 text-muted-foreground">{data.excerpt}</p>
          )}
        </div>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          {data.author_name && <span>{data.author_name}</span>}
          {data.published_at && (
            <span>{formatDate(data.published_at)}</span>
          )}
          {data.reading_time_minutes && (
            <span>{data.reading_time_minutes} min citire</span>
          )}
        </div>
      </div>
      <Link href={href} className="absolute inset-0">
        <span className="sr-only">Citește articolul</span>
      </Link>
    </article>
  )
}
