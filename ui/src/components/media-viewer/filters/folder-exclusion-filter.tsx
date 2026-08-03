import { useMediaViewer } from "../context/use-media-viewer";

export const FolderExclusionFilter = () => {
  const { folders, excludedParentFolders, toggleExcludedParentFolder } = useMediaViewer();

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted">
        Hide folders
      </legend>
      {folders.length === 0 ? (
        <p className="text-sm text-muted">No folders available.</p>
      ) : (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-surface bg-surface-90 p-2">
          <div className="grid gap-1 sm:grid-cols-2">
            {folders.map((folder) => (
              <FolderExclusionOption
                key={folder}
                folder={folder}
                excluded={excludedParentFolders.includes(folder)}
                onToggle={() => toggleExcludedParentFolder(folder)}
              />
            ))}
          </div>
        </div>
      )}
    </fieldset>
  );
};

type FolderExclusionOptionProps = {
  folder: string;
  excluded: boolean;
  onToggle: () => void;
};

const FolderExclusionOption = ({ folder, excluded, onToggle }: FolderExclusionOptionProps) => {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        excluded
          ? "bg-surface-strong text-primary"
          : "text-muted hover:bg-surface-strong hover:text-primary"
      }`}
    >
      <input
        type="checkbox"
        checked={excluded}
        onChange={onToggle}
        className="h-4 w-4 rounded border-surface accent-current"
      />

      <span className="min-w-0 flex-1 truncate">{folder}</span>

      {excluded && <span className="text-xs text-muted">Hidden</span>}
    </label>
  );
};
