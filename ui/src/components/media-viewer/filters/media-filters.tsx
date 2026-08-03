import { useState } from "react";
import { useMediaViewer } from "../context/use-media-viewer";
import { FilterPanel } from "./filter-panel";
import { FilterToggle } from "../../common/filter-toggle";
import { SearchFilter } from "./search-filter";

const PANEL_ID = "media-filter-panel";

export const MediaFilters = () => {
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const { activeFilterCount, clearAllFilters } = useMediaViewer();

  const toggleFilters = () => {
    setFiltersExpanded((currentValue) => !currentValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchFilter />
        <FilterToggle
          expanded={filtersExpanded}
          activeFilterCount={activeFilterCount}
          panelId={PANEL_ID}
          onToggle={toggleFilters}
          onClear={clearAllFilters}
        />
      </div>
      <FilterPanel expanded={filtersExpanded} />
    </div>
  );
};
