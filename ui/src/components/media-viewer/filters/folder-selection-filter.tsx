import { useMediaViewer } from "../context/use-media-viewer";

export const FolderSelectionFilter = () => {
  const { folders, includedParentFolder, setIncludedParentFolder } =
    useMediaViewer();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor="included-parent-folder"
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted"
        >
          Show only folder
        </label>
      </div>
      <div className="relative">
        <select
          id="included-parent-folder"
          value={includedParentFolder}
          onChange={(event) => setIncludedParentFolder(event.target.value)}
          className="w-full appearance-none rounded-xl border border-surface bg-surface-90 px-3 py-2.5 pr-11 text-sm text-primary outline-none transition focus:border-accent"
        >
          <option value="all">All folders</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        >
          <path
            d="M5.25 7.5L10 12.25L14.75 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
