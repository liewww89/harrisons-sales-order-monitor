import { HouseIcon } from "@phosphor-icons/react/dist/icons/House";
import { FilesIcon } from "@phosphor-icons/react/dist/icons/Files";
import { InfoIcon } from "@phosphor-icons/react/dist/icons/Info";

import type { View } from "../navigation";

export function Navigation({ view }: { view: View }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <svg
          className="brand-mark"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 5v22M27 5v22M5 16h22"
            stroke="currentColor"
            strokeWidth="5"
          />
          <path d="M16 5v7m0 8v7" stroke="currentColor" strokeWidth="3" />
        </svg>
        <div>
          <span className="brand-name" translate="no">
            Harrisons Sabah
          </span>
          <span className="brand-subtitle">Sales operations</span>
        </div>
      </div>
      <p className="nav-label">Workspace</p>
      <nav className="workspace-nav" aria-label="Workspace" data-view={view}>
        <span className="nav-indicator" aria-hidden="true" />
        <a
          href="#overview"
          aria-current={view === "overview" ? "page" : undefined}
        >
          <HouseIcon size={21} aria-hidden="true" />
          Overview
        </a>
        <a href="#orders" aria-current={view === "orders" ? "page" : undefined}>
          <FilesIcon size={21} aria-hidden="true" />
          Sales orders
        </a>
      </nav>
      <div className="readonly-note">
        <InfoIcon size={23} aria-hidden="true" />
        <div>
          <strong>Read-only workspace</strong>
          <p>
            Assessment data only.
            <br />
            No changes can be made.
          </p>
        </div>
      </div>
    </aside>
  );
}
