import { useEffect, useMemo, useState } from "react";
import {
  INTENTIONS,
  NEGOTIATION,
  IMPLEMENTATION,
  NATURE,
  SOURCE_TYPES,
} from "./constants.js";

function Row({ k, v }) {
  if (v == null || v === "") return null;
  return (
    <div className="detail-row">
      <span className="detail-k">{k}</span>
      <span className="detail-v">{v}</span>
    </div>
  );
}

const fmtHa = (ha) =>
  ha == null
    ? null
    : `${Number(ha).toLocaleString("en-US", { maximumFractionDigits: 1 })} ha`;

const lmUrl = (id) => `https://landmatrix.org/deal/${id}/`;

/**
 * Detail popup for Land Matrix deal features (polygons and site points).
 * Loads land_deal_info.json lazily on first render and shows company,
 * intention, sizes, status, contracts, and data sources per deal.
 */
export default function DealPopup({ dealId, onClose }) {
  const [info, setInfo] = useState(null);
  const [failed, setFailed] = useState(false);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("./dealInfoStore.js")
      .then((m) => m.getDealInfo())
      .then((d) => {
        if (!cancelled) setInfo(d);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const deal = useMemo(
    () => info?.[String(dealId)] ?? null,
    [info, dealId]
  );

  if (failed) return null;

  return (
    <div className="deal-popup">
      <button className="close-btn" onClick={onClose} title="Close">
        ✕
      </button>
      <h2>
        {deal?.project || deal?.company || `Land Matrix deal #${dealId}`}
      </h2>
      <div className="detail-chips">
        {(deal?.intention || []).slice(0, 4).map((i) => (
          <span className="chip" key={i}>
            {INTENTIONS[i] || i}
          </span>
        ))}
      </div>

      {!deal ? (
        <div className="deal-loading">Loading deal details…</div>
      ) : (
        <>
          <div className="detail-section">
            <Row k="Operating company" v={deal.company} />
            <Row
              k="Investors"
              v={deal.investors.length ? deal.investors.join(", ") : null}
            />
            <Row k="Deal size" v={fmtHa(deal.size_ha)} />
            <Row k="Initiation year" v={deal.year} />
            <Row k="Negotiation status" v={NEGOTIATION[deal.negotiation] || deal.negotiation} />
            <Row
              k="Implementation"
              v={IMPLEMENTATION[deal.implementation] || deal.implementation}
            />
            <Row
              k="Nature of deal"
              v={deal.nature.length
                ? deal.nature.map((n) => NATURE[n] || n).join(", ")
                : null}
            />
          </div>

          {deal.contracts.length > 0 && (
            <div className="detail-section">
              <h3>Contracts</h3>
              {deal.contracts.map(([number, date, expiry], i) => (
                <div className="deal-contract" key={i}>
                  <span>{number || "(untitled contract)"}</span>
                  <span className="hit-rel">
                    {date || "?"} → {expiry || "—"}
                  </span>
                </div>
      ))}
            </div>
          )}

          <div className="detail-section">
            <h3>Data sources ({deal.sources.length})</h3>
            {deal.sources.length === 0 && <p className="deal-muted">None listed</p>}
            {(showSources ? deal.sources : deal.sources.slice(0, 3)).map(
              ([type, title, url, date], i) => (
                <div className="deal-source" key={i}>
                  <span className="deal-source-type">
                    {SOURCE_TYPES[type] || type}
                  </span>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="deal-source-link"
                    >
                      {title || url}
                    </a>
                  ) : (
                    <span className="deal-source-title">{title || "(untitled)"}</span>
                  )}
                  {date && <span className="deal-source-date">{date}</span>}
                </div>
              )
            )}
            {deal.sources.length > 3 && (
              <button
                className="deal-more"
                onClick={() => setShowSources((v) => !v)}
              >
                {showSources
                  ? "Show fewer"
                  : `Show all ${deal.sources.length} sources`}
              </button>
            )}
          </div>

          <a
            className="deal-lm-link"
            href={lmUrl(dealId)}
            target="_blank"
            rel="noreferrer noopener"
          >
            View deal #{dealId} on Land Matrix ↗
          </a>
        </>
      )}
    </div>
  );
}
