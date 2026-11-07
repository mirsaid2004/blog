import Image from "next/image";
import { cn } from "@/lib/utils";

interface CoverProps {
  src?: string;
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/** Content cover image with a neutral fallback when a piece has no cover. */
export default function Cover({ src, alt = "", sizes, priority, className }: CoverProps) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={src.endsWith(".svg")}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-primary/5 to-transparent" />
      )}
    </div>
  );
}
