"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type Provider = "github" | "google";

const PROVIDERS: { id: Provider; name: string; Icon: (props: { className?: string }) => React.ReactNode }[] = [
  { id: "github", name: "GitHub", Icon: GitHubIcon },
  { id: "google", name: "Google", Icon: GoogleIcon },
];

function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export function SignInButtons({ className }: { className?: string }) {
  const t = useTranslations("Auth");
  const [pending, setPending] = useState<Provider | null>(null);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {PROVIDERS.map(({ id, name, Icon }) => (
        <button
          key={id}
          type="button"
          disabled={pending !== null}
          onClick={async () => {
            setPending(id);
            // Come back to the page the reader was on.
            const callbackURL = window.location.pathname + window.location.search;
            const { error } = await signIn.social({ provider: id, callbackURL });
            if (error) setPending(null);
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"
        >
          <Icon className="h-4 w-4 shrink-0" />
          {t("continueWith", { provider: name })}
        </button>
      ))}
    </div>
  );
}

function Avatar({ name, image, className }: { name: string; image?: string | null; className?: string }) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" referrerPolicy="no-referrer" className={cn("rounded-full object-cover", className)} />
  ) : (
    <span className={cn("flex items-center justify-center rounded-full bg-primary/15 font-semibold text-primary", className)}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** Navbar account control: sign-in options, or the signed-in user's menu. */
export function UserMenu() {
  const t = useTranslations("Auth");
  const { data, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  if (isPending) return <div className="h-9 w-9" aria-hidden />;
  const user = data?.user;

  return (
    <div className="relative" ref={ref}>
      {user ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={t("accountMenu")}
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border/50 shadow-sm transition-all duration-300 hover:scale-105 hover:border-primary/50"
        >
          <Avatar name={user.name} image={user.image} className="h-full w-full text-sm" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:bg-background hover:shadow-lg"
        >
          <LogIn size={16} />
          {t("signIn")}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-4 shadow-2xl backdrop-blur-xl"
          >
            {user ? (
              <>
                <div className="flex items-center gap-3 pb-3">
                  <Avatar name={user.name} image={user.image} className="h-10 w-10 text-base" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 border-t border-border/60 pt-2">
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
                    >
                      <ShieldCheck size={16} />
                      {t("admin")}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      setOpen(false);
                      await signOut();
                    }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
                  >
                    <LogOut size={16} />
                    {t("signOut")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">{t("signInTitle")}</p>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">{t("signInHint")}</p>
                <SignInButtons />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Account section for the mobile drawer. */
export function MobileUserMenu() {
  const t = useTranslations("Auth");
  const { data, isPending } = useSession();
  if (isPending) return null;
  const user = data?.user;

  if (!user) {
    return (
      <>
        <p className="mb-3 px-4 text-xs text-muted-foreground">{t("signInHint")}</p>
        <SignInButtons className="px-1" />
      </>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 px-4 py-2">
        <Avatar name={user.name} image={user.image} className="h-10 w-10 text-base" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      {user.isAdmin && (
        <Link href="/admin" className="flex items-center gap-3 rounded-xl px-4 py-3 text-foreground hover:bg-muted">
          <ShieldCheck size={18} />
          {t("admin")}
        </Link>
      )}
      <button
        type="button"
        onClick={() => signOut()}
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-foreground hover:bg-muted"
      >
        <LogOut size={18} />
        {t("signOut")}
      </button>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.57-5.15 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.59 1.8l3.43-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.27 6.6l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}
