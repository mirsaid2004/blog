import { cn } from "@/lib/utils";

interface ViewsChartProps {
  data: { day: string; views: number }[];
  locale: string;
  /** Accessible name; also the caption of the fallback table. */
  label: string;
  valueLabel: (views: number) => string;
}

/**
 * Daily views as thin bars in one hue (a single series, so no legend: the
 * section title names it). Each day has a full-height hover target with a
 * tooltip; screen readers get the same numbers as a table.
 */
export function ViewsChart({ data, locale, label, valueLabel }: ViewsChartProps) {
  const max = Math.max(1, ...data.map((d) => d.views));
  const day = (iso: string, style: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...style, timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
  const ticks = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);

  return (
    <figure>
      <div className="relative" aria-hidden>
        {/* Recessive guides: the top value and the baseline. */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="w-8 text-right tabular-nums">{max}</span>
          <span className="flex-1 border-t border-dashed border-border/70" />
        </div>
        <div className="ml-10 flex h-44 items-end gap-[2px] border-b border-border pt-2">
          {data.map((d, i) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div
                className={cn("w-full rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80", d.views === 0 && "bg-transparent")}
                style={{ height: `${(d.views / max) * 100}%` }}
              />
              {/* Near the edges the tooltip grows inward, so it never leaves the card. */}
              <div
                className={cn(
                  "pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block",
                  i < data.length / 4 ? "left-0" : i >= (data.length * 3) / 4 ? "right-0" : "left-1/2 -translate-x-1/2"
                )}
              >
                <span className="font-medium">{day(d.day, { dateStyle: "medium" })}</span>
                <span className="ml-2 tabular-nums text-muted-foreground">{valueLabel(d.views)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="ml-10 mt-1 flex h-4 text-[11px] text-muted-foreground">
          {data.map((d, i) => (
            <span key={d.day} className="relative flex-1">
              {ticks.has(i) && (
                // Anchored to its bar: the first label starts there, the last ends there, the middle is centered.
                <span
                  className={cn(
                    "absolute top-0 whitespace-nowrap",
                    i === 0 ? "left-0" : i === data.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"
                  )}
                >
                  {day(d.day, { day: "numeric", month: "short" })}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <th scope="row">{day(d.day, { dateStyle: "medium" })}</th>
              <td>{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
