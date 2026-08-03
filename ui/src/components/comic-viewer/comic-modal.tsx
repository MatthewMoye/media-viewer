import { useEffect, useState, useCallback, useMemo } from "react";
import { authenticatedFetch } from "@/utils/authenticated-fetch";
import { useComicViewer } from "./context/use-comic-viewer";

const ComicModal = () => {
  const { activeComic, closeComic } = useComicViewer();

  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!activeComic) return;

    let isMounted = true;

    (async () => {
      setShowInfo(false);
      setLoading(true);

      try {
        const res = await authenticatedFetch(
          `/api/comics/${activeComic.id}/pages`,
        );
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

  const formattedSize = useMemo(() => {
    if (!activeComic?.size) return "";
    return new Intl.NumberFormat().format(activeComic.size);
  }, [activeComic]);

  const formattedModified = useMemo(() => {
    if (!activeComic?.modified) return "";
    return new Date(activeComic.modified).toLocaleString();
  }, [activeComic]);

  if (!activeComic) return null;

  const hasPrev = currentPage > 0;
  const hasNext = currentPage < pages.length - 1;

  const releaseParts = [
    activeComic.year,
    activeComic.month,
    activeComic.day,
  ].filter((part): part is number => typeof part === "number");
  const releaseDate =
    releaseParts.length > 0 ? releaseParts.join("-") : "Unknown";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={activeComic.title}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-surface bg-surface-90 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary">
            {activeComic.title}
          </p>
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
            onClick={() => setShowInfo((current) => !current)}
            className="rounded-full bg-surface-strong px-3 py-2 text-xs font-semibold text-primary transition hover:bg-accent"
          >
            {showInfo ? "Hide info" : "Info"}
          </button>
          <button
            type="button"
            onClick={closeComic}
            className="rounded-full bg-surface-strong px-3 py-2 text-xs font-semibold text-primary transition hover:bg-accent"
          >
            Close
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black md:flex-row">
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
              className="h-full w-full object-contain"
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

        {showInfo && (
          <aside className="w-full shrink-0 overflow-y-auto border-t border-surface bg-surface-90 p-4 text-sm text-primary md:w-[320px] md:border-l md:border-t-0">
            <h3 className="mb-3 text-sm font-semibold text-primary">
              Comic details
            </h3>

            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-muted">Title</dt>
                <dd className="break-all">{activeComic.title}</dd>
              </div>
              <div>
                <dt className="text-muted">Filename</dt>
                <dd className="break-all">{activeComic.filename}</dd>
              </div>
              <div>
                <dt className="text-muted">Author</dt>
                <dd>{activeComic.author || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-muted">Release date</dt>
                <dd>{releaseDate}</dd>
              </div>
              <div>
                <dt className="text-muted">Series</dt>
                <dd>{activeComic.series || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-muted">Format</dt>
                <dd>{activeComic.format || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-muted">Genre</dt>
                <dd>{activeComic.genre || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-muted">Tags</dt>
                <dd className="break-all">{activeComic.tags || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-muted">Web</dt>
                <dd className="break-all">{activeComic.web || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-muted">Library root</dt>
                <dd>{activeComic.root || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-muted">Parent folder</dt>
                <dd>{activeComic.parent_folder || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-muted">Size</dt>
                <dd>{formattedSize}</dd>
              </div>
              <div>
                <dt className="text-muted">Modified</dt>
                <dd>{formattedModified}</dd>
              </div>
            </dl>
          </aside>
        )}
      </div>
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
