import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** Open Graph images: one shared layout for the site, articles, posts and series. */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// The site's dark theme (globals.css), as hex for the image renderer.
const COLORS = {
  background: "#0b0c0f",
  foreground: "#f8fafc",
  primary: "#6dfdfa",
  muted: "#94a3b8",
  border: "#1e293b",
};

// Geist TTFs from the `geist` package: the renderer can't read the site's woff2,
// and these include Cyrillic for Russian titles.
const FONT_DIR = path.join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");
const fonts = Promise.all([
  readFile(path.join(FONT_DIR, "Geist-Regular.ttf")),
  readFile(path.join(FONT_DIR, "Geist-Bold.ttf")),
]);

interface OgImageInput {
  /** Small line above the title, e.g. "Article · 12 min read". */
  eyebrow?: string;
  title: string;
  summary?: string;
  tags?: string[];
}

export async function renderOgImage({ eyebrow, title, summary, tags = [] }: OgImageInput) {
  const [regular, bold] = await fonts;
  const titleSize = title.length > 70 ? 52 : title.length > 40 ? 62 : 72;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: `radial-gradient(circle at 85% 0%, rgba(109, 253, 250, 0.16), transparent 55%), ${COLORS.background}`,
          color: COLORS.foreground,
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: COLORS.primary }} />
          {SITE_NAME}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {eyebrow && (
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: COLORS.primary,
              }}
            >
              {eyebrow}
            </div>
          )}
          <div style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 }}>{title}</div>
          {summary && (
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.4,
                color: COLORS.muted,
                maxHeight: 80,
                overflow: "hidden",
              }}
            >
              {summary}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${COLORS.border}`,
            paddingTop: 28,
            fontSize: 24,
            color: COLORS.muted,
          }}
        >
          <div style={{ display: "flex", gap: 20, color: COLORS.primary }}>
            {tags.slice(0, 4).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <span>{new URL(SITE_URL).host}</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
