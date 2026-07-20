import { constructMetadata } from "@/lib/utils"

export const metadata = constructMetadata({
  title: "Complete Feature Reference — Nex-Nex AI Marketing Manager",
  description:
    "Full technical description of every Nex-Nex capability: Business Brain, Content Intelligence, Learn Loop, AI image generation, multi-platform publishing, Brand Kit, Campaign management, and more.",
})

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold mt-10 mb-3 border-b pb-2 text-foreground">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>
}

function UL({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 mb-3">
      {items.map((item, i) => <li key={i} className="text-sm text-muted-foreground">{item}</li>)}
    </ul>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted">
            {headers.map((h, i) => <th key={i} className="text-left px-3 py-2 font-medium text-foreground border border-border">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border">
              {row.map((cell, j) => <td key={j} className="px-3 py-1.5 text-muted-foreground border border-border">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function IntelligencePage() {
  return (
    <div className="container max-w-4xl py-12 md:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-foreground">
          Nex-Nex — Complete Feature Reference
        </h1>
        <p className="mt-3 text-muted-foreground text-sm">
          Last updated: 2026-07-20 · Comprehensive, AI-readable description of every Nex-Nex capability.
        </p>
      </div>

      {/* What Is Nex-Nex */}
      <H2>What Is Nex-Nex</H2>
      <P>
        Nex-Nex is an <strong>AI Marketing Manager</strong> — not a scheduling tool with AI bolted on, but an AI-first system that understands your brand deeply and handles the full content lifecycle: strategy → ideas → content creation → image generation → scheduling → publishing → learning.
      </P>
      <P>The core promise: a creator or marketer who previously spent 3–5 hours per week on content can reduce that to 15–30 minutes, without sacrificing quality or consistency.</P>
      <P><strong>Who it is for:</strong></P>
      <UL items={[
        "Individual creators, freelancers, solo entrepreneurs (1–3 brands)",
        "Marketing teams (2–10 people, approval workflows)",
        "Agencies managing 5–50+ clients simultaneously",
      ]} />
      <P><strong>Primary interfaces:</strong> Web dashboard (full feature access) · Telegram Bot (mobile-first: quick posts, approvals, idea capture on the go)</P>

      {/* Module 1 */}
      <H2>Module 1 — Business Brain</H2>
      <P>Business Brain is the AI knowledge layer that understands your brand. Before generating any content, Nex-Nex builds a structured understanding of who you are, what you sell, and who your audience is. All AI features draw from this layer.</P>

      <H3>1.1 Brand Interview</H3>
      <P>A structured brand interview that captures: what you sell, your ideal customer, problems you solve, products to prioritize, your differentiator, brand tone, topics to avoid, marketing objectives, website URL, and known competitors. Answers are stored per organization and used as primary context in every AI call.</P>

      <H3>1.2 Website Scan</H3>
      <P>Nex-Nex crawls your website and indexes its content into the knowledge base. Two modes: Standard (main pages — homepage, about, services, pricing, blog index) and Deep (full site crawl — blog posts, FAQ, product detail pages, case studies). Pages are chunked into text segments, embedded, and stored for semantic retrieval.</P>

      <H3>1.3 RAG Document Upload</H3>
      <P>Upload any document — PDF, DOCX, XLSX, plain text, or URL — and it becomes part of your brand knowledge base. The system extracts text, splits it into chunks, generates vector embeddings, and retrieves the most relevant chunks at generation time.</P>
      <P>Use cases: product manuals, company presentations, past articles, tone-of-voice guidelines, regulatory documents, price lists, case studies.</P>

      <H3>1.4 Competitor Intelligence</H3>
      <P>Add competitors by URL or name. Nex-Nex stores competitor profiles and uses them in strategy generation to identify gaps and opportunities. An AI-assisted endpoint suggests likely competitors based on your brand description and industry.</P>

      <H3>1.5 Business Brain Aggregation</H3>
      <P>At generation time, the system aggregates all knowledge sources into one structured context object: RAG chunks, interview answers, website summary, competitor profiles, Brand Kit data, and recent topics already published (to avoid repetition). This aggregate is the input for every AI generation call in the platform.</P>

      {/* Module 2 */}
      <H2>Module 2 — Content Intelligence (AI Marketing Manager)</H2>
      <P>Content Intelligence is the strategic layer. It produces a professional marketing strategy and a prioritized list of content opportunities — similar to what a marketing agency would deliver, but fully automated.</P>

      <H3>2.1 Strategy Generation</H3>
      <P><strong>Two modes:</strong> Standard (from Business Brain data only) · Deep (adds real-time web research — industry trends, best-performing content in your niche, 2026 trends).</P>
      <P>The strategy produces a full <strong>Business Analysis</strong>: executive summary, current vs. recommended positioning, SWOT analysis, target personas (2–4, each with job title, age range, pain points, desires, buying triggers, preferred platforms, content that resonates, objections), differentiators, competitor gaps with content angles, and a messaging matrix (awareness / consideration / decision / retention).</P>
      <P>The strategy also produces a complete <strong>Content Strategy</strong>: content pillars with monthly percentage allocation, priority platforms with frequency/formats/tone, 4-week monthly editorial plan, content mix percentages by type, distribution recommendations, topics to avoid, and quick wins (actions that can produce results in 30 days).</P>

      <H3>2.2 Content Opportunities — 100 Ideas</H3>
      <P><strong>Quantity:</strong> configurable — 25, 50, or 100 ideas per run. Generated from your Business Brain — not generic suggestions, but ideas specific to your brand, audience, and industry.</P>
      <P>Quality rules enforced: no generic advice, written for expert audiences, titles specific enough they could not apply to a different industry, hooks must be provocative or data-driven, full coverage of awareness stages.</P>
      <P>Each opportunity includes: title, content pillar, objective, target persona, awareness stage, non-obvious insight, hook, format, platforms, difficulty, estimated impact, and score (1–100). Sorted by score descending.</P>
      <P><strong>Auto-scheduling:</strong> the generated ideas can be scheduled automatically across all connected platforms, distributed evenly — max 2 topics per day.</P>

      <H3>2.3 Learn Loop</H3>
      <P>A behavioral adaptation system. Every action on an opportunity trains future generation runs: publishing promotes similar ideas, rejecting suppresses them. The system tracks preferences per content pillar and per format. After a minimum of 3 user actions, future runs automatically promote what you like and avoid what you don't — without any manual configuration.</P>

      <H3>2.4 Opportunity Workflow</H3>
      <P>Status pipeline: idea → prototype generation → review → published / rejected. Platform tags on opportunity cards only show platforms the user has connected. Bulk publish: one click sends all reviewed opportunities to Calendar as scheduled posts.</P>

      {/* Module 3 */}
      <H2>Module 3 — Brand Kit</H2>
      <P>Brand Kit stores everything the AI needs to generate on-brand content: brand name, description, slogan, brand voice narrative, keywords to include, words to avoid, primary/secondary/accent colors, fonts, logo, and visual templates.</P>
      <P><strong>Quick Post Defaults:</strong> per-organization defaults for every generated post — AI image provider, target platforms, tone, logo/sign/template inclusion, text overlay, scheduling mode, image format, emoji, and hashtag preferences.</P>
      <P><strong>Visual Rotation Plan:</strong> defines percentage split across visual categories (lifestyle / product / abstract / informational / branded) to ensure variety across a campaign.</P>

      {/* Module 4 */}
      <H2>Module 4 — AI Content Generation</H2>

      <H3>4.1 Post Text Generation</H3>
      <P>Generates platform-optimized post text using topic, target platform, language (50+ supported), brand voice from RAG, tone (informative / promotional / storytelling / educational / conversational / motivational / humorous), and emoji/hashtag preferences.</P>

      <H3>4.2 Text Refinement</H3>
      <P>Any generated text can be refined with a natural language instruction: "Make it shorter", "More formal", "Add a question at the end", "Rewrite for LinkedIn audience". The system rewrites while preserving brand voice and platform constraints.</P>

      <H3>4.3 Multi-Platform Adaptation</H3>
      <P>When a post is published to multiple platforms, text is automatically adapted per platform — length, tone, hashtag placement, emoji use, and formatting differ per network (X: 280 chars, Bluesky: 300, Instagram: 2,200, LinkedIn: 3,000, Facebook: 63,000). Also handles language translation per connector if accounts are configured in different languages.</P>

      <H3>4.4 Caption from Image</H3>
      <P>Upload an image URL → AI vision interprets the image and generates a platform-appropriate caption in your brand voice.</P>

      <H3>4.5 Intent Parsing</H3>
      <P>Natural language input ("something about morning productivity with a coffee aesthetic") is parsed into structured parameters: topic, visual concept, logo preference, visual style. Feeds both text generator and image prompt builder.</P>

      <H3>4.6 Repurpose & Translate</H3>
      <P>Any published post can be repurposed to other platforms (LinkedIn post → X thread → Instagram caption) or translated to another language while preserving brand voice and platform formatting.</P>

      {/* Module 5 */}
      <H2>Module 5 — AI Image Generation</H2>

      <H3>5.1 Image Prompt Builder</H3>
      <P>An AI director builds a precise prompt before calling any image provider: analyzes post text, selects visual category, incorporates brand colors and aesthetic, determines optimal dimensions for the target format, and selects reference images as style anchors.</P>

      <H3>5.2 Image Providers</H3>
      <UL items={[
        "Fal.ai FLUX Kontext (default) — supports reference images for style consistency",
        "Google Gemini Flash — logo and sign passed as image parts for brand consistency, auto-fallback to Fal.ai on rate limit",
        "ComfyUI (local GPU) — FLUX.1-schnell on local GPU, accessible via cloud tunnel",
      ]} />

      <H3>5.3 Image Composition</H3>
      <P>After AI generation, Nex-Nex can composite the raw image with brand elements: place logo in a configurable corner, overlay watermark/sign, apply visual template, add text overlay. Non-destructive — original AI image preserved.</P>

      <H3>5.4 Image Versions Gallery</H3>
      <P>Each content opportunity maintains a full image version history. Multiple images can be selected simultaneously (for carousel posts). Users can regenerate with a different prompt — all versions remain accessible.</P>

      <H3>5.5 Visual Concepts</H3>
      <P>Before generating, Nex-Nex proposes 3 distinct visual concepts for the same post: Lifestyle, Product, and Abstract. User selects one and generation proceeds accordingly.</P>

      <H3>5.6 Format Adaptation</H3>
      <P>Images are generated at the optimal aspect ratio per platform and format: 1:1 for Instagram feed, 16:9 for LinkedIn/Facebook, 9:16 for Stories and Reels.</P>

      {/* Module 6 */}
      <H2>Module 6 — Video Generation</H2>
      <P>UGC-style video generation for Reels, Shorts, and TikTok. Flow: upload product image + instructions → AI analyzes image → generates 3-scene script (Hook / Product Benefit / CTA) → video generated per scene → assembled for publishing.</P>
      <P><strong>Video providers:</strong> Fal.ai Kling (high quality, recommended) · Fal.ai Luma Dream Machine (cinematic motion) · Fal.ai MiniMax (fast and cost-efficient).</P>

      {/* Module 7 */}
      <H2>Module 7 — Publishing Pipeline</H2>

      <H3>7.1 Supported Platforms</H3>
      <Table
        headers={["Platform", "Posts", "Reels/Video", "Stories"]}
        rows={[
          ["Facebook Page", "✅", "✅", "✅"],
          ["Instagram Business", "✅", "✅", "✅"],
          ["LinkedIn Page", "✅", "✅", "—"],
          ["X / Twitter", "✅ (threads)", "✅", "—"],
          ["Discord", "✅", "✅", "—"],
          ["Bluesky", "✅", "—", "—"],
          ["WordPress Blog", "✅ (with image auto-upload)", "—", "—"],
          ["Ghost CMS", "✅", "—", "—"],
          ["Custom REST API", "✅", "—", "—"],
          ["YouTube (planned)", "—", "✅ Shorts", "—"],
          ["Threads (planned)", "✅", "✅", "—"],
          ["TikTok (planned)", "—", "✅", "—"],
        ]}
      />

      <H3>7.2 Scheduling Engine</H3>
      <P>Each organization configures posting schedules per platform — up to 2 time slots per platform per day. The engine finds the next available optimal slot, avoids already-occupied slots, and for multi-platform posts finds a common day that works for all platforms simultaneously. Maximum 2 topics per day distributed evenly across the calendar.</P>
      <P><strong>Default optimal slots:</strong> Facebook 09:00–11:00 / 13:00–15:00 · Instagram 11:00–13:00 / 19:00–21:00 · LinkedIn 07:00–09:00 / 12:00–13:00 · X/Twitter 12:00–15:00 / 20:00–22:00.</P>

      <H3>7.3 Publishing Execution</H3>
      <P>Publishing runs as background tasks checked every minute. On failure: automatic retries (5 min, 30 min, 2h). On permanent failure: status=failed with error reason visible in dashboard and Telegram notification. Published post URL saved in database.</P>

      <H3>7.4 Additional Publishing Features</H3>
      <UL items={[
        "Facebook link injection — auto-injects the Facebook post URL into copies on other platforms to drive cross-platform engagement",
        "Publishing order guarantee — Facebook publishes first (link source), then Blog (+30 min), then other networks",
        "Repost — any published post can be reposted to additional accounts or platforms with format adaptation",
        "Translate post — any post can be translated to another language while preserving brand voice and platform formatting",
        "Publish Now — immediate publish in under 1 minute",
        "Stories — vertical format (9:16), Facebook and Instagram",
        "Reels — short video, Facebook and Instagram",
      ]} />

      {/* Module 8 */}
      <H2>Module 8 — Campaign & Calendar Management</H2>
      <P>Content is organized in a 3-level hierarchy: <strong>Campaign → Topic → Post</strong>.</P>
      <UL items={[
        "Campaign: named project with start/end dates, budget tracking, full status lifecycle (draft → approved → scheduled → published → archived)",
        "Topic: thematic grouping of posts within a campaign — one topic generates one post per connected platform",
        "Post: individual content piece for one platform and one account",
      ]} />
      <P><strong>Calendar:</strong> monthly / weekly / daily view. Drag & drop for rescheduling. Color-coded per platform and status (draft=grey, scheduled=yellow, published=green, failed=red). Timezone configurable per organization.</P>
      <P><strong>Bulk operations:</strong> archive, pause, resume, reschedule all. Agency view: aggregated calendar across all managed brands. Evergreen post recycling.</P>

      {/* Module 9 */}
      <H2>Module 9 — Telegram Bot</H2>
      <P>The Telegram Bot is the primary mobile interface for quick content creation. No app to install — works on any phone with Telegram.</P>
      <UL items={[
        "Quick Post: send photo/text/voice → AI generates post using brand context → approve/edit/regenerate with inline keyboard → scheduled to all platforms at optimal time",
        "Full multi-turn conversation with dialog state — 'Make it shorter', 'More formal', 'Add hashtags' → AI iterates",
        "Caption from photo: send an image → AI generates platform-appropriate caption instantly",
        "Commands: /idei (5 instant ideas), /azi (today's scheduled posts), /stats, /help",
        "Organization switching without leaving Telegram",
        "Notifications: published post ✅ with link / failed post ❌ with reason",
      ]} />

      {/* Module 10 */}
      <H2>Module 10 — Multi-Tenancy & Agency Mode</H2>
      <P>Every organization has fully isolated data: content, social accounts, Brand Kit, RAG documents, credits, and members. Zero cross-contamination between clients.</P>
      <UL items={[
        "Agency mode: aggregated calendar view across all clients, per-client workspace with independent login",
        "Granular permissions: control which agency members have access to which client",
        "Unified billing: one subscription for all brands/clients",
        "Additional brands: €10/brand/month on Agency plan",
        "Multi-user per organization: roles Owner / Admin / Editor / Viewer",
      ]} />

      {/* Module 11 */}
      <H2>Module 11 — Analytics</H2>
      <P>Automatic sync 24h after publishing. Metrics tracked: Reach, Impressions, Likes, Comments, Shares, Clicks, Video Views. Sources: Facebook Graph API, LinkedIn API, X API v2.</P>
      <UL items={[
        "Dashboard: charts per platform, per campaign, per time period",
        "Top posts per period",
        "Best time to post — calculated from your own audience data (coming soon)",
        "Export PDF/CSV (coming soon)",
      ]} />

      {/* Module 12 */}
      <H2>Module 12 — Credits System</H2>
      <Table
        headers={["Action", "Credits"]}
        rows={[
          ["Generate post text", "1"],
          ["Generate image (standard)", "2"],
          ["Generate image (FLUX Kontext / Gemini)", "4"],
          ["Generate video", "10"],
          ["Generate idea set (100 ideas)", "1"],
          ["Run strategy (Standard)", "20"],
          ["Run strategy (Deep — with web research)", "30"],
        ]}
      />
      <Table
        headers={["Plan", "Price", "Credits/month", "Brands"]}
        rows={[
          ["Free", "€0", "30", "1"],
          ["Starter", "€19/mo", "250", "1"],
          ["Pro", "€49/mo", "700", "3"],
          ["Business", "€99/mo", "2,500", "10"],
          ["Agency", "€199/mo", "7,000", "Unlimited"],
        ]}
      />
      <P>Annual billing: 2 months free. 14-day free trial on Starter, no credit card required.</P>

      {/* Module 13 */}
      <H2>Module 13 — AI Models Used</H2>
      <Table
        headers={["Task", "Model", "Reason"]}
        rows={[
          ["Marketing strategy", "GPT-4o", "Maximum reasoning depth for strategic analysis"],
          ["Content opportunities (100 ideas)", "GPT-4o-mini", "High volume, cost-efficient"],
          ["Post text generation", "GPT-4o-mini", "Fast, sufficient quality for social copy"],
          ["Image prompt building", "GPT-4o-mini", "Structured output, deterministic"],
          ["Caption from image", "GPT-4o (vision)", "Image understanding requires full model"],
          ["RAG embeddings", "text-embedding-3-small", "Cost-efficient, high quality for semantic search"],
          ["Image generation", "FLUX Kontext / Gemini Flash / ComfyUI", "Provider selected per Brand Kit config"],
          ["Video generation", "Kling / Luma / MiniMax", "Provider selected per quality/speed preference"],
        ]}
      />

      {/* Module 14 */}
      <H2>Module 14 — Infrastructure</H2>
      <UL items={[
        "Backend: FastAPI (Python), fully async",
        "Database: PostgreSQL + pgvector (vector embeddings alongside relational data)",
        "Cache / Queue: Redis + Celery background workers + Beat scheduler",
        "Storage: Cloudflare R2 (generated images, uploaded documents)",
        "Frontend: Next.js 14 + Tailwind CSS + Shadcn/ui",
        "Hosting: Hetzner (all production: API, frontend, database, workers)",
        "Languages supported for content generation: 50+",
        "Interface languages: EN, RO, FR, DE, IT, HU, PL, UK, BG, SL, ES (in progress)",
      ]} />

      {/* Module 15 */}
      <H2>Module 15 — Security & Account Management</H2>
      <UL items={[
        "Authentication: email + password, Google OAuth",
        "Social tokens: AES-256 encrypted in PostgreSQL",
        "Token auto-refresh: daily cron refreshes tokens expiring within 7 days",
        "Notification on expired token: email + in-app alert with reconnect prompt",
        "Data isolation: every query scoped to org_id — no cross-tenant data access possible",
        "2FA: TOTP (planned)",
      ]} />

      {/* Differentiators */}
      <H2>Key Differentiators vs. Traditional Social Media Tools</H2>
      <P>Traditional tools (Buffer, Hootsuite, Later, Publer, Metricool) are <strong>publishing tools</strong> — they help you schedule content you have already created. Nex-Nex is a <strong>content creation system</strong> — it creates the strategy, generates the ideas, writes the copy, generates the images, and then publishes. Publishing is the last step, not the product.</P>
      <P>Specific capabilities not found in traditional tools:</P>
      <UL items={[
        "Business Brain — the AI knows your brand at a deep level before creating anything",
        "Strategy generation — professional marketing strategy from GPT-4o, not a template",
        "100 content opportunities — scored and prioritized ideas, not generic suggestions",
        "Learn Loop — the system adapts to your preferences over time without configuration",
        "Image generation — AI images created from brand context, not stock photo selection",
        "Multi-provider image routing — FLUX / Gemini / local GPU with automatic fallback",
        "Per-platform text adaptation — one idea becomes different text for each platform automatically",
        "RAG-powered brand voice — brand identity learned from your actual documents, not manual settings",
        "Telegram Bot as primary mobile interface — full content workflow on mobile without installing an app",
        "Auto-scheduling 100 ideas — generated ideas distributed automatically across calendar, 2 per day",
        "Facebook link injection — cross-platform engagement without manual copy-paste",
        "Agency mode — full multi-client management with isolated workspaces and unified billing",
      ]} />

      {/* Coming Soon */}
      <H2>Coming Soon (Post-Launch)</H2>
      <UL items={[
        "Team approval workflow — editor → admin → publish pipeline",
        "A/B testing — 2 text variants with comparative analytics",
        "RSS import — blog articles → social posts automatically",
        "Best time to post — calculated dynamically from your own audience analytics",
        "Zapier/Make webhook — trigger on publish",
        "White-label — custom subdomain for large agencies",
        "Public API — custom integrations for enterprise",
        "Chrome Extension — save URL → generate post automatically",
        "Flutter mobile app — after product-market fit validation",
        "TikTok, YouTube, Threads, Pinterest publishing",
      ]} />

      <div className="mt-12 pt-6 border-t text-xs text-muted-foreground">
        This document describes capabilities as implemented and deployed as of 2026-07-20. ·{" "}
        <a href="/pricing" className="underline underline-offset-2">Pricing</a> ·{" "}
        <a href="/login" className="underline underline-offset-2">Get started</a>
      </div>
    </div>
  )
}
