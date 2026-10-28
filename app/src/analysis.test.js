import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { groupPlants, layerSummary, plantRows, solarSummary, summarize } from "./analysis.js";

const plant = (fuel, province, mw, geometry = { type: "Point", coordinates: [122, 12] }) => ({
  geometry, properties: { name: fuel, fuel, province, capacity_mw: mw },
});

test("multiple hits count once per plant and layer, with inside taking precedence", () => {
  const plants = [plant("Coal", "A", 100), plant("Solar", "A", 20), plant("Wind", "B", null)];
  const overlaps = {
    0: [{ layer: "kba", rel: "inside" }, { layer: "kba", rel: "within 5 km" }, { layer: "mpa", rel: "within 5 km" }],
    1: [{ layer: "kba", rel: "within 5 km" }],
  };
  const rows = plantRows(plants, overlaps, new Set([0, 1, 2]));
  const stats = summarize(rows);
  assert.equal(stats.flagged, 2);
  assert.equal(stats.inside, 1);
  assert.equal(stats.nearOnly, 1);
  assert.equal(stats.multiLayer, 1);
  assert.equal(stats.missingMW, 1);
  assert.equal(stats.mw, 120);
  assert.equal(stats.inside + stats.nearOnly + stats.unflagged, stats.count);
  assert.deepEqual(layerSummary(rows).find((r) => r.id === "kba"), { id: "kba", count: 2, inside: 1, nearOnly: 1 });
  assert.equal(groupPlants(rows, "province").find((r) => r.name === "A").flagged, 2);
});

test("filtering preserves original overlap indices and excludes storage from renewables", () => {
  const plants = [plant("Coal", "A", 100), plant("BESS", "A", 50), plant("Solar", "B", 20)];
  const overlaps = { 2: [{ layer: "kba", rel: "inside" }] };
  const rows = plantRows(plants, overlaps, new Set([1, 2]), true);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].idx, 2);
  assert.equal(rows[0].flagged, true);
  assert.equal(summarize(plantRows(plants, overlaps, new Set())).count, 0);
});

test("solar aggregates keep unmapped contracts, separate installed MW, and preserve multi-province labels", () => {
  const contract = (island, stage, potential, installed, location) => ({
    geometry: location ? { type: "Point", coordinates: [122, 12] } : null,
    properties: { island, stage, province: "A and B", potential_mw: potential, installed_mw: installed, geocode_status: location },
  });
  const features = [
    contract("Luzon", "Development", 100, 0, "centroid_municipality"),
    contract("Luzon", "Commercial Operation", 0, 80, null),
    contract("Visayas", "Pre-Development", 20, 0, "centroid_province"),
  ];
  const summary = solarSummary(features);
  assert.equal(summary.count, 3);
  assert.equal(summary.potential, 120);
  assert.equal(summary.installed, 80);
  assert.equal(summary.nonCommercial.count, 2);
  assert.equal(summary.municipality + summary.province + summary.unmapped, summary.count);
  assert.equal(summary.unmapped, 1);
  assert.equal(summary.provinces[0].name, "A and B");
  assert.equal(summary.provinces[0].count, 3);
  assert.equal(solarSummary(features, "Luzon").count, 2);
  assert.equal(solarSummary(features, "Mindanao").count, 0);
});

test("shipped inventory summaries reconcile with underlying records", () => {
  const read = (file) => JSON.parse(readFileSync(new URL(`../public/data/${file}`, import.meta.url)));
  const plants = read("plants.geojson").features;
  const overlaps = read("overlaps.json");
  const rows = plantRows(plants, overlaps, new Set(plants.map((_, i) => i)));
  const stats = summarize(rows);
  assert.equal(stats.flagged, Object.values(overlaps).filter((hits) => hits.length).length);
  assert.equal(stats.inside + stats.nearOnly + stats.unflagged, plants.length);
  for (const field of ["province", "fuel", "status", "island"]) {
    const groups = groupPlants(rows, field);
    assert.equal(groups.reduce((sum, group) => sum + group.count, 0), stats.count);
    assert.equal(groups.reduce((sum, group) => sum + group.flagged, 0), stats.flagged);
    assert.ok(Math.abs(groups.reduce((sum, group) => sum + group.mw, 0) - stats.mw) < 0.001);
  }
});
