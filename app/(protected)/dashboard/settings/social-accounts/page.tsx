"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  Facebook, Instagram, Trash2, Plus, Globe, Check, X as XIcon,
  MessageSquare, Linkedin, Youtube, Music2, AtSign, ExternalLink,
  Rss, Loader2, CheckCircle2, XCircle, ScanSearch, Info, ChevronDown, ChevronUp,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { DashboardHeader } from "@/components/dashboard/header";
import { useOrg } from "@/contexts/org-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

const LANGUAGES = [
  { value: "ro", label: "RO" },
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
  { value: "de", label: "DE" },
  { value: "it", label: "IT" },
  { value: "es", label: "ES" },
];

const BLOG_PLATFORM_LABELS: Record<string, string> = {
  wordpress: "WordPress",
  ghost: "Ghost CMS",
  custom_rest: "Custom REST API",
};

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_id: string;
  post_language: string | null;
  is_active: boolean;
  post_as_stories: boolean;
  post_as_reels: boolean;
  stories_video_duration: string;
  created_at: string;
  has_oauth1: boolean;
}

interface BlogConnector {
  id: string;
  name: string;
  platform_type: string;
  site_url: string | null;
  api_url: string | null;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  extra_config: { post_language?: string } | null;
}

interface FbPage {
  page_id: string;
  page_name: string;
  page_token: string;
  user_token: string;
  ig_user_id: string | null;
  connected_to_org?: string | null;
}

const NETWORKS = [
  { key: "facebook",  label: "Facebook",   icon: <Facebook className="h-4 w-4 text-[#1877F2]" />, available: true,  method: "oauth",         descriptionKey: "networks.facebook.description" },
  { key: "instagram", label: "Instagram",  icon: <Instagram className="h-4 w-4 text-[#E1306C]" />, available: true, method: "via-facebook",  descriptionKey: "networks.instagram.description" },
  { key: "discord",   label: "Discord",    icon: <MessageSquare className="h-4 w-4 text-[#5865F2]" />, available: true, method: "webhook", descriptionKey: "networks.discord.description" },
  { key: "x",        label: "X / Twitter", icon: <XIcon className="h-4 w-4" />, available: true, method: "oauth", descriptionKey: "networks.x.description" },
  { key: "linkedin",  label: "LinkedIn",   icon: <Linkedin className="h-4 w-4 text-[#0A66C2]" />, available: true, method: "oauth", descriptionKey: "networks.linkedin.description" },
  { key: "bluesky",   label: "Bluesky",   icon: <AtSign className="h-4 w-4 text-[#0085FF]" />, available: true, method: "app-password", descriptionKey: "networks.bluesky.description" },
  { key: "blog",      label: "Blog",       icon: <Rss className="h-4 w-4 text-[#F97316]" />, available: true, method: "api-key", descriptionKey: "networks.blog.description" },
  { key: "youtube",   label: "YouTube",    icon: <Youtube className="h-4 w-4 text-[#FF0000]" />, available: false, descriptionKey: "networks.youtube.description" },
  { key: "tiktok",    label: "TikTok",    icon: <Music2 className="h-4 w-4" />, available: false, descriptionKey: "networks.tiktok.description" },
];

function PlatformIcon({ platform }: { platform: string }) {
  const net = NETWORKS.find((n) => n.key === platform);
  return net?.icon ?? <Globe className="h-4 w-4 text-muted-foreground" />;
}

export default function SocialAccountsPage() {
  const t = useTranslations("social_accounts");
  const { data: session } = useSession();
  const { activeOrgId } = useOrg();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fbPages, setFbPages] = useState<FbPage[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [pageLanguages, setPageLanguages] = useState<Record<string, string>>({});
  const [savingLang, setSavingLang] = useState<string | null>(null);

  // Discord
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [discordSaving, setDiscordSaving] = useState(false);
  const [discordError, setDiscordError] = useState("");

  // Bluesky
  const [bskyHandle, setBskyHandle] = useState("");
  const [bskyPassword, setBskyPassword] = useState("");
  const [bskySaving, setBskySaving] = useState(false);
  const [bskyError, setBskyError] = useState("");

  // Blog connectors
  const [blogConnectors, setBlogConnectors] = useState<BlogConnector[]>([]);
  const [blogForm, setBlogForm] = useState({ name: "", platform_type: "wordpress", site_url: "", wp_username: "", api_key: "", post_language: "ro" });
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogError, setBlogError] = useState("");
  const [testingBlog, setTestingBlog] = useState<string | null>(null);
  const [testBlogResult, setTestBlogResult] = useState<Record<string, boolean | null>>({});
  const [deletingBlog, setDeletingBlog] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectSignals, setDetectSignals] = useState<{ confidence: string; signals: string[] } | null>(null);

  // Acordeon stări deschis/închis
  const [openDiscord, setOpenDiscord] = useState(false);
  const [openBluesky, setOpenBluesky] = useState(false);
  const [openBlog, setOpenBlog] = useState(false);
  const [openXOAuth1, setOpenXOAuth1] = useState(false);
  const [showXAdvanced, setShowXAdvanced] = useState(false);
  const [xOauth1AccountId, setXOauth1AccountId] = useState<string | null>(null);
  const [xOauth1Form, setXOauth1Form] = useState({ consumer_key: "", consumer_secret: "", access_token: "", access_token_secret: "" });
  const [xOauth1Saving, setXOauth1Saving] = useState(false);
  const [xOauth1Error, setXOauth1Error] = useState("");

  const token = (session?.user as any)?.accessToken as string | undefined;
  const orgId = activeOrgId;

  const fetchAccounts = async (currentOrgId: string, currentToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${currentOrgId}/social-accounts`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) setAccounts(await res.json());
      else setAccounts([]);
    } catch { setAccounts([]); }
    setLoading(false);
  };

  const fetchBlogConnectors = async (currentOrgId: string, currentToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${currentOrgId}/blog-connectors`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) setBlogConnectors(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (!orgId || !token) return;
    setAccounts([]);
    setBlogConnectors([]);
    fetchAccounts(orgId, token);
    fetchBlogConnectors(orgId, token);
  }, [orgId, token]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || !token) return;
    fetch(`${API_URL}/api/v1/auth/facebook/session/${sessionId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.pages) return;
        setFbPages(data.pages);
        const defaults: Record<string, string> = {};
        data.pages.forEach((p: FbPage) => { defaults[p.page_id] = "ro"; });
        setPageLanguages(defaults);
      })
      .catch(() => {});
  }, [searchParams.get("session_id"), token]);

  useEffect(() => {
    if (searchParams.get("x_connected") === "1" && orgId && token) {
      fetchAccounts(orgId, token);
      router.replace("/dashboard/settings/social-accounts");
    }
  }, [searchParams.get("x_connected")]);

  useEffect(() => {
    if (searchParams.get("li_connected") === "1" && orgId && token) {
      fetchAccounts(orgId, token);
      router.replace("/dashboard/settings/social-accounts");
    }
  }, [searchParams.get("li_connected")]);

  const handleConnectFacebook = () => {
    if (!orgId || !token) return;
    window.location.href = `${API_URL}/api/v1/auth/facebook?org_id=${orgId}&token=${token}`;
  };

  const handleConnectX = () => {
    if (!orgId || !token) return;
    window.location.href = `${API_URL}/api/v1/auth/x?org_id=${orgId}&jwt=${token}`;
  };

  const handleSaveXOAuth1 = async () => {
    if (!orgId || !token) return;
    const { consumer_key, consumer_secret, access_token, access_token_secret } = xOauth1Form;
    if (!consumer_key || !consumer_secret || !access_token || !access_token_secret) {
      setXOauth1Error(t("errors.oauth1_required_fields")); return;
    }
    setXOauth1Saving(true); setXOauth1Error("");
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/x/oauth1`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ org_id: orgId, consumer_key, consumer_secret, access_token, access_token_secret }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || t("errors.generic")); }
      setOpenXOAuth1(false);
      setXOauth1Form({ consumer_key: "", consumer_secret: "", access_token: "", access_token_secret: "" });
      fetchAccounts(orgId, token);
    } catch (e: any) { setXOauth1Error(e.message); }
    setXOauth1Saving(false);
  };

  const handleConnectLinkedIn = () => {
    if (!orgId || !token) return;
    window.location.href = `${API_URL}/api/v1/auth/linkedin?org_id=${orgId}&jwt=${token}`;
  };

  const handleConnectDiscord = async () => {
    if (!orgId || !token || !discordWebhook.trim()) return;
    setDiscordSaving(true); setDiscordError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/discord/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ webhook_url: discordWebhook.trim() }),
      });
      if (res.ok) { setDiscordWebhook(""); await fetchAccounts(orgId, token); }
      else { const err = await res.json(); setDiscordError(err.detail || t("errors.connect_failed")); }
    } catch { setDiscordError(t("errors.network")); }
    setDiscordSaving(false);
  };

  const handleConnectBluesky = async () => {
    if (!orgId || !token || !bskyHandle.trim() || !bskyPassword.trim()) return;
    setBskySaving(true); setBskyError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/bluesky/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ handle: bskyHandle.trim(), app_password: bskyPassword.trim() }),
      });
      if (res.ok) { setBskyHandle(""); setBskyPassword(""); await fetchAccounts(orgId, token); }
      else { const err = await res.json(); setBskyError(err.detail || t("errors.connect_failed")); }
    } catch { setBskyError(t("errors.network")); }
    setBskySaving(false);
  };

  const handleAddBlogConnector = async () => {
    const wpMissing = blogForm.platform_type === "wordpress" && (!blogForm.site_url || !blogForm.wp_username || !blogForm.api_key);
    const otherMissing = blogForm.platform_type !== "wordpress" && (!blogForm.site_url || !blogForm.api_key);
    if (!orgId || !token || !blogForm.name || wpMissing || otherMissing) return;
    setBlogSaving(true); setBlogError("");
    const extraConfig: Record<string, string> = { post_language: blogForm.post_language };
    if (blogForm.platform_type === "wordpress") extraConfig.wp_username = blogForm.wp_username;
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/blog-connectors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: blogForm.name,
          platform_type: blogForm.platform_type,
          site_url: blogForm.platform_type !== "custom_rest" ? blogForm.site_url : undefined,
          api_url: blogForm.platform_type === "custom_rest" ? blogForm.site_url : undefined,
          api_key: blogForm.api_key,
          extra_config: extraConfig,
        }),
      });
      if (res.ok) {
        setBlogForm({ name: "", platform_type: "wordpress", site_url: "", wp_username: "", api_key: "", post_language: "ro" });
        await fetchBlogConnectors(orgId, token);
      } else {
        const err = await res.json();
        setBlogError(err.detail || t("errors.save_failed"));
      }
    } catch { setBlogError(t("errors.network")); }
    setBlogSaving(false);
  };

  const handleDetect = async () => {
    if (!token || !blogForm.site_url.trim()) return;
    setDetecting(true);
    setDetectSignals(null);
    setBlogError("");
    try {
      const res = await fetch(
        `${API_URL}/api/v1/blog/detect?url=${encodeURIComponent(blogForm.site_url.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setBlogForm((f) => ({ ...f, platform_type: data.platform_type, site_url: data.site_url }));
        setDetectSignals({ confidence: data.confidence, signals: data.signals });
      } else {
        setBlogError(t("errors.detect_failed"));
      }
    } catch { setBlogError(t("errors.detect_network")); }
    setDetecting(false);
  };

  const handleTestBlog = async (connectorId: string) => {
    if (!orgId || !token) return;
    setTestingBlog(connectorId);
    setTestBlogResult((prev) => ({ ...prev, [connectorId]: null }));
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/blog-connectors/${connectorId}/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTestBlogResult((prev) => ({ ...prev, [connectorId]: data.success === true }));
      await fetchBlogConnectors(orgId, token);
      setTimeout(() => setTestBlogResult((prev) => { const next = { ...prev }; delete next[connectorId]; return next; }), 4000);
    } finally { setTestingBlog(null); }
  };

  const handleDeleteBlog = async (connectorId: string) => {
    if (!orgId || !token || !confirm(t("confirm_delete_blog_connector"))) return;
    setDeletingBlog(connectorId);
    try {
      await fetch(`${API_URL}/api/v1/orgs/${orgId}/blog-connectors/${connectorId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      await fetchBlogConnectors(orgId, token);
    } finally { setDeletingBlog(null); }
  };

  const handleSavePage = async (page: FbPage) => {
    if (!orgId || !token) return;
    setConnecting(page.page_id);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/facebook/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          org_id: orgId, page_id: page.page_id, page_name: page.page_name,
          page_token: page.page_token, user_token: page.user_token,
          ig_user_id: page.ig_user_id, post_language: pageLanguages[page.page_id] || "ro",
        }),
      });
      if (res.ok) {
        const remaining = fbPages.filter((p) => p.page_id !== page.page_id);
        setFbPages(remaining);
        await fetchAccounts(orgId, token);
        if (remaining.length === 0) router.replace("/dashboard/settings/social-accounts");
      }
    } catch {}
    setConnecting(null);
  };

  const handleLanguageChange = async (accountId: string, lang: string) => {
    if (!orgId || !token) return;
    setSavingLang(accountId);
    setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, post_language: lang } : a)));
    try {
      await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ post_language: lang }),
      });
    } catch {}
    setSavingLang(null);
  };

  const handleStoriesReelsChange = async (accountId: string, field: 'post_as_stories' | 'post_as_reels' | 'stories_video_duration', value: boolean | string) => {
    if (!orgId || !token) return;
    setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, [field]: value } : a)));
    try {
      await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: value }),
      });
    } catch {}
  };

  const handleToggleActive = async (accountId: string, nextActive: boolean) => {
    if (!orgId || !token) return;
    setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, is_active: nextActive } : a)));
    try {
      await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: nextActive }),
      });
    } catch {
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, is_active: !nextActive } : a)));
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!orgId || !token || !confirm(t("confirm_disconnect_account"))) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/${accountId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch {}
  };

  const OAUTH_RECONNECT: Record<string, () => void> = {
    facebook: handleConnectFacebook,
    x: handleConnectX,
    linkedin: handleConnectLinkedIn,
  };

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));
  const hasBlogConnectors = blogConnectors.length > 0;

  return (
    <TooltipProvider>
      <DashboardHeader heading={t("heading")} text={t("subtitle")} />

      <div className="space-y-8 pb-10">
        {/* ── Grid rețele ───────────────────────────────────────────── */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">{t("connect_network")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {NETWORKS.map((net) => {
              if (!net.available) {
                return (
                  <Tooltip key={net.key}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 opacity-40 cursor-not-allowed select-none">
                        {net.icon}
                        <span className="text-xs font-medium">{net.label}</span>
                        <Badge variant="outline" className="text-[10px]">{t("soon")}</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>{t(net.descriptionKey)}</p></TooltipContent>
                  </Tooltip>
                );
              }

              if (net.key === "instagram") {
                return (
                  <Tooltip key={net.key}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2 rounded-lg border p-4 opacity-60 cursor-default select-none">
                        {net.icon}
                        <span className="text-xs font-medium">{net.label}</span>
                        <Badge variant="secondary" className="text-[10px]">Auto</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p>{t(net.descriptionKey)}</p></TooltipContent>
                  </Tooltip>
                );
              }

              // Card Blog — deschide acordeonul
              if (net.key === "blog") {
                return (
                  <Tooltip key={net.key}>
                    <TooltipTrigger asChild>
                      <button onClick={() => { setOpenBlog(true); setTimeout(() => document.getElementById("accordion-blog")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }}
                        className={`flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors ${hasBlogConnectors ? "bg-primary/5" : ""}`}>
                        {net.icon}
                        <span className="text-xs font-medium">{net.label}</span>
                        {hasBlogConnectors
                          ? <Badge className="text-[10px] gap-1"><Check className="h-2.5 w-2.5" /> {blogConnectors.length}</Badge>
                          : <span className="text-[10px] text-muted-foreground">{t("connect")}</span>
                        }
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t(net.descriptionKey)}</p></TooltipContent>
                  </Tooltip>
                );
              }

              const isConnected = connectedPlatforms.has(net.key);
              if (isConnected) {
                return (
                  <div key={net.key} className="flex flex-col items-center gap-2 rounded-lg border bg-primary/5 p-4">
                    {net.icon}
                    <span className="text-xs font-medium">{net.label}</span>
                    <Badge className="text-[10px] gap-1"><Check className="h-2.5 w-2.5" /> {t("connected")}</Badge>
                  </div>
                );
              }

              if (net.key === "facebook") return (
                <button key={net.key} onClick={handleConnectFacebook} disabled={!orgId || !token}
                  className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50">
                  {net.icon}<span className="text-xs font-medium">{net.label}</span>
                  <span className="text-[10px] text-muted-foreground">{t("connect")}</span>
                </button>
              );

              if (net.key === "x") return (
                <button key={net.key} onClick={handleConnectX} disabled={!orgId || !token}
                  className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50">
                  {net.icon}<span className="text-xs font-medium">{net.label}</span>
                  <span className="text-[10px] text-muted-foreground">{t("connect")}</span>
                </button>
              );

              if (net.key === "linkedin") return (
                <button key={net.key} onClick={handleConnectLinkedIn} disabled={!orgId || !token}
                  className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50">
                  {net.icon}<span className="text-xs font-medium">{net.label}</span>
                  <span className="text-[10px] text-muted-foreground">{t("connect")}</span>
                </button>
              );

              return null;
            })}
          </div>
        </div>


        {/* ── Acordeon helper ──────────────────────────────────────── */}
        {/* Discord */}
        <div className="rounded-lg border overflow-hidden">
          <button onClick={() => setOpenDiscord(v => !v)}
            className="flex w-full items-center gap-2 px-4 py-3 hover:bg-muted/40 transition-colors text-left">
            <MessageSquare className="h-4 w-4 text-[#5865F2] shrink-0" />
            <span className="text-sm font-medium flex-1">
              Discord
              {accounts.filter(a => a.platform === "discord").length > 0 && (
                <Badge className="ml-2 text-[10px]">{accounts.filter(a => a.platform === "discord").length}</Badge>
              )}
            </span>
            {openDiscord ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {openDiscord && (
            <div className="border-t px-4 py-3 space-y-3 bg-muted/10">
              <p className="text-xs text-muted-foreground">
                <strong>Server Settings → Integrations → Webhooks → New Webhook</strong>.
                {t("discord_hint")}
              </p>
              <div className="flex gap-2">
                <Input placeholder="https://discord.com/api/webhooks/..." value={discordWebhook}
                  onChange={(e) => { setDiscordWebhook(e.target.value); setDiscordError(""); }}
                  className="flex-1 text-sm" />
                <Button onClick={handleConnectDiscord}
                  disabled={discordSaving || !discordWebhook.trim() || !orgId} size="sm">
                  {discordSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : t("connect")}
                </Button>
              </div>
              {discordError && <p className="text-xs text-destructive">{discordError}</p>}
            </div>
          )}
        </div>

        {/* Bluesky */}
        <div className="rounded-lg border overflow-hidden">
          <button onClick={() => setOpenBluesky(v => !v)}
            className="flex w-full items-center gap-2 px-4 py-3 hover:bg-muted/40 transition-colors text-left">
            <AtSign className="h-4 w-4 text-[#0085FF] shrink-0" />
            <span className="text-sm font-medium flex-1">
              Bluesky
              {accounts.filter(a => a.platform === "bluesky").length > 0 && (
                <Badge className="ml-2 text-[10px]">{accounts.filter(a => a.platform === "bluesky").length}</Badge>
              )}
            </span>
            {openBluesky ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {openBluesky && (
            <div className="border-t px-4 py-3 space-y-3 bg-muted/10">
              <p className="text-xs text-muted-foreground">
                {t.rich("bluesky_hint_prefix", { appPassword: (chunks) => <strong>{chunks}</strong> })}
                <strong> Settings → Privacy and Security → App passwords</strong>.
                {t("bluesky_hint_suffix")}
              </p>
              <div className="flex gap-2">
                <Input placeholder="user.bsky.social" value={bskyHandle}
                  onChange={(e) => { setBskyHandle(e.target.value); setBskyError(""); }}
                  className="flex-1 text-sm" />
                <Input type="password" placeholder="App Password" value={bskyPassword}
                  onChange={(e) => { setBskyPassword(e.target.value); setBskyError(""); }}
                  className="flex-1 text-sm" />
                <Button onClick={handleConnectBluesky}
                  disabled={bskySaving || !bskyHandle.trim() || !bskyPassword.trim() || !orgId} size="sm">
                  {bskySaving ? <Loader2 className="h-3 w-3 animate-spin" /> : t("connect")}
                </Button>
              </div>
              {bskyError && <p className="text-xs text-destructive">{bskyError}</p>}
            </div>
          )}
        </div>

        {/* Blog */}
        <div id="accordion-blog" className="rounded-lg border overflow-hidden">
          <button onClick={() => setOpenBlog(v => !v)}
            className="flex w-full items-center gap-2 px-4 py-3 hover:bg-muted/40 transition-colors text-left">
            <Rss className="h-4 w-4 text-[#F97316] shrink-0" />
            <span className="text-sm font-medium flex-1">
              Blog
              {hasBlogConnectors && (
                <Badge className="ml-2 text-[10px]">{blogConnectors.length}</Badge>
              )}
            </span>
            {openBlog ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {openBlog && (
            <div className="border-t px-4 py-3 space-y-3 bg-muted/10">
              <p className="text-xs text-muted-foreground">
                {t("blog_description")}
              </p>


              {/* Hint per platformă */}
              {blogForm.platform_type === "wordpress" && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p className="font-medium">{t("wordpress_help.title")}</p>
                  <p>{t.rich("wordpress_help.step_1", { strong: (chunks) => <strong>{chunks}</strong> })}</p>
                  <p>{t.rich("wordpress_help.step_2", { em: (chunks) => <em>{chunks}</em>, strong: (chunks) => <strong>{chunks}</strong> })}</p>
                  <p>{t.rich("wordpress_help.step_3", { code: (chunks) => <code>{chunks}</code> })}</p>
                  <p>{t("wordpress_help.step_4")}</p>
                </div>
              )}
              {blogForm.platform_type === "ghost" && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p className="font-medium">{t("ghost_help.title")}</p>
                  <p>1. <strong>Settings → Integrations → Add custom integration</strong></p>
                  <p>{t.rich("ghost_help.step_2", { strong: (chunks) => <strong>{chunks}</strong>, code: (chunks) => <code>{chunks}</code> })}</p>
                  <p>{t.rich("ghost_help.step_3", { strong: (chunks) => <strong>{chunks}</strong> })}</p>
                </div>
              )}
              {blogForm.platform_type === "custom_rest" && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p className="font-medium">{t("custom_rest_help.title")}</p>
                  <p>{t.rich("custom_rest_help.step_1", { code: (chunks) => <code>{chunks}</code> })}</p>
                  <p>{t.rich("custom_rest_help.step_2", { code: (chunks) => <code>{chunks}</code> })}</p>
                  <p>{t.rich("custom_rest_help.step_3", { code: (chunks) => <code>{chunks}</code> })}</p>
                  <p>{t.rich("custom_rest_help.step_4", { strong: (chunks) => <strong>{chunks}</strong> })}</p>
                </div>
              )}

              {/* URL + Detectează */}
              {(
                <div className="flex gap-2">
                  <Input placeholder="https://site-client.com"
                    value={blogForm.site_url}
                    onChange={(e) => { setBlogForm((f) => ({ ...f, site_url: e.target.value })); setDetectSignals(null); }}
                    className="text-sm flex-1" />
                  <Button variant="outline" size="sm" onClick={handleDetect}
                    disabled={detecting || !blogForm.site_url.trim()} className="shrink-0 gap-1">
                    {detecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanSearch className="h-3 w-3" />}
                    {t("detect")}
                  </Button>
                </div>
              )}

              {/* Semnale detecție */}
              {detectSignals && (
                <div className={`rounded-md border px-3 py-2 space-y-1 text-xs ${
                  detectSignals.confidence === "high" ? "border-green-200 bg-green-50 dark:bg-green-950/20" :
                  detectSignals.confidence === "medium" ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20" :
                  "border-muted bg-muted/30"
                }`}>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Info className="h-3 w-3" />
                    {t("detected_platform")} <span className="capitalize">{BLOG_PLATFORM_LABELS[blogForm.platform_type] || blogForm.platform_type}</span>
                    <Badge variant="outline" className="text-[10px] ml-1">{detectSignals.confidence}</Badge>
                  </div>
                  {detectSignals.signals.map((s, i) => (
                    <p key={i} className="text-muted-foreground pl-4">· {s}</p>
                  ))}
                </div>
              )}

              {/* Formular */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={blogForm.platform_type}
                  onChange={(e) => { setBlogForm((f) => ({ ...f, platform_type: e.target.value, site_url: "", wp_username: "", api_key: "" })); setDetectSignals(null); }}>
                  <option value="wordpress">WordPress</option>
                  <option value="ghost">Ghost CMS</option>
                  <option value="custom_rest">Custom REST API</option>
                </select>
                <select className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={blogForm.post_language}
                  onChange={(e) => setBlogForm((f) => ({ ...f, post_language: e.target.value }))}>
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label} — {l.value.toUpperCase()}</option>
                  ))}
                </select>
                <Input placeholder={t("blog_name_placeholder")}
                  value={blogForm.name}
                  onChange={(e) => setBlogForm((f) => ({ ...f, name: e.target.value }))}
                  className="text-sm sm:col-span-2" />
                {blogForm.platform_type === "wordpress" && (
                  <Input placeholder="Username WordPress"
                    value={blogForm.wp_username}
                    onChange={(e) => setBlogForm((f) => ({ ...f, wp_username: e.target.value }))}
                    className="text-sm sm:col-span-2" />
                )}
                <Input type="password"
                  placeholder={
                    blogForm.platform_type === "wordpress" ? t("wordpress_password_placeholder") :
                    blogForm.platform_type === "ghost" ? "Admin API Key (id:secret)" : "API Key"
                  }
                  value={blogForm.api_key}
                  onChange={(e) => setBlogForm((f) => ({ ...f, api_key: e.target.value }))}
                  className="text-sm sm:col-span-2" />
              </div>
              {blogError && <p className="text-xs text-destructive">{blogError}</p>}
              <Button size="sm" onClick={handleAddBlogConnector}
                disabled={
                  blogSaving || !blogForm.name ||
                  (blogForm.platform_type === "wordpress" && (!blogForm.site_url || !blogForm.wp_username || !blogForm.api_key)) ||
                  (blogForm.platform_type !== "wordpress" && (!blogForm.site_url || !blogForm.api_key))
                }>
                {blogSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                {t("connect")}
              </Button>
            </div>
          )}
        </div>

        {/* ── Pagini FB după OAuth ──────────────────────────────────── */}
        {fbPages.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">{t("choose_pages")}</p>
            <p className="text-xs text-muted-foreground">
              {t.rich("facebook_pages_hint", { strong: (chunks) => <strong>{chunks}</strong> })}
            </p>
            {fbPages.map((page) => {
              const alreadyConnected = !!page.connected_to_org;
              return (
                <div key={page.page_id}
                  className="flex items-center gap-3 rounded-md border bg-background p-3">
                  <Facebook className="h-4 w-4 shrink-0 text-[#1877F2]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{page.page_name}</p>
                    {page.ig_user_id && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Instagram className="h-3 w-3" /> + Instagram
                      </p>
                    )}
                    {alreadyConnected && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        {t("connected_to", { org: page.connected_to_org ?? "" })}
                      </p>
                    )}
                  </div>
                  <Select value={pageLanguages[page.page_id] || "ro"}
                    onValueChange={(v) => setPageLanguages((prev) => ({ ...prev, [page.page_id]: v }))}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => handleSavePage(page)} disabled={connecting === page.page_id} className="gap-1">
                    <Plus className="h-3 w-3" />
                    {connecting === page.page_id ? "..." : alreadyConnected ? t("reconnect") : t("add")}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Lista conturi conectate ───────────────────────────────── */}
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : accounts.length === 0 && blogConnectors.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_accounts")}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("connected_accounts")}</p>
            {accounts.map((account) => (
              <div key={account.id} className="rounded-md border bg-background overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <PlatformIcon platform={account.platform} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{account.account_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                  </div>
                  <Select value={account.post_language || "ro"} onValueChange={(v) => handleLanguageChange(account.id, v)}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {savingLang === account.id && <Check className="h-3 w-3 text-green-500 animate-pulse" />}

                  {/* Stories / Reels — doar Instagram și Facebook */}
                  {(account.platform === 'instagram' || account.platform === 'facebook') && (
                    <div className="flex flex-col gap-1 text-xs border-l pl-3 ml-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={account.post_as_stories}
                          onChange={(e) => handleStoriesReelsChange(account.id, 'post_as_stories', e.target.checked)}
                          className="accent-primary"
                        />
                        Stories
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={account.post_as_reels}
                          onChange={(e) => handleStoriesReelsChange(account.id, 'post_as_reels', e.target.checked)}
                          className="accent-primary"
                        />
                        Reels
                      </label>
                      {(account.post_as_stories || account.post_as_reels) && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-muted-foreground">{t("duration")}</span>
                          <input
                            type="number"
                            min="3"
                            max="60"
                            value={account.stories_video_duration || "5"}
                            onChange={(e) => handleStoriesReelsChange(account.id, 'stories_video_duration', e.target.value)}
                            className="w-12 border rounded px-1 py-0.5 text-xs text-center bg-background"
                          />
                          <span className="text-muted-foreground">s</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={account.is_active ? "default" : "secondary"}
                        className="cursor-pointer select-none"
                        onClick={() => handleToggleActive(account.id, !account.is_active)}
                      >
                        {account.is_active ? t("active") : t("inactive")}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {account.is_active ? t("disable_posting_tooltip") : t("enable_posting_tooltip")}
                    </TooltipContent>
                  </Tooltip>

                  {/* Buton OAuth 1.0a pentru X — activează imagini */}
                  {account.platform === 'x' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-xs px-2 h-7 ${account.has_oauth1 ? 'text-green-600' : 'text-muted-foreground'}`}
                          onClick={() => {
                            if (xOauth1AccountId === account.id) {
                              setXOauth1AccountId(null);
                            } else {
                              setXOauth1AccountId(account.id);
                              setXOauth1Form({ consumer_key: "", consumer_secret: "", access_token: "", access_token_secret: "" });
                              setXOauth1Error("");
                            }
                          }}
                        >
                          {account.has_oauth1 ? "✓ 1.0a" : "+ 1.0a"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {account.has_oauth1 ? t("oauth1_active_tooltip") : t("oauth1_add_tooltip")}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {OAUTH_RECONNECT[account.platform] && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={OAUTH_RECONNECT[account.platform]}>
                          <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("reconnect_oauth2")}</TooltipContent>
                    </Tooltip>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDisconnect(account.id)}
                    className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Formular OAuth 1.0a inline — apare sub rândul contului X */}
                {account.platform === 'x' && xOauth1AccountId === account.id && (
                  <div className="border-t bg-muted/30 p-4 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {t.rich("oauth1_hint", { strong: (chunks) => <strong>{chunks}</strong> })}
                    </p>
                    {[
                      { key: "consumer_key", label: "API Key (Consumer Key)" },
                      { key: "consumer_secret", label: "API Secret (Consumer Secret)" },
                      { key: "access_token", label: "Access Token" },
                      { key: "access_token_secret", label: "Access Token Secret" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-xs text-muted-foreground">{label}</label>
                        <Input
                          type="password"
                          placeholder={label}
                          value={(xOauth1Form as any)[key]}
                          onChange={e => setXOauth1Form(f => ({ ...f, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                    {xOauth1Error && <p className="text-xs text-destructive">{xOauth1Error}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveXOAuth1} disabled={xOauth1Saving}>
                        {xOauth1Saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        {t("save")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setXOauth1AccountId(null)}>{t("cancel")}</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {blogConnectors.map((bc) => (
              <div key={bc.id} className="flex items-center gap-3 rounded-md border bg-background p-3">
                <Rss className="h-5 w-5 text-[#F97316] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{bc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{BLOG_PLATFORM_LABELS[bc.platform_type] || bc.platform_type}</span>
                    {bc.site_url && (
                      <a href={bc.site_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                        {bc.site_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
                {testBlogResult[bc.id] === true && (
                  <span className="flex items-center gap-1 text-xs text-green-600 shrink-0"><CheckCircle2 className="h-3.5 w-3.5" /> OK</span>
                )}
                {testBlogResult[bc.id] === false && (
                  <span className="flex items-center gap-1 text-xs text-red-500 shrink-0"><XCircle className="h-3.5 w-3.5" /> {t("failed")}</span>
                )}
                <Button variant="ghost" size="sm" className="text-xs h-8 px-2 shrink-0"
                  onClick={() => handleTestBlog(bc.id)} disabled={testingBlog === bc.id}>
                  {testingBlog === bc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
                </Button>
                <Badge variant="outline" className="uppercase text-[11px]">
                  {bc.extra_config?.post_language || "ro"}
                </Badge>
                <Badge variant={bc.last_test_ok ? "default" : "secondary"}>
                  {bc.last_test_ok ? t("active") : t("inactive")}
                </Badge>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDeleteBlog(bc.id)} disabled={deletingBlog === bc.id}>
                  {deletingBlog === bc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
