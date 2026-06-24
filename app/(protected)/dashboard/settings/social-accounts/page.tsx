"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Facebook, Instagram, Trash2, Plus, Globe, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "facebook") return <Facebook className="h-4 w-4 text-[#1877F2]" />;
  if (platform === "instagram") return <Instagram className="h-4 w-4 text-[#E1306C]" />;
  return <Globe className="h-4 w-4 text-muted-foreground" />;
}

export default function SocialAccountsPage() {
  const { data: session, status } = useSession();
  const { activeOrgId } = useOrg();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fbPages, setFbPages] = useState<FbPage[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [pageLanguages, setPageLanguages] = useState<Record<string, string>>({});
  const [savingLang, setSavingLang] = useState<string | null>(null);
  const [callbackOrgId, setCallbackOrgId] = useState<string | null>(null);

  const token = (session?.user as any)?.accessToken as string | undefined;
  const orgId = activeOrgId || (session?.user as any)?.orgId;
  // În callback OAuth, org-ul corect vine din Redis (nu din activeOrgId care poate fi greșit)
  const effectiveOrgId = callbackOrgId || orgId;

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

  // Fetch conturi la schimbare org (doar dacă nu suntem în callback OAuth)
  useEffect(() => {
    if (searchParams.get("fb_connect")) return; // callback OAuth — lăsăm celălalt effect să preia
    if (!orgId || !token) {
      setLoading(false);
      return;
    }
    setAccounts([]);
    setFbPages([]);
    fetchAccounts(orgId, token);
  }, [orgId, token]);

  // Fetch pages din Redis după redirect Facebook OAuth
  useEffect(() => {
    const fbConnect = searchParams.get("fb_connect");
    const sessionId = searchParams.get("session_id");
    if (fbConnect !== "1" || !sessionId) return;

    fetch(`${API_URL}/api/v1/auth/facebook/session/${sessionId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        const pages: FbPage[] = data.pages;
        setFbPages(pages);
        setCallbackOrgId(data.org_id);
        const defaults: Record<string, string> = {};
        pages.forEach((p) => { defaults[p.page_id] = "ro"; });
        setPageLanguages(defaults);
        if (token && data.org_id) fetchAccounts(data.org_id, token);
      })
      .catch(() => {});
  }, [searchParams, token]);

  const handleConnectFacebook = () => {
    if (!activeOrgId || !token) return;
    window.location.href = `${API_URL}/api/v1/auth/facebook?org_id=${activeOrgId}&token=${token}`;
  };

  const handleSavePage = async (page: FbPage) => {
    if (!orgId || !token) return;
    setConnecting(page.page_id);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/facebook/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          org_id: effectiveOrgId,
          page_id: page.page_id,
          page_name: page.page_name,
          page_token: page.page_token,
          user_token: page.user_token,
          ig_user_id: page.ig_user_id,
          post_language: pageLanguages[page.page_id] || "ro",
        }),
      });
      if (res.ok) {
        setFbPages((prev) => prev.filter((p) => p.page_id !== page.page_id));
        if (effectiveOrgId && token) await fetchAccounts(effectiveOrgId, token);
        if (fbPages.length <= 1) {
          setCallbackOrgId(null);
          router.replace("/dashboard/settings/social-accounts");
        }
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
      await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts/${accountId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch {}
  };

  return (
    <>
      <DashboardHeader
        heading="Conturi sociale"
        text="Conectează paginile Facebook și conturile Instagram ale brandului."
      />

      <div className="space-y-6 pb-10">
        <div>
          <Button
            onClick={handleConnectFacebook}
            disabled={!activeOrgId || !token}
            className="gap-2"
          >
            <Facebook className="h-4 w-4" />
            Conectează Facebook / Instagram
          </Button>
        </div>

        {/* Pagini disponibile după redirect OAuth */}
        {fbPages.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">
              Alege paginile pe care vrei să le conectezi:
            </p>
            <p className="text-xs text-muted-foreground">
              ℹ️ Apar doar <strong>Paginile Facebook</strong> pe care le administrezi.
              Conturile Instagram apar automat lângă pagina Facebook la care sunt legate.
              Dacă un cont Instagram nu apare, du-te în Instagram → Setări → Tip cont → Business,
              apoi leagă-l de o Pagină Facebook.
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
    </>
  );
}
