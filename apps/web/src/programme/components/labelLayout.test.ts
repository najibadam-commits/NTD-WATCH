import { describe, expect, it } from 'vitest';
import { insideBounds, intersects, layoutLabels, type LabelInput, type Rect } from './labelLayout';

// Synthetic points only: fifteen invented communities packed into a small area.
const make = (n: number, width: number, height: number): LabelInput[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `c${String(i).padStart(2, '0')}`,
    px: 40 + ((i * 97) % (width - 80)),
    py: 40 + ((i * 53) % (height - 80)),
    w: 64 + (i % 4) * 10,
    h: 16,
    rank: i % 5,
  }));

const rectOf = (p: { x: number; y: number }, l: LabelInput): Rect => ({
  x: p.x,
  y: p.y,
  w: l.w,
  h: l.h,
});

describe('layoutLabels', () => {
  const sizes = [
    [390, 360],
    [768, 440],
    [1280, 520],
    [1440, 522],
  ] as const;

  it.each(sizes)('keeps every visible label inside a %i x %i map', (width, height) => {
    const inputs = make(15, width, height);
    const out = layoutLabels(inputs, { width, height });
    for (const p of out.filter((o) => o.visible)) {
      const l = inputs.find((i) => i.id === p.id)!;
      expect(insideBounds(rectOf(p, l), width, height)).toBe(true);
    }
  });

  it.each(sizes)(
    'never places two visible labels on top of each other at %i px',
    (width, height) => {
      const inputs = make(15, width, height);
      const out = layoutLabels(inputs, { width, height }).filter((o) => o.visible);
      for (let i = 0; i < out.length; i++) {
        for (let j = i + 1; j < out.length; j++) {
          const a = inputs.find((x) => x.id === out[i]!.id)!;
          const b = inputs.find((x) => x.id === out[j]!.id)!;
          expect(intersects(rectOf(out[i]!, a), rectOf(out[j]!, b))).toBe(false);
        }
      }
    },
  );

  it('is deterministic and independent of input order', () => {
    const inputs = make(15, 768, 440);
    const a = layoutLabels(inputs, { width: 768, height: 440 });
    const b = layoutLabels([...inputs].reverse(), { width: 768, height: 440 });
    const key = (ps: typeof a) => JSON.stringify([...ps].sort((p, q) => (p.id < q.id ? -1 : 1)));
    expect(key(b)).toBe(key(a));
  });

  it('places a pinned (selected) label even when others would win on rank', () => {
    const inputs: LabelInput[] = [
      { id: 'a', px: 100, py: 100, w: 80, h: 16, rank: 0 },
      { id: 'b', px: 100, py: 100, w: 80, h: 16, rank: 4, pinned: true },
    ];
    const out = layoutLabels(inputs, { width: 200, height: 200 });
    expect(out.find((o) => o.id === 'b')!.visible).toBe(true);
  });

  it('hides a label that cannot fit instead of overlapping, and says so', () => {
    const inputs: LabelInput[] = [
      { id: 'a', px: 50, py: 20, w: 90, h: 16, rank: 0 },
      { id: 'b', px: 50, py: 20, w: 90, h: 16, rank: 1 },
    ];
    // A map only 40px tall leaves room for one label.
    const out = layoutLabels(inputs, { width: 100, height: 40 });
    expect(out.filter((o) => o.visible)).toHaveLength(1);
    expect(out.find((o) => o.id === 'b')!.visible).toBe(false);
  });

  it('keeps clear of obstacles such as signal badges', () => {
    const badge: Rect = { x: 30, y: 30, w: 40, h: 40 };
    const inputs: LabelInput[] = [{ id: 'a', px: 50, py: 40, w: 60, h: 16, rank: 0 }];
    const out = layoutLabels(inputs, { width: 300, height: 200 }, [badge]);
    expect(out[0]!.visible).toBe(true);
    expect(intersects(rectOf(out[0]!, inputs[0]!), badge)).toBe(false);
  });

  it('does not move the community point: positions are label offsets only', () => {
    const inputs = make(5, 768, 440);
    const copy = JSON.parse(JSON.stringify(inputs));
    layoutLabels(inputs, { width: 768, height: 440 });
    expect(inputs).toEqual(copy);
  });
});
