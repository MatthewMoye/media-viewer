type FilterToggleProps = {
  expanded: boolean;
  activeFilterCount: number;
  panelId?: string;
  onToggle: () => void;
  onClear: () => void;
};

export const FilterToggle = ({
  expanded,
  activeFilterCount,
  panelId,
  onToggle,
  onClear,
}: FilterToggleProps) => {
  const filtersAreActive = activeFilterCount > 0;

  return (
    <div
      className={`inline-flex overflow-hidden rounded-2xl border transition ${
        expanded || filtersAreActive
          ? "border-accent bg-surface-strong"
          : "border-surface bg-surface-80 hover:border-accent"
      }`}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M4 6h16M7 12h10M10 18h4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
        <span>Filters</span>
        {filtersAreActive && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
            {activeFilterCount}
          </span>
        )}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <path
            d="m7 10 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {filtersAreActive && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Reset filters"
          title="Reset filters"
          className="flex w-16 items-center justify-center border-l border-accent text-muted transition hover:bg-accent hover:text-primary"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M5 8v4h4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6.5 16.5a7 7 0 1 0-.5-8"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
