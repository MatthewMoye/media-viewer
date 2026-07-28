import { useComicViewer } from "../context/use-comic-viewer";
import { FilterToggle } from "../../common/filter-toggle";
import { ComicSearchFilter } from "./comic-search-filter";
import { ComicFilterPanel, COMIC_FILTER_PANEL_ID } from "./comic-filter-panel";

export const ComicFilters = () => {
  const { filtersExpanded, setFiltersExpanded, activeFilterCount, clearFilters } =
    useComicViewer();

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ComicSearchFilter />
        <FilterToggle
          expanded={filtersExpanded}
          activeFilterCount={activeFilterCount}
          panelId={COMIC_FILTER_PANEL_ID}
          onToggle={() => setFiltersExpanded((v) => !v)}
          onClear={clearFilters}
        />
      </div>
      <ComicFilterPanel />
    </div>
  );
};
