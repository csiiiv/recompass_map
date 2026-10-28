import { useState } from "react";

export default function HelpNote() {
  const [open, setOpen] = useState(false);
  return (
    <div className="help-note">
      <button className="link-btn" onClick={() => setOpen(!open)}>
        {open ? "hide how to read this map" : "how to read this map"}
      </button>
      {open && (
        <div className="help-card">
          <p>
            <strong>Points</strong> are power plants — size by capacity, color by
            technology (legend in sidebar). A{" "}
            <span className="flag-text">red ring</span> means the plant sits
            inside or within 5 km of a protected area, Key Biodiversity Area,
            marine protected area, or large-scale land deal.
          </p>
          <p>
            <strong>Polygons</strong> are sensitive layers you can toggle:
            protected areas (green), KBAs (lime), land deals (purple), MPAs
            (cyan points). Click any plant for details and its overlap list.
          </p>
          <p>
            Data: DOE power plant inventory (grid + SPUG), WDPA Oct 2026, KBA
            2025, MSI MPAs, Land Matrix. Municipal waters and ancestral domains
            pending. Overlap flags are screening signals, not judgments —
            always verify on the ground.
          </p>
        </div>
      )}
    </div>
  );
}
