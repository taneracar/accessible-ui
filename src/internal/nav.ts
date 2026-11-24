/** Next index for Arrow/Home/End, wrapping, skipping disabled entries. -1 when nothing is enabled. */
export function moveIndex(
  key: "next" | "prev" | "first" | "last",
  current: number,
  disabled: readonly boolean[],
): number {
  const n = disabled.length;
  const step = key === "next" || key === "first" ? 1 : -1;
  let i = key === "first" ? -1 : key === "last" ? n : current;
  if (key === "prev" && current < 0) i = n;
  for (let tries = 0; tries < n; tries++) {
    i = (i + step + n) % n;
    if (!disabled[i]) return i;
  }
  return -1;
}

/** Index of the next enabled label starting with `query`, searching from after `current` and wrapping. */
export function typeahead(
  query: string,
  current: number,
  labels: readonly string[],
  disabled: readonly boolean[],
): number {
  const q = query.toLowerCase();
  // Repeating one letter ("sss") cycles; a longer query may keep the current match.
  const repeated = [...q].every((c) => c === q[0]);
  const needle = repeated ? q[0]! : q;
  const start = repeated ? current + 1 : Math.max(current, 0);
  for (let k = 0; k < labels.length; k++) {
    const i = (start + k) % labels.length;
    if (!disabled[i] && labels[i]!.toLowerCase().startsWith(needle)) return i;
  }
  return -1;
}
