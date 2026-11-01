import { useEffect, useRef } from "react";
import { resolveInfo } from "./infoContent.js";

/**
 * Compact explainer for sidebar ⓘ buttons (layers + sections).
 * Content comes from infoContent.js — add keys there for new datasets.
 */
export default function InfoModal({ topic, onClose }) {
  const dialogRef = useRef(null);
  const info = resolveInfo(topic);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (topic && info) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [topic, info]);

  if (!topic || !info) return null;

  return (
    <dialog
      ref={dialogRef}
      className="info-dialog"
      aria-labelledby="info-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="info-dialog-shell">
        <header className="info-dialog-header">
          <div>
            <span className="info-dialog-eyebrow">
              {topic.kind === "layer" ? "Layer" : "Sidebar"}
            </span>
            <h2 id="info-dialog-title">{info.title}</h2>
          </div>
          <button
            type="button"
            className="btn ghost"
            onClick={onClose}
            aria-label="Close"
          >
            Close <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="info-dialog-body">
          <p className="info-dialog-summary">{info.summary}</p>
          {info.bullets?.length > 0 && (
            <ul className="info-dialog-bullets">
              {info.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          {info.meta?.length > 0 && (
            <dl className="info-dialog-meta">
              {info.meta.map((m) => (
                <div key={m.label} className="info-dialog-meta-row">
                  <dt>{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </dialog>
  );
}

/** Small ⓘ control — call with onOpen({ kind, id }). */
export function InfoButton({ label, onOpen, topic }) {
  return (
    <button
      type="button"
      className="info-btn"
      title={`About ${label}`}
      aria-label={`About ${label}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen(topic);
      }}
    >
      <span aria-hidden="true">ⓘ</span>
    </button>
  );
}
