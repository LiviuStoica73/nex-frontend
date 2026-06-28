"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Facebook, Instagram, Trash2, Plus, Globe, Check, X as XIcon,
  MessageSquare, Linkedin, Youtube, Music2, AtSign, ExternalLink,
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

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_id: string;
  post_language: string | null;
  is_active: boolean;
  created_at: string;
}

interface FbPage {
  page_id: string;
  page_name: string;
  page_token: string;
  user_token: string;
  ig_user_id: string | null;
  connected_to_org?: string | null;
}

// Definiție rețele — ordinea apariției în UI
const NETWORKS = [
  {
    key: "facebook",
    label: "Facebook",
    icon: <Facebook className="h-4 w-4 text-[#1877F2]" />,
    available: true,
    method: "oauth",
    description: "Pagini Facebook",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: <Instagram className="h-4 w-4 text-[#E1306C]" />,
    available: true,
    method: "via-facebook",
    description: "Prin cont Facebook Business",
  },
  {
    key: "discord",
    label: "Discord",
    icon: <MessageSquare className="h-4 w-4 text-[#5865F2]" />,
    available: true,
    method: "webhook",
    description: "Webhook URL din Server Settings → Integrations",
  },
  {
    key: "x",
    label: "X / Twitter",
    icon: <XIcon className="h-4 w-4" />,
    available: true,
    method: "oauth",
    description: "OAuth 2.0 — free tier 1500 tweets/lună",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: <Linkedin className="h-4 w-4 text-[#0A66C2]" />,
    available: true,
    method: "oauth",
    description: "OAuth 2.0 — postare pe profil personal sau pagină organizație",
  },
  {
    key: "bluesky",
    label: "Bluesky",
    icon: <AtSign className="h-4 w-4 text-[#0085FF]" />,
    available: true,
    method: "app-password",
    description: "Handle + App Password (Settings → Privacy → App passwords)",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: <Youtube className="h-4 w-4 text-[#FF0000]" />,
    available: false,
    description: "Disponibil după implementarea pipeline video",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: <Music2 className="h-4 w-4" />,
    available: false,
    description: "Disponibil după implementarea pipeline video",
  },
];

function PlatformIcon({ platform }: { platform: string }) {
  const net = NETWORKS.find((n) => n.key === platform);
  return net?.icon ?? <Globe className="h-4 w-4 text-muted-foreground" />;
}

export default function SocialAccountsPage() {
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
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [discordSaving, setDiscordSaving] = useState(false);
  const [discordError, setDiscordError] = useState("");
  const [bskyHandle, setBskyHandle] = useState("");
  const [bskyPassword, setBskyPassword] = useState("");
  const [bskySaving, setBskySaving] = useState(false);
  const [bskyError, setBskyError] = useState("");

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
    } catch {
      setAccounts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!orgId || !token) return;
    setAccounts([]);
    setFbPages([]);
    fetchAccounts(orgId, token);
  }, [orgId, token]);

  // Pagini FB după redirect OAuth
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

  // Confirmare X conectat
  useEffect(() => {
    if (searchParams.get("x_connected") === "1" && orgId && token) {
      fetchAccounts(orgId, token);
      router.replace("/dashboard/settings/social-accounts");
    }
  }, [searchParams.get("x_connected")]);

  const handleConnectFacebook = () => {
    if (!orgId || !token) return;
    window.location.href = `${API_URL}/api/v1/auth/facebook?org_id=${orgId}&token=${token}`;
  };

  const handleConnectX = () => {
    if (!orgId || !token) return;
    window.location.href = `${API_URL}/api/v1/auth/x?org_id=${orgId}&jwt=${token}`;
  };

  const handleConnectBluesky = async () => {
    if (!orgId || !token || !bskyHandle.trim() || !bskyPassword.trim()) return;
    setBskySaving(true);
    setBskyError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/bluesky/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ handle: bskyHandle.trim(), app_password: bskyPassword.trim() }),
      });
      if (res.ok) {
        setBskyHandle("");
        setBskyPassword("");
        await fetchAccounts(orgId, token);
      } else {
        const err = await res.json();
        setBskyError(err.detail || "Eroare la conectare.");
      }
    } catch {
      setBskyError("Eroare de rețea.");
    }
    setBskySaving(false);
  };

  const handleConnectLinkedIn = () => {
    if (!orgId || !token) return;
    window.location.href = `${API_URL}/api/v1/auth/linkedin?org_id=${orgId}&jwt=${token}`;
  };

  // Confirmare LinkedIn conectat
  useEffect(() => {
    if (searchParams.get("li_connected") === "1" && orgId && token) {
      fetchAccounts(orgId, token);
      router.replace("/dashboard/settings/social-accounts");
    }
  }, [searchParams.get("li_connected")]);

  const handleConnectDiscord = async () => {
    if (!orgId || !token || !discordWebhook.trim()) return;
    setDiscordSaving(true);
    setDiscordError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/discord/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ webhook_url: discordWebhook.trim() }),
      });
      if (res.ok) {
        setDiscordWebhook("");
        await fetchAccounts(orgId, token);
      } else {
        const err = await res.json();
        setDiscordError(err.detail || "Eroare la conectare.");
      }
    } catch {
      setDiscordError("Eroare de rețea.");
    }
    setDiscordSaving(false);
  };

  const handleSavePage = async (page: FbPage) => {
    if (!orgId || !token) return;
    setConnecting(page.page_id);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/facebook/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          org_id: orgId,
          page_id: page.page_id,
          page_name: page.page_name,
          page_token: page.page_token,
          user_token: page.user_token,
          ig_user_id: page.ig_user_id,
          post_language: pageLanguages[page.page_id] || "ro",
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
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, post_language: lang } : a))
    );
    try {
      await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ post_language: lang }),
      });
    } catch {}
    setSavingLang(null);
  };

  const handleDisconnect = async (accountId: string) => {
    if (!orgId || !token) return;
    if (!confirm("Dezconectezi acest cont?")) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/${accountId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch {}
  };

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  return (
    <TooltipProvider>
      <DashboardHeader
        heading="Conturi sociale"
        text="Conectează rețelele sociale ale brandului."
      />

      <div className="space-y-8 pb-10">
        {/* Grid rețele disponibile */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Conectează o rețea</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {NETWORKS.map((net) => {
              const isConnected = connectedPlatforms.has(net.key);
              const isInstagram = net.key === "instagram";

              if (!net.available) {
                return (
                  <Tooltip key={net.key}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 opacity-40 cursor-not-allowed select-none">
                        {net.icon}
                        <span className="text-xs font-medium">{net.label}</span>
                        <Badge variant="outline" className="text-[10px]">Curând</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{net.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              if (isInstagram) {
                return (
                  <Tooltip key={net.key}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-2 rounded-lg border p-4 opacity-60 cursor-default select-none">
                        {net.icon}
                        <span className="text-xs font-medium">{net.label}</span>
                        <Badge variant="secondary" className="text-[10px]">Auto</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{net.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              if (isConnected) {
                return (
                  <div key={net.key} className="flex flex-col items-center gap-2 rounded-lg border bg-primary/5 p-4">
                    {net.icon}
                    <span className="text-xs font-medium">{net.label}</span>
                    <Badge className="text-[10px] gap-1"><Check className="h-2.5 w-2.5" /> Conectat</Badge>
                  </div>
                );
              }

              // Facebook OAuth
              if (net.key === "facebook") {
                return (
                  <button
                    key={net.key}
                    onClick={handleConnectFacebook}
                    disabled={!orgId || !token}
                    className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {net.icon}
                    <span className="text-xs font-medium">{net.label}</span>
                    <span className="text-[10px] text-muted-foreground">Conectează</span>
                  </button>
                );
              }

              // X OAuth
              if (net.key === "x") {
                return (
                  <button
                    key={net.key}
                    onClick={handleConnectX}
                    disabled={!orgId || !token}
                    className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {net.icon}
                    <span className="text-xs font-medium">{net.label}</span>
                    <span className="text-[10px] text-muted-foreground">Conectează</span>
                  </button>
                );
              }

              // LinkedIn OAuth
              if (net.key === "linkedin") {
                return (
                  <button
                    key={net.key}
                    onClick={handleConnectLinkedIn}
                    disabled={!orgId || !token}
                    className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {net.icon}
                    <span className="text-xs font-medium">{net.label}</span>
                    <span className="text-[10px] text-muted-foreground">Conectează</span>
                  </button>
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* Discord webhook input — mereu vizibil, permite multiple webhooks */}
        {(
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#5865F2]" />
              <span className="text-sm font-medium">
                {connectedPlatforms.has("discord") ? "Adaugă alt webhook Discord" : "Conectează Discord"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              În serverul Discord: <strong>Server Settings → Integrations → Webhooks → New Webhook</strong>.
              Copiază URL-ul și lipește-l mai jos. Poți adăuga mai multe webhookuri (canale diferite).
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhook}
                onChange={(e) => { setDiscordWebhook(e.target.value); setDiscordError(""); }}
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleConnectDiscord}
                disabled={discordSaving || !discordWebhook.trim() || !orgId}
                size="sm"
              >
                {discordSaving ? "..." : "Conectează"}
              </Button>
            </div>
            {discordError && <p className="text-xs text-destructive">{discordError}</p>}
          </div>
        )}

        {/* Bluesky handle + app password */}
        {!connectedPlatforms.has("bluesky") && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AtSign className="h-4 w-4 text-[#0085FF]" />
              <span className="text-sm font-medium">Conectează Bluesky</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Folosește un <strong>App Password</strong>, nu parola contului tău.
              Creează unul din: <strong>Settings → Privacy and Security → App passwords</strong>.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="user.bsky.social"
                value={bskyHandle}
                onChange={(e) => { setBskyHandle(e.target.value); setBskyError(""); }}
                className="flex-1 text-sm"
              />
              <Input
                type="password"
                placeholder="App Password"
                value={bskyPassword}
                onChange={(e) => { setBskyPassword(e.target.value); setBskyError(""); }}
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleConnectBluesky}
                disabled={bskySaving || !bskyHandle.trim() || !bskyPassword.trim() || !orgId}
                size="sm"
              >
                {bskySaving ? "..." : "Conectează"}
              </Button>
            </div>
            {bskyError && <p className="text-xs text-destructive">{bskyError}</p>}
          </div>
        )}

        {/* Pagini disponibile după redirect OAuth Facebook */}
        {fbPages.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Alege paginile pe care vrei să le conectezi:</p>
            <p className="text-xs text-muted-foreground">
              ℹ️ Apar doar <strong>Paginile Facebook</strong> pe care le administrezi.
              Conturile Instagram apar automat lângă pagina Facebook la care sunt legate.
            </p>
            {fbPages.map((page) => {
              const alreadyConnected = !!page.connected_to_org;
              return (
                <div
                  key={page.page_id}
                  className={`flex items-center gap-3 rounded-md border p-3 ${alreadyConnected ? "bg-muted/50 opacity-70" : "bg-background"}`}
                >
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
                        Conectat la: {page.connected_to_org}
                      </p>
                    )}
                  </div>
                  {alreadyConnected ? (
                    <Badge variant="secondary" className="gap-1 shrink-0">
                      <Check className="h-3 w-3" /> Conectat
                    </Badge>
                  ) : (
                    <>
                      <Select
                        value={pageLanguages[page.page_id] || "ro"}
                        onValueChange={(v) =>
                          setPageLanguages((prev) => ({ ...prev, [page.page_id]: v }))
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => handleSavePage(page)}
                        disabled={connecting === page.page_id}
                        className="gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        {connecting === page.page_id ? "..." : "Adaugă"}
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Lista conturi conectate */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Se încarcă...</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Niciun cont conectat încă.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Conturi conectate</p>
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 rounded-md border bg-background p-3"
              >
                <PlatformIcon platform={account.platform} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{account.account_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                </div>
                <Select
                  value={account.post_language || "ro"}
                  onValueChange={(v) => handleLanguageChange(account.id, v)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {savingLang === account.id && (
                  <Check className="h-3 w-3 text-green-500 animate-pulse" />
                )}
                <Badge variant={account.is_active ? "default" : "secondary"}>
                  {account.is_active ? "Activ" : "Inactiv"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDisconnect(account.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
