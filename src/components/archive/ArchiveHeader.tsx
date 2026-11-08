import type { LucideIcon } from "lucide-react";
import BlurText from "@/components/react-bits/BlurText";
import CountUp from "@/components/react-bits/CountUp";
import ShinyEyebrow from "./effects/ShinyEyebrow";

export interface HeaderStat {
  value: number;
  label: string;
  /** Render large numbers as 12.4K. */
  compact?: boolean;
}

interface ArchiveHeaderProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  stats: HeaderStat[];
}

export default function ArchiveHeader({ icon: Icon, eyebrow, title, description, stats }: ArchiveHeaderProps) {
  return (
    <header className="mb-10 md:mb-14">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/60 px-3 py-1.5 backdrop-blur-md">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
        <ShinyEyebrow text={eyebrow} />
      </div>

      {/* BlurText renders a <p>; keep a real <h1> for document structure and assistive tech. */}
      <h1 className="sr-only">{title}</h1>
      <div aria-hidden>
        <BlurText
          text={title}
          animateBy="words"
          direction="bottom"
          delay={80}
          trigger="load"
          className="mt-5 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl"
        />
      </div>

      <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-300 duration-700 md:text-lg">
        {description}
      </p>

      {stats.length > 0 && (
        <dl className="mt-8 flex flex-wrap gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex min-w-32 flex-col rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-md"
            >
              <dt className="text-xs font-medium text-muted-foreground">{stat.label}</dt>
              <dd className="order-first text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
                <CountUp
                  to={stat.value}
                  duration={1.6}
                  separator=","
                  format={stat.compact ? "compact" : "standard"}
                />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
