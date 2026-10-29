/**
 * Deterministic, collision-aware placement of the community name labels on the map.
 *
 * Every label belongs to a fixed point (the community centroid, which is never moved). For each
 * label the function tries a short, fixed list of positions around that point (below, right,
 * left, further below, above), keeps the first one that is inside the map and clear of every
 * label already placed and of every obstacle (signal badges, map controls, the notice badge),
 * and hides the label when none fits. Nothing is random and nothing depends on frame timing, so
 * the same input always gives the same layout.
 *
 * A hidden label is not lost information: the community stays in the table under the map, in the
 * detail panel and in the badge's accessible name, and a selected label is always placed first.
 * The function is pure so it can be tested with plain rectangles.
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LabelInput {
  id: string;
  /** Where the community is, in pixels from the map's top-left corner. */
  px: number;
  py: number;
  /** Measured label size in pixels. */
  w: number;
  h: number;
  /** Lower is more important and is placed first. */
  rank: number;
  /** A pinned label (the selected community) is placed before all others. */
  pinned?: boolean;
}

export interface Placement {
  id: string;
  /** Top-left corner of the label, in pixels from the map's top-left corner. */
  x: number;
  y: number;
  visible: boolean;
}

export interface LayoutOptions {
  /** Distance kept between a label and the map edge. */
  margin?: number;
  /** Distance between the community point and its label. */
  gap?: number;
  /** Clear space kept between two labels. */
  pad?: number;
}

export function intersects(a: Rect, b: Rect, pad = 0): boolean {
  return (
    a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad
  );
}

export function insideBounds(r: Rect, width: number, height: number, margin = 0): boolean {
  return (
    r.x >= margin - 0.01 &&
    r.y >= margin - 0.01 &&
    r.x + r.w <= width - margin + 0.01 &&
    r.y + r.h <= height - margin + 0.01
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

export function layoutLabels(
  inputs: LabelInput[],
  bounds: { width: number; height: number },
  obstacles: Rect[] = [],
  options: LayoutOptions = {},
): Placement[] {
  const margin = options.margin ?? 4;
  const gap = options.gap ?? 12;
  const pad = options.pad ?? 2;
  const order = [...inputs].sort(
    (a, b) =>
      Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
      a.rank - b.rank ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  const placed: Rect[] = [];
  const result = new Map<string, Placement>();

  for (const l of order) {
    const candidates: [number, number][] = [
      [l.px - l.w / 2, l.py + gap], // below, centred
      [l.px + gap, l.py - l.h / 2], // to the right
      [l.px - gap - l.w, l.py - l.h / 2], // to the left
      [l.px - l.w / 2, l.py + gap + l.h + pad + 1], // lower still
      [l.px - l.w / 2, l.py - gap - l.h], // above
      [l.px - l.w / 2, l.py - gap - l.h - 26], // above the badge
    ];
    let chosen: Rect | undefined;
    for (const [cx, cy] of candidates) {
      // Slide the label back inside the map rather than letting it cross an edge.
      const r: Rect = {
        x: clamp(cx, margin, bounds.width - l.w - margin),
        y: clamp(cy, margin, bounds.height - l.h - margin),
        w: l.w,
        h: l.h,
      };
      if (!insideBounds(r, bounds.width, bounds.height, margin)) continue;
      if (placed.some((p) => intersects(r, p, pad))) continue;
      if (obstacles.some((o) => intersects(r, o, 0))) continue;
      chosen = r;
      break;
    }
    if (chosen) {
      placed.push(chosen);
      result.set(l.id, { id: l.id, x: chosen.x, y: chosen.y, visible: true });
    } else {
      result.set(l.id, { id: l.id, x: l.px - l.w / 2, y: l.py + gap, visible: false });
    }
  }
  return inputs.map((l) => result.get(l.id)!);
}
