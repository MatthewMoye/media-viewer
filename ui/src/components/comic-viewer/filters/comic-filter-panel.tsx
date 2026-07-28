import { RandomizeButton } from "../../common/randomize-button";
import { useComicViewer } from "../context/use-comic-viewer";
import { AuthorFilter } from "./author-filter";
import { TagFilter } from "./tag-filter";

const PANEL_ID = "comic-filter-panel";

export const ComicFilterPanel = () => {
  const { filtersExpanded, shuffleComics } = useComicViewer();

  return (
    <div
      id={PANEL_ID}
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
        filtersExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <div className="rounded-2xl border border-surface bg-surface-80 p-4 sm:p-5">
          <div className="space-y-6">
            <legend className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Order
            </legend>
            <div className="flex flex-wrap gap-2">
              <RandomizeButton onClick={shuffleComics} />
            </div>
            <AuthorFilter />
            <TagFilter />
          </div>
        </div>
      </div>
    </div>
  );
};

export { PANEL_ID as COMIC_FILTER_PANEL_ID };
