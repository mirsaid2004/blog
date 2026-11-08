"use client";

import { useEffect, useRef } from "react";
import { Loader2, SearchIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  /** Accessible label for the input. */
  label: string;
  /** Accessible label for the clear button. */
  clearLabel: string;
  /** Shows a spinner in place of the clear button / shortcut hint. */
  pending?: boolean;
  /** Focus the field with the "/" key from anywhere on the page. */
  shortcut?: boolean;
  id?: string;
  /** Classes for the outer wrapper; it sets the height (h-12 by default). */
  className?: string;
  inputClassName?: string;
}

/** Shared search input: rounded pill, clear button, Escape to clear and a "/" shortcut. */
export default function SearchField({
  value,
  onValueChange,
  placeholder,
  label,
  clearLabel,
  pending = false,
  shortcut = true,
  id,
  className,
  inputClassName,
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the search box, like most docs and blog sites.
  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  return (
    <label className={cn("relative flex h-12 w-full", className)}>
      <span className="sr-only">{label}</span>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onValueChange("");
          }
        }}
        placeholder={placeholder}
        className={cn(
          "h-full w-full rounded-full border border-border bg-card pl-11 pr-12 text-sm text-foreground shadow-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25 [&::-webkit-search-cancel-button]:hidden",
          inputClassName
        )}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2">
        {pending ? (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              onValueChange("");
              inputRef.current?.focus();
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={clearLabel}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : shortcut ? (
          <kbd className="hidden h-6 min-w-6 items-center justify-center rounded-full border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground sm:flex">
            /
          </kbd>
        ) : null}
      </span>
    </label>
  );
}
