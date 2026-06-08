import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DeleteAccountSection } from "@/components/dashboard/delete-account";
import { DashboardHeader } from "@/components/dashboard/header";
import { TelegramConnectSection } from "@/components/dashboard/telegram-connect";
import { UserNameForm } from "@/components/forms/user-name-form";
import { UserRoleForm } from "@/components/forms/user-role-form";
import { LanguagePicker } from "@/components/ui/language-picker";

export const metadata = constructMetadata({
  title: "Settings – SaaS Starter",
  description: "Configure your account and website settings.",
});

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("settings");

  if (!user?.id) redirect("/login");

  return (
    <>
      <DashboardHeader
        heading={t("title")}
        text={t("subtitle")}
      />
      <div className="divide-y divide-muted pb-10">
        <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        <UserRoleForm user={{ id: user.id, role: user.role }} />
        <div className="py-6">
          <LanguagePicker />
        </div>
        <TelegramConnectSection />
        <DeleteAccountSection />
      </div>
    </>
  );
}
