import { getTranslations } from "next-intl/server";
import { MobileUserMenu } from "@/components/auth/UserMenu";

/** Shown on admin pages to signed-out visitors (signed-in readers get a 404). */
export async function AdminSignIn() {
  const t = await getTranslations("Admin");
  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-24 pt-36">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("signInRequired")}</p>
      <MobileUserMenu />
    </main>
  );
}
