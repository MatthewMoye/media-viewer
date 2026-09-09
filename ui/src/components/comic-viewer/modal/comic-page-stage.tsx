type ComicPageStageProps = {
  pages: string[];
  currentPage: number;
  loading: boolean;
  error: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  readingMode: "paged" | "strip";
  onPrev: () => void;
  onNext: () => void;
};

const ComicPageStage = ({
  pages,
  currentPage,
  loading,
  error,
  hasPrev,
  hasNext,
  readingMode,
  onPrev,
  onNext,
}: ComicPageStageProps) => {
  if (readingMode === "strip") {
    return (
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
        {loading && <p className="text-sm text-muted">Loading pages...</p>}
        {error && <p className="text-sm text-muted">Failed to load this comic.</p>}
        {!loading && !error && pages.length === 0 && (
          <p className="text-sm text-muted">No pages found in this file.</p>
        )}
        {!loading && pages.length > 0 && (
          <div className="h-full w-full overflow-y-auto">
            <div className="mx-auto w-full max-w-[min(90%,48rem)]">
              {pages.map((page, index) => (
                <img
                  key={page}
                  src={page}
                  alt={`Page ${index + 1}`}
                  draggable={false}
                  loading="lazy"
                  className="block w-full"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
      {loading && <p className="text-sm text-muted">Loading pages...</p>}
      {error && <p className="text-sm text-muted">Failed to load this comic.</p>}
      {!loading && !error && pages.length === 0 && (
        <p className="text-sm text-muted">No pages found in this file.</p>
      )}
      {!loading && pages.length > 0 && (
        <img
          key={pages[currentPage]}
          src={pages[currentPage]}
          alt={`Page ${currentPage + 1}`}
          draggable={false}
          className="h-full w-full object-contain"
        />
      )}

      {hasPrev && (
        <button
          type="button"
          aria-label="Previous page"
          onClick={onPrev}
          className="absolute left-0 top-0 h-full w-1/3 cursor-pointer opacity-0"
        />
      )}
      {hasNext && (
        <button
          type="button"
          aria-label="Next page"
          onClick={onNext}
          className="absolute right-0 top-0 h-full w-1/3 cursor-pointer opacity-0"
        />
      )}
    </div>
  );
};

export default ComicPageStage;
