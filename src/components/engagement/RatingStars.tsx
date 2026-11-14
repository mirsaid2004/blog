"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { SignInButtons } from "@/components/auth/UserMenu";
import { formatRating } from "@/lib/content/format";
import { MIN_RATINGS } from "@/lib/content/types";
import { rateContent } from "@/lib/engagement/actions";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  contentId: string;
  kind: "article" | "post" | "series";
  signedIn: boolean;
  /** The reader's current rating. */
  initial: number | null;
  average: number;
  count: number;
}

const STARS = [1, 2, 3, 4, 5];

/** Five stars to rate a piece. Clicking your current rating again removes it. */
export function RatingStars({ contentId, kind, signedIn, initial, average, count }: RatingStarsProps) {
  const t = useTranslations("Engagement");
  const locale = useLocale();
  const [value, setValue] = useState(initial);
  const [hover, setHover] = useState<number | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const rate = (star: number) => {
    if (!signedIn) {
      setShowSignIn(true);
      return;
    }
    const next = star === value ? null : star;
    const previous = value;
    setValue(next);
    setError(false);
    startTransition(async () => {
      const result = await rateContent(contentId, next);
      if (!result.ok) {
        setValue(previous);
        if (result.error === "signedOut") setShowSignIn(true);
        else setError(true);
      }
    });
  };

  const shown = hover ?? value ?? 0;

  return (
    <section
      aria-labelledby={`rate-${contentId}`}
      className="mt-16 rounded-2xl border border-border/60 bg-card/50 p-6 text-center backdrop-blur-sm"
    >
      <h2 id={`rate-${contentId}`} className="text-lg font-bold text-foreground">
        {t("rateTitle", { kind })}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {count >= MIN_RATINGS
          ? t("average", { rating: formatRating(average, locale), count })
          : t("notEnough", { count })}
      </p>

      <div
        role="radiogroup"
        aria-label={t("rateTitle", { kind })}
        className={cn("mt-4 inline-flex gap-1", pending && "opacity-70")}
        onMouseLeave={() => setHover(null)}
      >
        {STARS.map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={t("starLabel", { value: star })}
            disabled={pending}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(null)}
            onClick={() => rate(star)}
            className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Star
              aria-hidden
              className={cn(
                "h-7 w-7 transition-colors",
                star <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>

      <p className="mt-2 min-h-5 text-xs text-muted-foreground" aria-live="polite">
        {error ? t("error") : value ? t("yourRating", { value }) : signedIn ? t("hint") : t("signInToRate")}
      </p>

      {showSignIn && !signedIn && (
        <div className="mx-auto mt-4 max-w-xs text-left">
          <SignInButtons />
        </div>
      )}
    </section>
  );
}
