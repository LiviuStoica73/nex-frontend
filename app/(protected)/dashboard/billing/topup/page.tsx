"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Zap, Star, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/dashboard/header";
import { useOrg } from "@/contexts/org-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

const PACKAGES = [
  {
    credits: 100,
    price: "3€",
    label: "Starter",
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    descriptionKey: "packages.starter.description",
    perCredit: "0.03€/credit",
  },
  {
    credits: 500,
    price: "12€",
    label: "Standard",
    icon: <Star className="h-6 w-6 text-blue-500" />,
    descriptionKey: "packages.standard.description",
    perCredit: "0.024€/credit",
    popular: true,
  },
  {
    credits: 1000,
    price: "22€",
    label: "Pro",
    icon: <Rocket className="h-6 w-6 text-purple-500" />,
    descriptionKey: "packages.pro.description",
    perCredit: "0.022€/credit",
  },
];

export default function TopUpPage() {
  const t = useTranslations("billing_topup")
  const { data: session } = useSession();
  const { activeOrgId } = useOrg();
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");

  const token = (session?.user as any)?.accessToken as string | undefined;

  const handleBuy = async (credits: number) => {
    if (!activeOrgId || !token) return;
    setLoading(credits);
    setError("");
    try {
      const res = await fetch(
        `${API_URL}/api/v1/orgs/${activeOrgId}/billing/topup/create-checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ credits }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.checkout_url;
      } else {
        const err = await res.json();
        setError(err.detail || t("errors.checkout_create"));
      }
    } catch {
      setError(t("errors.network"));
    }
    setLoading(null);
  };

  return (
    <>
      <DashboardHeader
        heading={t("heading")}
        text={t("subtitle")}
      />

      <div className="space-y-6 pb-10 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.credits}
              className={`relative rounded-xl border p-5 space-y-4 flex flex-col ${
                pkg.popular ? "border-primary shadow-sm" : ""
              }`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs">
                  {t("most_popular")}
                </Badge>
              )}
              <div className="flex items-center gap-3">
                {pkg.icon}
                <div>
                  <p className="font-semibold">{pkg.label}</p>
                  <p className="text-xs text-muted-foreground">{pkg.perCredit}</p>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold">{pkg.price}</p>
                <p className="text-sm text-muted-foreground">{t("credits_count", { credits: pkg.credits })}</p>
              </div>
              <p className="text-xs text-muted-foreground flex-1">{t(pkg.descriptionKey)}</p>
              <Button
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
                onClick={() => handleBuy(pkg.credits)}
                disabled={loading !== null || !activeOrgId}
              >
                {loading === pkg.credits ? t("opening") : t("buy")}
              </Button>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <p className="text-xs text-muted-foreground">
          {t("payment_note")}
        </p>
      </div>
    </>
  );
}
