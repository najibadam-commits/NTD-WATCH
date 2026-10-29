import { INTELLIGENCE_THRESHOLD } from './intelligence';

/**
 * SMALL-COUNT POLICY (prototype, synthetic data).
 *
 * One rule applies to every count of records that the programme layer publishes (assessments,
 * risk levels, signals, referrals, follow-ups, referral stages, symptom counts, facility counts):
 *
 *   - a count of 0 is published as 0 (a true zero);
 *   - a count of 1 to 4 (below `SMALL_COUNT_THRESHOLD`) is NOT published and becomes `null`;
 *   - a count of 5 or more is published exactly.
 *
 * `null` therefore means "not shown": either a count of 1 to 4, or a count withheld so that a
 * small count cannot be worked out from the figures around it. It is never zero, never "no data"
 * and never a range, and a view must NOT write "fewer than 5" for it (a withheld total can be large). Missing
 * or insufficient data is carried in other fields (for example a vulnerability band of
 * `INSUFFICIENT_DATA`), so the three cases stay distinguishable.
 *
 * A TOTAL is checked against the parts it is made of (`publishTotal`). It is withheld when exactly
 * one part is hidden (the total minus the visible parts would BE that part), and when the hidden
 * parts add up to their smallest or largest possible sum (all ones, or all fours), which would
 * give every one of them away. When two or more parts are hidden and their sum is in between,
 * the total is published: it narrows the SUM of the hidden parts but identifies none of them.
 * That is a residual risk, listed under LIMITS, not a guarantee. Related pairs are handled the
 * same way (a cumulative "reached this stage" count is hidden whenever a current-stage count
 * below it is; "assessed or beyond" is withheld if the remainder would be a small count).
 *
 * WHERE THIS RUNS: in the shared aggregation functions (`summarise`, `communityDetail`,
 * `monitorReferrals`), before anything is returned to a view, a chart or a report. The exact
 * counts exist only inside those functions, so the map, tables, tooltips, accessible names and
 * CSV/JSON reports are all built from already-suppressed values and cannot disagree.
 *
 * RISK LEVELS: LOW, MODERATE, HIGH, URGENT and "unclassified" are published cell by cell under the
 * rule above. If exactly one cell is hidden, the smallest published non-zero cell is hidden too
 * and the total is kept, so the hidden cell cannot be recovered from the total. If two or more
 * cells are hidden, the total is hidden instead. See `publishRiskGroup` in aggregate.ts.
 *
 * NOT COUNTS OF RECORDS, left as they are: medians (hidden when the sample is under 5), shares
 * (hidden when either count behind them is hidden), the vulnerability index, and the number of
 * CHWs (staff, not people assessed). Communities and facilities are themselves counted in some
 * views; those are counts of places, not of people.
 *
 *  * LIMITS (do not overstate this): the protection boundary is the return value of those functions,
 * which in this prototype is the mock server's response. It is not a security boundary against
 * anyone who can read the underlying records (the mock server and the browser database hold them).
 * It does not defend against differencing across overlapping filters, date ranges or separate
 * partitions (for example summing a weekly series and comparing it with a community table), nor
 * against categories that are derived from exact counts before suppression: the signal band,
 * the trend direction (rising/steady/falling) and the programme priority. Each is a coarse label,
 * but a reader who knows the rule that produces it can narrow a hidden count. The threshold of 5 is a
 * placeholder, not a validated disclosure-control standard, and needs privacy and data-protection
 * review before any real use.
 */
export const SMALL_COUNT_THRESHOLD = INTELLIGENCE_THRESHOLD;

/** A published count: a number (0 or at least the threshold) or `null` for "not shown". */
export type Count = number | null;

/** True for a count that must not be published (1 to threshold-1). */
export const isSmallCount = (n: number): boolean => n > 0 && n < SMALL_COUNT_THRESHOLD;

/** Applies the policy to one count. */
export const suppress = (n: number): Count => (isSmallCount(n) ? null : n);

/** One part of a total: its exact value (internal) and what was published for it. */
export interface Part {
  raw: number;
  shown: Count;
}

/**
 * Publishes a total that is the sum of `partitions` (for example a national total over the
 * communities, or a community total over its referral stages). A total is withheld when:
 *   - it is itself below the threshold;
 *   - exactly one part of any partition is hidden (total minus the visible parts IS that part);
 *   - the hidden parts of a partition sum to the smallest or largest value they could possibly
 *     have (all 1s, or all 4s), so the sum gives every one of them away.
 * With two or more hidden parts and a sum strictly between those extremes, the total is
 * published: it narrows the SUM of the hidden parts but identifies none of them. That is a
 * residual risk, not a guarantee (see "LIMITS").
 */
export function publishTotal(rawTotal: number, ...partitions: readonly (readonly Part[])[]): Count {
  if (isSmallCount(rawTotal)) return null;
  for (const parts of partitions) {
    const hidden = parts.filter((p) => p.shown === null);
    const k = hidden.length;
    if (k === 0) continue;
    if (k === 1) return null;
    const sum = hidden.reduce((n, p) => n + p.raw, 0);
    if (sum <= k) return null;
    if (hidden.every((p) => isSmallCount(p.raw)) && sum >= k * (SMALL_COUNT_THRESHOLD - 1)) {
      return null;
    }
  }
  return rawTotal;
}

/** The text a view shows for a count. Never "0" for a hidden value. */
export const NOT_SHOWN_TEXT = 'Not shown (small-count rule)';

/** Applies `suppress` to every value of a record. */
export function suppressRecord<K extends string>(raw: Record<K, number>): Record<K, Count> {
  return Object.fromEntries(
    (Object.entries(raw) as [K, number][]).map(([k, v]) => [k, suppress(v)]),
  ) as Record<K, Count>;
}
