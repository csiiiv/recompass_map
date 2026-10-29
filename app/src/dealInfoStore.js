// Lazily loaded singleton for land_deal_info.json (393 KB).
// The map only needs it once a user interacts with a land-deal feature,
// so we avoid loading it with the initial bundle/page load.
let cache = null;
let pending = null;

export function getDealInfo() {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;
  pending = fetch("data/land_deal_info.json")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((d) => {
      cache = d;
      return d;
    })
    .catch((e) => {
      pending = null; // allow retry on next interaction
      throw e;
    });
  return pending;
}
