"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Facebook, Instagram, Trash2, Plus, Globe } from "lucide-react";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

const LANGUAGES = [
  { value: "ro", label: "Română" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "es", label: "Español" },
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
}

function platformIcon(platform: string) {
  if (platform === "facebook") return <Facebook className="h-4 w-4 text-[#1877F2]" />;
  if (platform === "instagram") return <Instagram className="h-4 w-4 text-[#E1306C]" />;
  return <Globe className="h-4 w-4 text-muted-foreground" />;
}

export default function SocialAccountsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fbPages, setFbPages] = useState<FbPage[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [pageLanguages, setPageLanguages] = useState<Record<string, string>>({});

  const orgId = (session?.user as any)?.orgId as string | undefined;
  const token = (session?.user as any)?.accessToken as string | undefined;

  // Fetch existing accounts
  const fetchAccounts = async () => {
    if (!orgId || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/social-accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, [orgId, token]);

  // Handle redirect from Facebook callback
  useEffect(() => {
    const fbConnect = searchParams.get("fb_connect");
    const pagesParam = searchParams.get("pages");
    if (fbConnect === "1" && pagesParam) {
      try {
        const parsed: FbPage[] = JSON.parse(decodeURIComponent(pagesParam));
        setFbPages(parsed);
        const defaults: Record<string, string> = {};
        parsed.forEach((p) => { defaults[p.page_id] = "ro"; });
        setPageLanguages(defaults);
      } catch {}
    }
  }, [searchParams]);

  const handleConnectFacebook = () => {
    if (!orgId || !token) return;
    window.location.href = `${API_URL}/api/v1/auth/facebook?org_id=${orgId}&token=${token}`;
  };

  const handleSavePage = async (page: FbPage) => {
    if (!orgId || !token) return;
    setConnecting(page.page_id);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/facebook/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        setFbPages((prev) => prev.filter((p) => p.page_id !== page.page_id));
        await fetchAccounts();
        if (fbPages.length <= 1) {
          router.replace("/dashboard/settings/social-accounts");
        }
      }
    } catch {}
    setConnecting(null);
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
        {/* Buton conectare */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleConnectFacebook}
            disabled={!orgId || !token}
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
            {fbPages.map((page) => (
              <div
                key={page.page_id}
                className="flex items-center gap-3 rounded-md border bg-background p-3"
              >
                <Facebook className="h-4 w-4 shrink-0 text-[#1877F2]" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{page.page_name}</p>
                  {page.ig_user_id && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Instagram className="h-3 w-3" /> Instagram conectat
                    </p>
                  )}
                </div>
                <Select
                  value={pageLanguages[page.page_id] || "ro"}
                  onValueChange={(v) =>
                    setPageLanguages((prev) => ({ ...prev, [page.page_id]: v }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
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
                  {connecting === page.page_id ? "Se salvează..." : "Adaugă"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Lista conturi conectate */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Se încarcă...</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Niciun cont conectat încă.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Conturi conectate
            </p>
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 rounded-md border bg-background p-3"
              >
                {platformIcon(account.platform)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{account.account_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {account.platform}
                    {account.post_language && ` · ${account.post_language.toUpperCase()}`}
                  </p>
                </div>
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
