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
            technology (legend in sidebar). Hollow rings are awarded RE service
            contracts — one ring per place; fuel-colored when single-tech, gray
            when mixed, with a count for stacks. A{" "}
            <span className="flag-text">red ring</span> on a plant means it sits
            inside or within 5 km of a protected area, confirmed Key Biodiversity
            Area, marine protected area, or large-scale land deal. Awarded
            contracts are not overlap-screened.
          </p>
          <p>
            <strong>Polygons</strong> are sensitive layers you can toggle:
            protected areas (green), confirmed KBAs (pink), Proposed KBAs
            (dashed, display-only), land deals (purple), MPAs (cyan points).
            Click a plant for its overlap list, or click a sensitive area /
            awarded ring / land deal for details. Sidebar ⓘ buttons explain
            each layer and the filters. Proposed KBAs do not flag plants.
          </p>
          <p>
            Data: DOE power plant inventory (grid + SPUG), WDPA Oct 2026, KBA
            Feb 2026 (confirmed + Proposed), MSI MPAs 2013, Land Matrix.
            Municipal waters and ancestral domains pending. Overlap flags are
            screening signals, not judgments — always verify on the ground.
          </p>
        </div>
      )}
    </div>
  );
}
