# How the Table of Contents works

This explains the "On this page" rail in
[`src/components/article/TableOfContents.tsx`](../src/components/article/TableOfContents.tsx).

The component does three separate jobs, and each one needs only a little math:

1. **Draw the grey line** (the "track") that runs past every item and steps
   sideways when nesting changes.
2. **Light up part of that line** (the "thumb") for the sections that are active.
3. **Housekeeping**: fade the edges when the TOC is long, and auto-scroll it.

[`use-active-headings.ts`](../src/components/article/use-active-headings.ts)
only gives the component a `Set` of active heading ids. Everything below is
drawing.

---

## 1. Drawing the track (`measure`)

### Step A: where each item's line goes horizontally

```ts
const lineX = (depth) => (depth <= 2 ? 1 : depth === 3 ? 13 : 25);
```

An h2's line is at x=1, an h3's at x=13 and an h4's at x=25. The link text is
padded by `lineX + TEXT_GAP`, so it always sits 14px right of its own line.

### Step B: where each item is vertically

```ts
spans = links.map((el) => ({ top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight }));
```

These are the pixel positions of each `<a>` inside the track. They're measured,
not computed, because a long title can wrap onto two lines and become taller.

### Step C: build one SVG path through all items

Take a worked example with four items, each 30px tall:

| i | item   | depth | x  | top–bottom |
| - | ------ | ----- | -- | ---------- |
| 0 | Intro  | h2    | 1  | 0–30       |
| 1 | Setup  | h3    | 13 | 30–60      |
| 2 | Config | h3    | 13 | 60–90      |
| 3 | Outro  | h2    | 1  | 90–120     |

Each item gets a vertical segment from `start` to `end` at its own `x`. The only
extra rule is this:

- If the **previous** item has a different x (`bendIn`), start 6px lower
  (`top + BEND`).
- If the **next** item has a different x (`bendOut`), stop 6px earlier
  (`bottom - BEND`).

That leaves a 12px gap wherever the depth changes. Because the path continues
with `L` (line-to), SVG fills that gap with a **diagonal**, and the diagonal is
the bend:

```
i=0  M1 0   L1 24     ← stops 6px early (next is deeper)
i=1  L13 36 L13 60    ← "L13 36" draws the diagonal (1,24)→(13,36)
i=2  L13 60 L13 84    ← same x as before, so it just continues straight
i=3  L1 96  L1 120    ← diagonal back (13,84)→(1,96)
```

The result looks like this:

```
y=0   │  Intro
      │
y=24   ╲
y=36    │  Setup
        │
        │  Config
y=84   ╱
y=96  │  Outro
y=120 │
```

So the path is just: **one vertical line per item, shortened by 6px at each end
that touches a different depth, all joined with straight lines.**

`width = max x + 2` makes the SVG wide enough that a 2px stroke at x=25 isn't
clipped.

A `ResizeObserver` re-runs `measure` whenever the track changes size, for
example when the window narrows and titles wrap.

---

## 2. The highlight (thumb)

### The math is just "first to last active"

```ts
firstActive = first index in the active set
lastActive  = last index in the active set
thumb.top    = spans[firstActive].top
thumb.height = spans[lastActive].bottom - spans[firstActive].top
```

If Setup and Config are on screen, `top = 30` and `height = 90 - 30 = 60`.
It's one vertical range in pixels.

### The trick: a rectangle seen through a stencil

The thumb isn't a path. It's a plain **full-width rectangle**
(`<div class="bg-foreground">`) at `top: 30, height: 60`.

That rectangle sits inside a wrapper whose CSS `mask-image` is **the same
path**, drawn as an SVG data URL. A mask works like a stencil: the rectangle is
only visible where the path's stroke is.

```
  rectangle (y 30–90)        path as stencil           what you see
  ┌──────────┐                 ╲                         ╲  (lower half lit)
  │██████████│                  │                         █
  │██████████│        ×         │             =           █
  │██████████│                 ╱                         ╱  (upper half lit)
  └──────────┘
```

**Why do it this way?** A rectangle's `top` and `height` can be animated with a
simple CSS transition (`transition-[top,height]`). Animating "a piece of a bent
SVG path" directly would be painful. The mask means you only ever move a box,
and the bends come for free. Even the diagonals light up naturally, because the
box covers half of each bend.

Two smaller details:

- The visible track is drawn with `strokeWidth={1}` at 10% opacity. The mask
  path uses `stroke-width="2"`, so the lit part looks bolder than the grey track.
- When nothing is active (you're above the first heading), `opacity: 0` hides
  the thumb.

---

## 3. Housekeeping (only matters for long TOCs)

### Edge fade

- `top` is true when the list is scrolled down at all (`scrollTop > 1`).
- `bottom` is true when there's more content below
  (`scrollTop + clientHeight < scrollHeight - 1`).
- A gradient mask turns each of those edges transparent over 32px (`FADE`), so
  it's obvious there are hidden items.
- The `-1` / `> 1` are 1px tolerances for sub-pixel rounding.

### Auto-scroll

When `firstActive` changes, the code checks whether that link is inside the
*really visible* window, meaning the scroll area minus the 32px fade at each
end. If it isn't, it scrolls the rail so the link sits **one third from the
top** (`top - clientHeight / 3`), which leaves room to see what comes next.

---

## In one sentence

The code measures where each link is, draws one line per link (connected by
diagonals where indentation changes), and highlights the active range by
sliding a plain rectangle behind a stencil of that line.

## Further reading

- [MDN: SVG Paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths): the `M` / `L` commands used in the track.
- [MDN: CSSOM View API](https://developer.mozilla.org/en-US/docs/Web/API/CSSOM_view_API): `offsetTop`, `scrollTop`, `getBoundingClientRect`.
- [MDN: CSS `mask-image`](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image): the stencil trick behind the thumb.
