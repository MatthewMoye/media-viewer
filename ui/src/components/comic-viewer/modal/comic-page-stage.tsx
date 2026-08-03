type ComicPageStageProps = {
  pages: string[];
  currentPage: number;
  loading: boolean;
  error: boolean;
  hasPrev: boolean;
  hasNext: boolean;
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
  onPrev,
  onNext,
}: ComicPageStageProps) => {
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
          className="absolute left-0 top-0 h-full w-1/3 cursor-w-resize opacity-0"
        />
      )}
      {hasNext && (
        <button
          type="button"
          aria-label="Next page"
          onClick={onNext}
          className="absolute right-0 top-0 h-full w-1/3 cursor-e-resize opacity-0"
        />
      )}
    </div>
  );
};

export default ComicPageStage;
