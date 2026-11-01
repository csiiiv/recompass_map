import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_VISIBLE,
  parseShareState,
  serializeShareState,
  selectionFromState,
  visibleWithSelection,
} from "./shareUrl.js";

describe("shareUrl hash state", () => {
  it("round-trips filters, layers, dark, and plant", () => {
    const state = {
      filters: {
        query: "laguna",
        fuel: "Solar",
        status: "all",
        island: "Luzon",
      },
      visible: { ...DEFAULT_VISIBLE, awarded: true, kba: true },
      dark: true,
      plant: 12,
      deal: null,
      sensitive: null,
      awarded: null,
    };
    const hash = serializeShareState(state);
    const parsed = parseShareState({ hash: `#${hash}`, search: "" });
    assert.equal(parsed.filters.query, "laguna");
    assert.equal(parsed.filters.fuel, "Solar");
    assert.equal(parsed.filters.island, "Luzon");
    assert.equal(parsed.dark, true);
    assert.equal(parsed.selection.type, "plant");
    assert.equal(parsed.selection.plant, 12);
    assert.equal(parsed.visible.awarded, true);
    assert.equal(parsed.visible.kba, true);
  });

  it("serializes deal, area, and awarded selections (exclusive)", () => {
    const dealParsed = parseShareState({
      hash: `#${serializeShareState({
        filters: { query: "", fuel: "all", status: "all", island: "all" },
        visible: DEFAULT_VISIBLE,
        deal: 4012,
      })}`,
      search: "",
    });
    assert.equal(dealParsed.selection.type, "deal");
    assert.equal(dealParsed.selection.deal, 4012);
    assert.equal(dealParsed.visible.land_deals, true);
    assert.equal(dealParsed.visible.land_deal_sites, true);

    const areaParsed = parseShareState({
      hash: `#${serializeShareState({
        filters: { query: "", fuel: "all", status: "all", island: "all" },
        visible: { ...DEFAULT_VISIBLE, kba: true },
        sensitive: { layer: "kba", props: { id: 177 } },
      })}`,
      search: "",
    });
    assert.equal(areaParsed.selection.type, "area");
    assert.equal(areaParsed.selection.layer, "kba");
    assert.equal(areaParsed.selection.id, "177");
    assert.equal(areaParsed.visible.kba, true);

    const awParsed = parseShareState({
      hash: `#${serializeShareState({
        filters: { query: "", fuel: "all", status: "all", island: "all" },
        visible: { ...DEFAULT_VISIBLE, awarded: true },
        awarded: { lng: 121.05, lat: 14.18 },
      })}`,
      search: "",
    });
    assert.equal(awParsed.selection.type, "awarded");
    assert.equal(awParsed.selection.lng, 121.05);
    assert.equal(awParsed.selection.lat, 14.18);
    assert.equal(awParsed.visible.awarded, true);
  });

  it("prefers plant over other selections when serializing", () => {
    const sel = selectionFromState({
      plant: 1,
      deal: 9,
      sensitive: { layer: "kba", props: { id: 2 } },
    });
    assert.equal(sel.type, "plant");
  });

  it("auto-enables layers for a shared selection", () => {
    const v = visibleWithSelection(
      { ...DEFAULT_VISIBLE },
      { type: "area", layer: "mpa", id: "X" }
    );
    assert.equal(v.mpa, true);
    assert.equal(v.protected_areas, true);
  });

  it("reads legacy query-string links", () => {
    const parsed = parseShareState({
      hash: "",
      search: "?fuel=Wind&dark=1&plant=3",
    });
    assert.equal(parsed.filters.fuel, "Wind");
    assert.equal(parsed.dark, true);
    assert.equal(parsed.selection.plant, 3);
  });

  it("omits default layers from the hash", () => {
    const hash = serializeShareState({
      filters: { query: "", fuel: "all", status: "all", island: "all" },
      visible: { ...DEFAULT_VISIBLE },
      dark: false,
      plant: null,
    });
    assert.equal(hash, "");
  });
});
