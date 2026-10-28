import { useEffect, useMemo, useRef, useState } from "react";
import { fuelColor, ISLAND_OPTIONS, LAYERS, layerColor } from "./constants.js";
import {
  downloadAnalysisCSV, groupPlants, layerSummary, number, percent,
  plantRows, solarSummary, summarize,
} from "./analysis.js";
import "./analysis.css";

const TABS = [
  { id: "home", label: "Home" },
  { id: "mix", label: "Energy mix" },
  { id: "sensitive", label: "Sensitive areas" },
  { id: "solar", label: "Solar pipeline" },
  { id: "methods", label: "Data & methods" },
];

function Metric({ label, value, note }) {
  return <div className="analysis-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function Card({ title, subtitle, children, action }) {
  return (
    <section className="analysis-card">
      <div className="analysis-card-heading"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
      {children}
    </section>
  );
}

function Bars({ rows, valueKey = "count", label = "Plants", color }) {
  const max = Math.max(1, ...rows.map((row) => row[valueKey]));
  return (
    <ul className="analysis-bars" aria-label={label}>
      {rows.map((row) => (
        <li key={row.name}>
          <div><span>{row.name}</span><strong>{number(row[valueKey])}{valueKey === "mw" || valueKey === "potential" ? " MW" : ""}</strong></div>
          <div className="analysis-track" aria-hidden="true"><span style={{ width: `${row[valueKey] / max * 100}%`, background: color?.(row.name) || "var(--accent)" }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Home({ stats, technologies, provinces, onTab }) {
  const topProvince = [...provinces].sort((a, b) => b.flagged - a.flagged || b.count - a.count)[0];
  return (
    <>
      <div className="analysis-intro"><span className="analysis-eyebrow">A starting point for better questions</span><h3>Where should we look more closely?</h3><p>Explore the energy inventory, see where projects meet sensitive areas, and prepare place-based conversations with communities and agencies.</p></div>
      <div className="analysis-metrics">
        <Metric label="Plants in this view" value={number(stats.count)} note={`${number(stats.mapped)} with a mapped location`} />
        <Metric label="Reported capacity" value={`${number(stats.mw)} MW`} note="Across all stages in this view" />
        <Metric label="Plants with a flag" value={number(stats.flagged)} note={`${percent(stats.flagged, stats.count)} of plants in this view`} />
        <Metric label="Multiple sensitive layers" value={number(stats.multiLayer)} note="Unique plants near two or more layers" />
      </div>
      <div className="analysis-grid">
        <Card title="What stands out in this view" subtitle="Calculated from the loaded inventory and screening results.">
          <ul className="analysis-findings">
            <li><strong>{number(stats.inside)} plants have an inside-boundary flag.</strong> Another {number(stats.nearOnly)} are flagged only by proximity within 5 km.</li>
            <li>{topProvince?.flagged ? <><strong>{topProvince.name} is among the provinces with the most flagged plants in this view.</strong> {number(topProvince.flagged)} of {number(topProvince.count)} plants have at least one flag. Counts depend on inventory coverage.</> : <>No sensitive-area flags appear in this view. Missing layers and approximate locations still limit what can be concluded.</>}</li>
            <li><strong>{number(technologies.length)} technologies are represented.</strong> Compare project counts and reported capacity separately; a large number of small plants can tell a different story.</li>
          </ul>
        </Card>
        <Card title="Build a useful briefing" subtitle="Three ways to move from a national picture to specific questions.">
          <div className="analysis-paths">
            <button onClick={() => onTab("mix")}><strong>01 · Understand the energy mix <span>↗</span></strong><small>Compare technology, stage, and island group.</small></button>
            <button onClick={() => onTab("sensitive")}><strong>02 · Find places for closer review <span>↗</span></strong><small>Explore layers, provinces, and individual plants.</small></button>
            <button onClick={() => onTab("solar")}><strong>03 · Explore awarded solar contracts <span>↗</span></strong><small>Separate potential capacity from operating projects.</small></button>
          </div>
        </Card>
      </div>
    </>
  );
}

function EnergyMix({ rows, stats, metric, setMetric, scope }) {
  const technologies = groupPlants(rows, "fuel").sort((a, b) => b[metric] - a[metric]);
  return (
    <>
      <div className="analysis-section-heading"><div><h3>What is represented in the inventory?</h3><p>Project counts and reported MW answer different questions. This is a source inventory, not a complete national energy balance.</p></div><label className="analysis-field">Compare by<select value={metric} onChange={(e) => setMetric(e.target.value)}><option value="count">Plant count</option><option value="mw">Reported capacity (MW)</option></select></label></div>
      <div className="analysis-grid">
        <Card title="Technology mix" subtitle={metric === "count" ? "Number of plants, regardless of size." : "Sum of reported capacity across the selected stages."}><Bars rows={technologies} valueKey={metric} color={fuelColor} /></Card>
        <div className="analysis-stack">
          <Card title="Project stages" subtitle="Mixed Operational / Committed records remain a separate category."><Bars rows={groupPlants(rows, "status")} valueKey={metric} /></Card>
          <Card title="Island groups"><Bars rows={groupPlants(rows, "island")} valueKey={metric} /></Card>
        </div>
      </div>
      <Card title="Technology detail" action={<button className="btn ghost" onClick={() => downloadAnalysisCSV("re_compass_energy_mix.csv", ["Technology", "Plants", "Reported capacity MW", "Flagged plants", "Plants without positive capacity"], technologies.map((r) => [r.name, r.count, r.mw, r.flagged, r.missingMW]), scope)}>Download CSV</button>}>
        <div className="analysis-table-wrap"><table className="analysis-table"><thead><tr><th>Technology</th><th>Plants</th><th>Reported MW</th><th>Plants with a flag</th><th>Flagged share</th></tr></thead><tbody>{technologies.map((r) => <tr key={r.name}><th scope="row"><span className="dot" style={{ background: fuelColor(r.name) }} /> {r.name}</th><td>{number(r.count)}</td><td>{number(r.mw)}</td><td>{number(r.flagged)}</td><td>{percent(r.flagged, r.count)}</td></tr>)}</tbody></table></div>
      </Card>
      <p className="analysis-note">Source: DOE inventory via WeSolve, 2026 (grid + SPUG). MW is capacity, not electricity generation. {number(stats.missingMW)} records in this view have no positive reported capacity; they remain in plant counts and contribute no MW. BESS is storage and appears separately from renewable generation.</p>
    </>
  );
}

function SensitiveAreas({ rows, stats, provinces, scope, onSelect, dark }) {
  const [province, setProvince] = useState("all");
  const activeProvince = provinces.some((row) => row.name === province) ? province : "all";
  const ranking = [...provinces].sort((a, b) => b.flagged - a.flagged || b.count - a.count || a.name.localeCompare(b.name));
  const shortlist = rows.filter((row) => row.flagged && (activeProvince === "all" || (row.province || "Not reported") === activeProvince))
    .sort((a, b) => b.layers.length - a.layers.length || a.name.localeCompare(b.name));
  return (
    <>
      <div className="analysis-section-heading"><div><h3>Where do plants meet sensitive areas?</h3><p>All four available layers are considered, including layers hidden on the map. Each plant is counted once per layer.</p></div></div>
      <div className="analysis-metrics">
        <Metric label="Inside a boundary" value={number(stats.inside)} note="At least one polygon contains the plant point" />
        <Metric label="Proximity flags only" value={number(stats.nearOnly)} note="Within 5 km, with no inside-boundary flag" />
        <Metric label="No recorded flag" value={number(stats.unflagged)} note="Does not establish absence of impact" />
        <Metric label="Multiple layers" value={number(stats.multiLayer)} note="Layers may describe the same sensitive place" />
      </div>
      <Card title="Screening by sensitive layer" subtitle="Inside and proximity-only counts are mutually exclusive within each row. Plants can appear in several rows.">
        <div className="analysis-table-wrap"><table className="analysis-table"><thead><tr><th>Layer</th><th>Inside</th><th>Proximity only</th><th>Unique plants</th><th>Share of view</th></tr></thead><tbody>{layerSummary(rows).map((r) => <tr key={r.id}><th scope="row"><span className="dot" style={{ background: layerColor(r.id, dark) }} /> {LAYERS[r.id].label}</th><td>{number(r.inside)}</td><td>{number(r.nearOnly)}</td><td>{number(r.count)}</td><td>{percent(r.count, stats.count)}</td></tr>)}</tbody></table></div>
      </Card>
      <Card title="Provinces for closer review" subtitle="Top 10 by flagged plant count. Counts reflect the inventory, not province-wide risk or impact." action={<button className="btn ghost" onClick={() => downloadAnalysisCSV("re_compass_province_screening.csv", ["Province", "Plants", "Flagged plants", "Inside", "Proximity only", "Multiple layers"], ranking.map((r) => [r.name, r.count, r.flagged, r.inside, r.nearOnly, r.multiLayer]), scope)}>Download all provinces</button>}>
        <div className="analysis-table-wrap"><table className="analysis-table"><thead><tr><th>Province</th><th>Plants</th><th>Flagged</th><th>Flagged share</th><th>Multiple layers</th></tr></thead><tbody>{ranking.slice(0, 10).map((r) => <tr key={r.name}><th scope="row"><button className="analysis-text-btn" onClick={() => setProvince(r.name)}>{r.name}</button></th><td>{number(r.count)}</td><td>{number(r.flagged)}</td><td>{percent(r.flagged, r.count)}</td><td>{number(r.multiLayer)}</td></tr>)}</tbody></table></div>
      </Card>
      <Card title="Plants to explore on the map" subtitle="Ordered by number of distinct layers, then name. This is a review list, not a risk ranking." action={<label className="analysis-field">Province<select value={activeProvince} onChange={(e) => setProvince(e.target.value)}><option value="all">All provinces in this view</option>{[...provinces].sort((a, b) => a.name.localeCompare(b.name)).map((r) => <option key={r.name}>{r.name}</option>)}</select></label>}>
        {shortlist.length ? <div className="analysis-table-wrap analysis-review-table"><table className="analysis-table"><thead><tr><th>Plant</th><th>Location</th><th>Stage</th><th>Sensitive layers</th><th>Map</th></tr></thead><tbody>{shortlist.map((r) => <tr key={r.idx}><th scope="row">{r.name}<small>{r.fuel}</small></th><td>{[r.municipality, r.province].filter(Boolean).join(", ")}</td><td>{r.status}</td><td>{r.layers.map((id) => LAYERS[id]?.label || id).join(" · ")}</td><td><button className="analysis-text-btn" onClick={() => onSelect(r.idx)} aria-label={`View ${r.name} on map`}>View ↗</button></td></tr>)}</tbody></table></div> : <p className="analysis-note">No flagged plants in this province for the selected scope.</p>}
      </Card>
      <p className="analysis-note">Sources: WDPA Oct 2026; KBAs 2025; UP-MSI MPAs 2013; Land Matrix 2026. MPAs and point-only WDPA entries use proximity, not boundaries. Land Matrix flags refer to deal areas, not project footprints or documented conflict.</p>
    </>
  );
}

function SolarPipeline({ awarded }) {
  const [island, setIsland] = useState("all");
  const solar = useMemo(() => solarSummary(awarded, island), [awarded, island]);
  const scope = `Awarded solar contracts; island=${island}; includes unmapped records; DOE 31 May 2026`;
  return (
    <>
      <div className="analysis-section-heading"><div><h3>What does the awarded solar register show?</h3><p>DOE solar service contracts as of 31 May 2026. This tab uses its own island filter and includes unmapped records; map filters do not apply.</p></div><label className="analysis-field">Island group<select value={island} onChange={(e) => setIsland(e.target.value)}><option value="all">All island groups</option>{ISLAND_OPTIONS.map((name) => <option key={name}>{name}</option>)}</select></label></div>
      <div className="analysis-metrics">
        <Metric label="Awarded solar contracts" value={number(solar.count)} note="Including commercial operation records" />
        <Metric label="Reported potential" value={`${number(solar.potential / 1000)} GW`} note="All stages; not an installed-capacity total" />
        <Metric label="Non-commercial potential" value={`${number(solar.nonCommercial.potential / 1000)} GW`} note={`${number(solar.nonCommercial.count)} contracts outside commercial operation`} />
        <Metric label="Records placed on map" value={percent(solar.municipality + solar.province, solar.count)} note={`${number(solar.unmapped)} have no location estimate`} />
      </div>
      <div className="analysis-grid">
        <Card title="Potential by stage" subtitle="Potential MW is not a forecast of completion.">
          <Bars rows={solar.stages} valueKey="potential" />
          <div className="analysis-table-wrap analysis-stage-table"><table className="analysis-table"><thead><tr><th>Stage</th><th>Contracts</th><th>Installed MW</th></tr></thead><tbody>{solar.stages.map((r) => <tr key={r.name}><th scope="row">{r.name}</th><td>{number(r.count)}</td><td>{number(r.installed)}</td></tr>)}</tbody></table></div>
        </Card>
        <Card title="Location confidence" subtitle="Centroids are estimates from inventory locations, not surveyed project sites.">
          <Bars rows={[{ name: "Municipality centroid", count: solar.municipality }, { name: "Province centroid", count: solar.province }, { name: "Unmapped", count: solar.unmapped }]} />
          <p className="analysis-note">No sensitive-area screening is calculated for awarded contracts. Coincident centroid markers do not establish a physical project cluster.</p>
        </Card>
      </div>
      <Card title="Where reported solar potential is concentrated" subtitle="Top 10 province labels by reported potential MW; includes every stage and location-confidence level. Multi-province entries stay grouped." action={<button className="btn ghost" onClick={() => downloadAnalysisCSV("re_compass_awarded_solar.csv", ["Province (source label)", "Contracts", "Reported potential MW", "Records without positive potential"], solar.provinces.map((r) => [r.name, r.count, r.potential, r.missingPotential]), scope)}>Download all provinces</button>}>
        <div className="analysis-table-wrap"><table className="analysis-table"><thead><tr><th>Province</th><th>Contracts</th><th>Potential MW</th><th>Share of potential</th></tr></thead><tbody>{solar.provinces.slice(0, 10).map((r) => <tr key={r.name}><th scope="row">{r.name}</th><td>{number(r.count)}</td><td>{number(r.potential)}</td><td>{percent(r.potential, solar.potential)}</td></tr>)}</tbody></table></div>
      </Card>
      <p className="analysis-note">{number(solar.missingPotential)} records in this view have no positive reported potential and contribute no MW. Potential and installed MW are distinct source fields. Do not add these contracts to inventory totals: the two sources may contain the same projects. The full extracted register reconciles to about 99.97% of the PDF's 31,584.26 MW total. Multi-province source labels are kept together, without allocating MW to individual provinces.</p>
    </>
  );
}

function Methods() {
  return (
    <>
      <div className="analysis-section-heading"><div><h3>Know what the numbers can support</h3><p>These views support briefing and early areas-of-interest scanning, as described in the inception report and build brief.</p></div></div>
      <div className="analysis-grid">
        <Card title="How we count"><ul className="analysis-findings">
          <li><strong>Inventory scope.</strong> Current map filters means the sidebar search, technology, stage, and island filters. Map extent and layer toggles do not change the analysis. Renewables only includes solar, wind, hydro, geothermal, and biomass.</li>
          <li><strong>Flags.</strong> A plant point is inside a sensitive polygon or within approximately 5 km of a boundary or point. A plant with several hits is counted once in totals, once per layer, and once per province.</li>
          <li><strong>Inside takes precedence.</strong> A plant with an inside flag and a proximity flag is counted as inside in the overall split. Proximity-only means no inside flag.</li>
          <li><strong>Capacity.</strong> Sum of positive reported MW, including whichever stages are selected. Missing and zero values contribute no MW. These figures do not measure generation, energy access, or completion probability.</li>
        </ul></Card>
        <Card title="Recommended next additions"><ol className="analysis-findings">
          <li><strong>Improve location confidence.</strong> Add official PSGC municipality boundaries and verified project coordinates before attempting pipeline overlap analysis.</li>
          <li><strong>Complete the social and coastal picture.</strong> Add NCIP ancestral domains and municipal waters when available, then refresh screening results.</li>
          <li><strong>Update and validate sensitive layers.</strong> Refresh the 2013 MPA data and check priority places with partners and local communities.</li>
          <li><strong>Add change over time after snapshots exist.</strong> Track new contracts and stage changes once dated, comparable releases are available.</li>
        </ol></Card>
      </div>
      <Card title="Sources and interpretation">
        <div className="analysis-table-wrap"><table className="analysis-table"><thead><tr><th>Dataset</th><th>Source / vintage</th><th>Use and limits</th></tr></thead><tbody>
          <tr><th scope="row">Power plant inventory</th><td>DOE via WeSolve · 2026</td><td>Grid and SPUG inventory, including fossil fuels and BESS. Source-reported locations may be approximate; coverage is not a national census.</td></tr>
          <tr><th scope="row">Awarded solar contracts</th><td>DOE · 31 May 2026</td><td>Solar only. Includes commercial operation. Estimated centroids; unmapped records remain in aggregates.</td></tr>
          <tr><th scope="row">Protected areas</th><td>Protected Planet / UNEP-WCMC · Oct 2026</td><td>WDPA/WDOECM polygons and points. Point entries support proximity checks only.</td></tr>
          <tr><th scope="row">Key Biodiversity Areas</th><td>KBA Partnership · 2025</td><td>Biodiversity context; can coincide with protected areas.</td></tr>
          <tr><th scope="row">Marine protected areas</th><td>UP-MSI · 2013</td><td>Pin locations; newer designations are missing.</td></tr>
          <tr><th scope="row">Large-scale land deals</th><td>Land Matrix · 2026 export</td><td>Claimed deal areas, not project footprints or proof of land conflict.</td></tr>
          <tr><th scope="row">Ancestral domains / municipal waters</th><td>NCIP / NAMRIA-BFAR via UP-MSI · pending</td><td>Unavailable. No conclusions about these boundaries or affected communities can be drawn.</td></tr>
        </tbody></table></div>
      </Card>
      <p className="analysis-note">Method: precomputed point-in-polygon and approximate boundary-distance checks on full-detail input geometries. Polygon processing, source locations, and the 5 km threshold limit precision. This is screening for follow-up, not a permit check, impact assessment, or risk rating.</p>
    </>
  );
}

export default function AnalysisModal({ plants, overlaps, awarded, filteredIdx, filters, dark, dataError, onClose, onSelect }) {
  const dialogRef = useRef(null);
  const contentRef = useRef(null);
  const [tab, setTab] = useState("home");
  const [followFilters, setFollowFilters] = useState(true);
  const [renewablesOnly, setRenewablesOnly] = useState(false);
  const [metric, setMetric] = useState("count");
  const loaded = Boolean(plants && overlaps && awarded);
  const rows = useMemo(() => plantRows(plants || [], overlaps || {}, followFilters ? filteredIdx : new Set((plants || []).map((_, i) => i)), renewablesOnly), [plants, overlaps, filteredIdx, followFilters, renewablesOnly]);
  const stats = useMemo(() => summarize(rows), [rows]);
  const provinces = useMemo(() => groupPlants(rows, "province"), [rows]);
  const plantTab = ["home", "mix", "sensitive"].includes(tab);
  const filterText = [filters.query && `Search: ${filters.query}`, filters.fuel !== "all" && filters.fuel, filters.status !== "all" && filters.status, filters.island !== "all" && filters.island].filter(Boolean).join(" · ");
  const scope = `${followFilters ? `Current map filters (${filterText || "no filters"})` : "All inventory plants"}${renewablesOnly ? "; renewables only" : "; all technologies"}; all sensitive layers; DOE inventory 2026`;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => { contentRef.current?.scrollTo(0, 0); }, [tab]);

  function tabKeys(event, index) {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    if (event.key === "ArrowLeft") next = (index + TABS.length - 1) % TABS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = TABS.length - 1;
    if (next == null) return;
    event.preventDefault();
    setTab(TABS[next].id);
    dialogRef.current.querySelector(`#analysis-tab-${TABS[next].id}`).focus();
  }

  return (
    <dialog className="analysis-dialog" ref={dialogRef} aria-labelledby="analysis-title" onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="analysis-shell">
        <header className="analysis-header"><div><span className="analysis-eyebrow">RE Compass · Philippines</span><h2 id="analysis-title">Analysis</h2><p>Explore patterns. Find places. Ask better questions.</p></div><button className="btn ghost" onClick={onClose} aria-label="Close analysis">Close <span aria-hidden="true">×</span></button></header>
        <div className="analysis-tabs" role="tablist" aria-label="Analysis views">{TABS.map((item, index) => <button key={item.id} id={`analysis-tab-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls="analysis-panel" tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={(e) => tabKeys(e, index)}>{item.label}</button>)}</div>
        {plantTab && <div className="analysis-scope"><label className="analysis-field">Inventory scope<select value={followFilters ? "filtered" : "all"} onChange={(e) => setFollowFilters(e.target.value === "filtered")}><option value="filtered">Current map filters</option><option value="all">All inventory plants</option></select></label><label className="analysis-checkbox"><input type="checkbox" checked={renewablesOnly} onChange={(e) => setRenewablesOnly(e.target.checked)} /> Renewables only</label><span>{followFilters ? filterText || "No map filters applied" : "Map filters set aside"} · {number(stats.count)} plants<br /><small>All sensitive layers · independent of map extent and visibility</small></span></div>}
        <div className="analysis-content" id="analysis-panel" role="tabpanel" aria-labelledby={`analysis-tab-${tab}`} tabIndex={0} ref={contentRef}>
          {dataError ? <div className="analysis-empty" role="alert"><h3>Analysis data could not be loaded</h3><p>Reload the page to try again.</p><button className="btn ghost" onClick={() => window.location.reload()}>Reload page</button></div> : !loaded ? <p className="analysis-empty" role="status">Loading analysis data…</p> : <>
            {plantTab && !rows.length ? <div className="analysis-empty"><h3>No plants match this scope</h3><p>Choose all inventory plants, turn off renewables only, or adjust your map filters.</p></div> : <>
              {tab === "home" && <Home stats={stats} technologies={groupPlants(rows, "fuel")} provinces={provinces} onTab={setTab} />}
              {tab === "mix" && <EnergyMix rows={rows} stats={stats} metric={metric} setMetric={setMetric} scope={scope} />}
              {tab === "sensitive" && <SensitiveAreas rows={rows} stats={stats} provinces={provinces} scope={scope} onSelect={onSelect} dark={dark} />}
            </>}
            {tab === "solar" && <SolarPipeline awarded={awarded} />}
            {tab === "methods" && <Methods />}
          </>}
        </div>
        <footer className="analysis-footer"><span aria-hidden="true">ⓘ</span> Flags are screening signals for further inquiry, not judgments about projects or communities.</footer>
      </div>
    </dialog>
  );
}
