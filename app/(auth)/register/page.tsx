import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { UserAuthForm } from "@/components/forms/user-auth-form";

export async function generateMetadata() {
  const t = await getTranslations("register_page.metadata");
  return { title: t("title"), description: t("description") };
}

export default async function RegisterPage() {
  const t = await getTranslations("register_page");

  return (
    <div className="container grid h-screen w-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-4 top-4 md:right-8 md:top-8",
        )}
      >
        {t("login")}
      </Link>
      <div className="hidden h-full bg-muted lg:block" />
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <Icons.logo className="mx-auto size-6" />
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Suspense>
            <UserAuthForm type="register" />
          </Suspense>
          <p className="px-8 text-center text-sm text-muted-foreground">
            {t("terms_prefix")}{" "}
            <Link href="/terms" className="hover:text-brand underline underline-offset-4">
              {t("terms_link")}
            </Link>{" "}
            {t("terms_middle")}{" "}
            <Link href="/privacy" className="hover:text-brand underline underline-offset-4">
              {t("privacy_link")}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
