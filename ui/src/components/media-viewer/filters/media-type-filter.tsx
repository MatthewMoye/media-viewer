import { useMediaViewer } from "../context/use-media-viewer";

const VIEW_MODES = ["all", "image", "video"] as const;

const VIEW_MODE_LABELS = {
  all: "Images + Videos",
  image: "Images only",
  video: "Videos only",
};

export const MediaTypeFilter = () => {
  const { viewMode, setViewMode } = useMediaViewer();

  return (
    <fieldset>
      <legend className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted">
        Media type
      </legend>

      <div className="flex flex-wrap gap-2">
        {VIEW_MODES.map((mode) => {
          const selected = viewMode === mode;

          return (
            <button
              key={mode}
              type="button"
              aria-pressed={selected}
              onClick={() => setViewMode(mode)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selected
                  ? "bg-accent text-primary shadow-lg shadow-accent"
                  : "border border-surface bg-surface-strong text-primary hover:border-accent"
              }`}
            >
              {VIEW_MODE_LABELS[mode]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};
