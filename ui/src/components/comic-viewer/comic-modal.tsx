import { useEffect, useState, useCallback } from "react";
import { authenticatedFetch } from "@/utils/authenticated-fetch";
import { useComicViewer } from "./context/use-comic-viewer";

const ComicModal = () => {
  const { activeComic, closeComic } = useComicViewer();

  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!activeComic) return;

    let isMounted = true;

    (async () => {
      setLoading(true);

      try {
        const res = await authenticatedFetch(`/api/comics/${activeComic.id}/pages`);
        if (!res.ok) throw new Error("Failed to fetch pages");
        const data: { pages: string[] } = await res.json();
        if (isMounted) {
          setPages(data.pages);
          setError(false);
          setCurrentPage(0);
        }
      } catch {
        if (isMounted) {
          setError(true);
          setPages([]);
          setCurrentPage(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [activeComic]);

  const goToPrev = useCallback(
    () => setCurrentPage((p) => Math.max(0, p - 1)),
    [],
  );

  const goToNext = useCallback(
    () => setCurrentPage((p) => Math.min(pages.length - 1, p + 1)),
    [pages.length],
  );

  useEffect(() => {
    if (!activeComic) return;

    // Push history state for back button support
    window.history.pushState({ modal: "comic" }, "");

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.modal === "comic") {
        closeComic();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [activeComic, closeComic]);

  useEffect(() => {
    if (!activeComic) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeComic();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goToNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goToPrev();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeComic, closeComic, goToNext, goToPrev]);

  useEffect(() => {
    if (!activeComic) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeComic]);

  if (!activeComic) return null;

  const hasPrev = currentPage > 0;
  const hasNext = currentPage < pages.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={activeComic.title}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface bg-surface-90 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary">
            {activeComic.title}
          </p>
          {pages.length > 0 && (
            <p className="text-xs text-muted">
              Page {currentPage + 1} of {pages.length}
            </p>
          )}
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          {pages.length > 0 && (
            <>
              <button
                type="button"
                onClick={goToPrev}
                disabled={!hasPrev}
                className="rounded-full bg-surface-strong px-3 py-2 text-xs font-semibold text-primary transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-accent"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={goToNext}
                disabled={!hasNext}
                className="rounded-full bg-surface-strong px-3 py-2 text-xs font-semibold text-primary transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-accent"
              >
                Next →
              </button>
            </>
          )}
          <button
            type="button"
            onClick={closeComic}
            className="rounded-full bg-surface-strong px-3 py-2 text-xs font-semibold text-primary transition hover:bg-accent"
          >
            Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black">
        {loading && <p className="text-sm text-muted">Loading pages...</p>}
        {error && (
          <p className="text-sm text-muted">Failed to load this comic.</p>
        )}
        {!loading && !error && pages.length === 0 && (
          <p className="text-sm text-muted">No pages found in this file.</p>
        )}
        {!loading && pages.length > 0 && (
          <img
            key={pages[currentPage]}
            src={pages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            draggable={false}
            className="max-h-full max-w-full object-contain"
          />
        )}

        {hasPrev && (
          <button
            type="button"
            aria-label="Previous page"
            onClick={goToPrev}
            className="absolute left-0 top-0 h-full w-1/3 cursor-w-resize opacity-0"
          />
        )}
        {hasNext && (
          <button
            type="button"
            aria-label="Next page"
            onClick={goToNext}
            className="absolute right-0 top-0 h-full w-1/3 cursor-e-resize opacity-0"
          />
        )}
      </div>

      {/* Footer */}
      {pages.length > 1 && (
        <div className="flex shrink-0 items-center justify-center border-t border-surface bg-surface-90 py-2">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
            {currentPage + 1} / {pages.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default ComicModal;
