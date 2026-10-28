import { useEffect, useRef, useState, useMemo } from "react";
import { Popup as MapLibrePopup } from "maplibre-gl";
import { createMap, switchBasemap } from "./maplibre.js";
import { fuelColor, LAYERS, HALO, FLAG_COLOR, layerColor } from "./constants.js";
import DetailPanel from "./DetailPanel.jsx";
import Sidebar from "./Sidebar.jsx";
import OverlapsList from "./OverlapsList.jsx";
import HelpNote from "./HelpNote.jsx";
import AnalysisModal from "./AnalysisModal.jsx";

const SENSITIVE_SOURCES = [
  { id: "protected_areas", file: "data/protected_areas.geojson", type: "polygon" },
  { id: "kba", file: "data/kba.geojson", type: "polygon" },
  { id: "land_deals", file: "data/land_deals.geojson", type: "polygon" },
  { id: "mpa", file: "data/mpa.geojson", type: "point" },
  { id: "land_deal_sites", file: "data/land_deal_sites.geojson", type: "point" },
];

const norm = (s) =>
  (s || "")
    .trim()
    .toLowerCase()
    .replace(/city/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,\s]+|[,\s]+$/g, "");

export default function App() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  const [styleEpoch, setStyleEpoch] = useState(0);
  const [plants, setPlants] = useState(null);
  const [overlaps, setOverlaps] = useState(null);
  const [awarded, setAwarded] = useState(null);
  const [awardedStats, setAwardedStats] = useState(null);
  const [dataError, setDataError] = useState(false);
  const [selected, setSelected] = useState(null); // plant index
  const [visible, setVisible] = useState({
    plants: true,
    awarded: false,
    protected_areas: true,
    kba: false,
    mpa: false,
    land_deals: false,
    land_deal_sites: false,
    ancestral_domains: false,
    municipal_waters: false,
  });
  const [filters, setFilters] = useState({
    query: "",
    fuel: "all",
    status: "all",
    island: "all",
  });
  const [showList, setShowList] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [sideOpen, setSideOpen] = useState(
    typeof window === "undefined" || window.innerWidth > 900
  );
  const tooltipRef = useRef(
    typeof document !== "undefined"
      ? new MapLibrePopup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
          className: "plant-tooltip",
        })
      : null
  );

  // ---- initial state from URL params ----
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dark") === "1") setDark(true);
    const p = params.get("plant");
    if (p != null && /^\d+$/.test(p)) setSelected(Number(p));
    const q = params.get("q");
    const fuel = params.get("fuel");
    const status = params.get("status");
    const island = params.get("island");
    setFilters((f) => ({
      ...f,
      query: q ?? f.query,
      fuel: fuel ?? f.fuel,
      status: status ?? f.status,
      island: island ?? f.island,
    }));
  }, []);

  // ---- load data ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, o, a, gaz] = await Promise.all([
        fetch("data/plants.geojson").then((r) => r.json()),
        fetch("data/overlaps.json").then((r) => r.json()),
        fetch("data/awarded_projects.geojson").then((r) => r.json()),
        fetch("data/gazetteer.json").then((r) => r.json()).catch(() => null),
      ]);
      if (cancelled) return;
      setPlants(p.features);
      setOverlaps(o);

      // geocode awarded projects to municipality/province centroids
      let mapped = 0;
      const unmatched = [];
      if (gaz) {
        for (const f of a.features) {
          const props = f.properties;
          const mParts = (props.municipality || "")
            .split(/\s+and\s+|,/i)
            .map(norm)
            .filter(Boolean);
          const prov = norm(props.province);
          let coords = null;
          let level = null;
          for (const m of mParts) {
            if (gaz.municipality[m]) {
              coords = gaz.municipality[m];
              level = "municipality";
              break;
            }
          }
          if (!coords && gaz.province[prov]) {
            coords = gaz.province[prov];
            level = "province";
          }
          if (coords) {
            f.geometry = { type: "Point", coordinates: coords };
            props.geocode_status = `centroid_${level}`;
            mapped += 1;
          } else {
            unmatched.push(props.name);
          }
        }
      }
      setAwarded(a.features);
      setAwardedStats({
        total: a.features.length,
        mapped,
        unmapped: a.features.length - mapped,
      });
    })().catch(() => {
      if (!cancelled) setDataError(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- create map once ----
  useEffect(() => {
    const map = createMap(mapContainer.current, dark);
    mapRef.current = map;
    map.on("load", () => setReady(true));
    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- theme switch ----
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    switchBasemap(map, dark);
    const onStyleLoad = () => {
      setStyleEpoch((k) => k + 1);
      map.off("styledata", onStyleLoad);
    };
    map.on("styledata", onStyleLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark]);

  // ---- add sources + layers ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !plants || !overlaps) return;

    if (!map.getSource("plants")) {
      const features = plants
        .map((f, i) => {
          if (!f.geometry) return null;
          const p = f.properties;
          return {
            ...f,
            properties: {
              ...p,
              idx: i,
              color: fuelColor(p.fuel),
              cap: p.capacity_mw || 0,
              flagged: Object.prototype.hasOwnProperty.call(overlaps, String(i)),
            },
          };
        })
        .filter(Boolean);
      map.addSource("plants", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });
      map.addLayer({
        id: "plants-halo",
        type: "circle",
        source: "plants",
        paint: {
          "circle-color": ["case", ["==", ["get", "flagged"], true], "#dc2626", ["get", "color"]],
          "circle-opacity": 0.15,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 4, 10, 12],
        },
      });
      map.addLayer({
        id: "plants",
        type: "circle",
        source: "plants",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            ["case", [">", ["get", "cap"], 100], 5.5, 3.5],
            10,
            ["case", [">", ["get", "cap"], 100], 12, 8],
          ],
          // Theme-aware halo: charcoal framing on light basemaps, near-white on
          // dark ones. This is what keeps Coal (#33383f) and Oil-Based (#7c8798)
          // legible on both themes without forcing mid-tone palette colors.
          "circle-stroke-color": [
            "case",
            ["==", ["get", "flagged"], true],
            FLAG_COLOR,
            dark ? HALO.dark : HALO.light,
          ],
          "circle-stroke-width": ["case", ["==", ["get", "flagged"], true], 2, 1.5],
          "circle-stroke-opacity": 0.95,
        },
      });

      // hover tooltip
      const popup = tooltipRef.current;
      map.on("mouseenter", "plants", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features[0];
        const p = f.properties;
        const flag = p.flagged ? " · <b style='color:#dc2626'>⚑ overlap</b>" : "";
        popup
          .setLngLat(f.geometry.coordinates)
          .setHTML(
            `<strong>${p.name}</strong><br/>${p.fuel || ""} · ${p.status || ""}${flag}`
          )
          .addTo(map);
      });
      map.on("mousemove", "plants", (e) => {
        if (e.features[0]) popup.setLngLat(e.features[0].geometry.coordinates);
      });
      map.on("mouseleave", "plants", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
      map.on("click", "plants", (e) => {
        setSelected(e.features[0].properties.idx);
      });
    }

    // awarded contracts: HOLLOW rings (no fill, thick dark-amber stroke) —
    // unmistakably distinct from solid solar dots even at the same location
    if (!map.getSource("awarded") && awarded) {
      const feats = awarded.filter((f) => f.geometry);
      map.addSource("awarded", {
        type: "geojson",
        data: { type: "FeatureCollection", features: feats },
      });
      map.addLayer({
        id: "awarded",
        type: "circle",
        source: "awarded",
        paint: {
          "circle-opacity": 0,
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            ["case", [">", ["get", "potential_mw"], 100], 6, 4],
            10,
            ["case", [">", ["get", "potential_mw"], 100], 12, 8],
          ],
          "circle-stroke-color": dark
            ? LAYERS.awarded.strokeDark
            : LAYERS.awarded.stroke,
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 1.5, 10, 2.5],
          "circle-stroke-opacity": 0.9,
        },
      });
      const popup = tooltipRef.current;
      map.on("mouseenter", "awarded", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features[0];
        const p = f.properties;
        const approx =
          p.geocode_status === "centroid_province"
            ? " · province approx."
            : p.geocode_status === "centroid_municipality"
              ? " · approx. location"
              : "";
        popup
          .setLngLat(f.geometry.coordinates)
          .setHTML(
            `<strong>${p.name}</strong><br/>${p.company || ""}<br/>${p.stage} · ${p.potential_mw ?? "?"} MW${approx}`
          )
          .addTo(map);
      });
      map.on("mouseleave", "awarded", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    }

    for (const cfg of SENSITIVE_SOURCES) {
      if (map.getSource(cfg.id)) continue;
      fetch(cfg.file)
        .then((r) => r.json())
        .then((fc) => {
          if (map.getSource(cfg.id) || !map.getStyle()) return;
          map.addSource(cfg.id, { type: "geojson", data: fc });
          if (cfg.type === "polygon") {
            map.addLayer({
              id: cfg.id,
              type: "fill",
              source: cfg.id,
              paint: { "fill-color": layerColor(cfg.id, dark), "fill-opacity": 0.12 },
            });
            map.addLayer({
              id: `${cfg.id}-outline`,
              type: "line",
              source: cfg.id,
              paint: {
                "line-color": layerColor(cfg.id, dark),
                "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.6, 10, 1.6],
                "line-opacity": 0.7,
              },
            });
          } else {
            map.addLayer({
              id: cfg.id,
              type: "circle",
              source: cfg.id,
              paint: {
                "circle-color": layerColor(cfg.id, dark),
                "circle-opacity": 0.7,
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 2, 10, 5],
              },
            });
          }
          if (!visible[cfg.id] && map.getLayer(cfg.id)) {
            map.setLayoutProperty(cfg.id, "visibility", "none");
            if (map.getLayer(`${cfg.id}-outline`))
              map.setLayoutProperty(`${cfg.id}-outline`, "visibility", "none");
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, plants, overlaps, awarded, styleEpoch]);

  // ---- repaint theme-dependent paint properties ----
  // Layers are only *added* once, so toggling light/dark must re-apply every
  // theme-dependent color: plant halos, the awarded ring, and all sensitive
  // layer fills/outlines/dots. Runs after the new style finishes loading.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const halo = dark ? HALO.dark : HALO.light;
    if (map.getLayer("plants")) {
      map.setPaintProperty("plants", "circle-stroke-color", [
        "case",
        ["==", ["get", "flagged"], true],
        FLAG_COLOR,
        halo,
      ]);
    }
    if (map.getLayer("awarded")) {
      map.setPaintProperty(
        "awarded",
        "circle-stroke-color",
        dark ? LAYERS.awarded.strokeDark : LAYERS.awarded.stroke
      );
    }
    for (const cfg of SENSITIVE_SOURCES) {
      const c = layerColor(cfg.id, dark);
      if (map.getLayer(cfg.id)) {
        map.setPaintProperty(cfg.id, cfg.type === "polygon" ? "fill-color" : "circle-color", c);
      }
      if (map.getLayer(`${cfg.id}-outline`)) {
        map.setPaintProperty(`${cfg.id}-outline`, "line-color", c);
      }
    }
  }, [dark, ready, styleEpoch]);

  // ---- filtering ----
  const filteredIdx = useMemo(() => {
    if (!plants) return new Set();
    const q = filters.query.trim().toLowerCase();
    const set = new Set();
    plants.forEach((f, i) => {
      const p = f.properties;
      if (filters.fuel !== "all" && p.fuel !== filters.fuel) return;
      if (filters.status !== "all" && p.status !== filters.status) return;
      if (filters.island !== "all" && p.island !== filters.island) return;
      if (q) {
        const hay = `${p.name} ${p.province || ""} ${p.municipality || ""}`.toLowerCase();
        if (!hay.includes(q)) return;
      }
      set.add(i);
    });
    return set;
  }, [plants, filters]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("plants")) return;
    const filt = ["in", ["get", "idx"], ["literal", [...filteredIdx]]];
    map.setFilter("plants", filteredIdx.size ? filt : ["==", ["get", "idx"], -1]);
    map.setFilter("plants-halo", filteredIdx.size ? filt : ["==", ["get", "idx"], -1]);
  }, [filteredIdx, styleEpoch]);

  // ---- layer visibility ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const id of Object.keys(visible)) {
      if (id === "ancestral_domains" || id === "municipal_waters") continue; // pending layers: no data yet
      const vis = visible[id] ? "visible" : "none";
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
      if (map.getLayer(`${id}-outline`))
        map.setLayoutProperty(`${id}-outline`, "visibility", vis);
    }
  }, [visible, styleEpoch]);

  // ---- sync filters to URL ----
  useEffect(() => {
    const url = new URL(window.location);
    const setP = (k, v) => {
      if (v && v !== "all" && v !== "") url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    };
    setP("q", filters.query);
    setP("fuel", filters.fuel);
    setP("status", filters.status);
    setP("island", filters.island);
    window.history.replaceState({}, "", url);
  }, [filters]);

  // ---- fly to selected ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !plants) return;
    const url = new URL(window.location);
    if (selected == null) url.searchParams.delete("plant");
    else url.searchParams.set("plant", String(selected));
    window.history.replaceState({}, "", url);
    if (selected == null) return;
    const f = plants[selected];
    if (f?.geometry) {
      map.flyTo({
        center: f.geometry.coordinates,
        zoom: Math.max(map.getZoom(), 8.5),
        speed: 0.9,
      });
    }
  }, [selected, plants]);

  // ---- resize hooks ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);
    const t = setTimeout(onResize, 260);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, [sideOpen, dark]);

  const flaggedSet = useMemo(
    () => new Set(Object.keys(overlaps || {}).map(Number)),
    [overlaps]
  );

  const layerCounts = useMemo(() => {
    const counts = { plants: plants ? plants.filter((f) => f.geometry).length : 0 };
    if (awardedStats) counts.awarded = awardedStats.mapped;
    const fromOverlaps = (layer) =>
      overlaps
        ? new Set(
            Object.values(overlaps)
              .flat()
              .filter((h) => h.layer === layer)
              .map((h) => h.i)
          ).size
        : null;
    counts.protected_areas = fromOverlaps("protected_areas");
    counts.kba = fromOverlaps("kba");
    counts.mpa = fromOverlaps("mpa");
    counts.land_deals = fromOverlaps("land_deals");
    counts.land_deal_sites = fromOverlaps("land_deal_sites");
    return counts;
  }, [plants, overlaps, awardedStats]);

  return (
    <div className="app-shell">
      <Sidebar
        className={sideOpen ? undefined : "hidden-side"}
        dark={dark}
        setDark={setDark}
        visible={visible}
        setVisible={setVisible}
        filters={filters}
        setFilters={setFilters}
        plants={plants}
        filteredIdx={filteredIdx}
        flaggedSet={flaggedSet}
        layerCounts={layerCounts}
        awardedStats={awardedStats}
        onShowList={() => setShowList(true)}
      />
      <main className="map-wrap">
        <button
          className="sidebar-toggle"
          onClick={() => setSideOpen((v) => !v)}
          title={sideOpen ? "Hide panel" : "Show panel"}
        >
          {sideOpen ? "◀" : "☰"}
        </button>
        <div ref={mapContainer} className="map" />
        <button
          className="btn analysis-launch"
          aria-haspopup="dialog"
          onClick={() => {
            setShowList(false);
            setShowAnalysis(true);
          }}
        >
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 3v14h14M7 13V9m4 4V5m4 8V7" />
          </svg>
          Analysis
        </button>
        <HelpNote />
        <DetailPanel
          plant={selected != null && plants ? plants[selected] : null}
          selected={selected}
          overlaps={overlaps}
          onClose={() => setSelected(null)}
          dark={dark}
        />
        {showList && (
          <OverlapsList
            plants={plants}
            overlaps={overlaps}
            filteredIdx={filteredIdx}
            onSelect={(i) => {
              setSelected(i);
              setShowList(false);
            }}
            onClose={() => setShowList(false)}
          />
        )}
      </main>
      {showAnalysis && (
        <AnalysisModal
          plants={plants}
          overlaps={overlaps}
          awarded={awarded}
          filteredIdx={filteredIdx}
          filters={filters}
          dark={dark}
          dataError={dataError}
          onClose={() => setShowAnalysis(false)}
          onSelect={(i) => {
            setSelected(i);
            setShowAnalysis(false);
          }}
        />
      )}
    </div>
  );
}
