import { getViewer } from "@/lib/auth";
import { getUserRating } from "@/lib/engagement/ratings";
import { RatingStars } from "./RatingStars";

interface RatingPanelProps {
  contentId: string;
  kind: "article" | "post" | "series";
  average: number;
  count: number;
}

/** Rating box at the end of a piece, with the reader's own rating filled in. */
export async function RatingPanel({ contentId, kind, average, count }: RatingPanelProps) {
  const viewer = await getViewer();
  const initial = viewer ? await getUserRating(viewer.id, contentId) : null;
  return (
    <RatingStars
      // Remount when the signed-in user changes, so local state never shows someone else's rating.
      key={viewer?.id ?? "anonymous"}
      contentId={contentId}
      kind={kind}
      signedIn={Boolean(viewer)}
      initial={initial}
      average={average}
      count={count}
    />
  );
}
