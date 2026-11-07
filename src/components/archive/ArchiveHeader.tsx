interface Stat {
  label: string;
}

interface ArchiveHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  stats: Stat[];
}

export default function ArchiveHeader({ eyebrow, title, description, stats }: ArchiveHeaderProps) {
  return (
    <header className="mb-8 md:mb-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
        {description}
      </p>
      {stats.length > 0 && (
        <ul className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-foreground/80">
          {stats.map((stat, i) => (
            <li key={stat.label} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/50" />}
              {stat.label}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
