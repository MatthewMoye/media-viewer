import { FolderExclusionFilter } from "./folder-exclusion-filter";
import { FolderSelectionFilter } from "./folder-selection-filter";
import { MediaTypeFilter } from "./media-type-filter";
import { RandomizeFilter } from "./randomize-filter";

type FilterPanelProps = {
  expanded: boolean;
};

export const FilterPanel = ({ expanded }: FilterPanelProps) => {
  return (
    <div
      id="media-filter-panel"
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <div className="rounded-2xl border border-surface bg-surface-80 p-4 sm:p-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <MediaTypeFilter />
            <RandomizeFilter />
            <div className="space-y-5 lg:col-span-2">
              <FolderSelectionFilter />
              <FolderExclusionFilter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
